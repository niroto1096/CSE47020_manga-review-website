import React, { useEffect, useState } from 'react';
import { getPublicUserApi, followApi, unfollowApi, getPersonalListPublicApi, getUserReviewsPublicApi, getFavoritesPublicApi } from '@/Api/authApi';
import { Link, useParams } from 'react-router-dom';

const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export default function UserProfile() {
  const { id } = useParams();
  const me = localStorage.getItem('userId');
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [publicLists, setPublicLists] = useState({ list: [], listPrivacy: 'private', reviews: [], reviewsPrivacy: 'private', favorites: [], favoritesPrivacy: 'private' });

  const isMe = String(me || '') === String(id || '');

  const load = async () => {
    setLoading(true);
    try {
  const { data } = await getPublicUserApi(id);
      setUser(data.user);
      // compute following based on whether me is in user's followers
      const followers = data?.user?.followers || [];
      const mine = String(me || '');
      setIsFollowing(Array.isArray(followers) && followers.some((u) => String(u._id || u) === mine));
      // fetch public data for sections (endpoints respect privacy)
      try {
        const [pl, rv, fv] = await Promise.allSettled([
          getPersonalListPublicApi(id),
          getUserReviewsPublicApi(id),
          getFavoritesPublicApi(id),
        ]);
        const list = pl.status === 'fulfilled' ? (pl.value?.data?.items || []) : [];
        const listPrivacy = pl.status === 'fulfilled' ? (pl.value?.data?.privacy || 'private') : 'private';
        const reviews = rv.status === 'fulfilled' ? (rv.value?.data?.items || []) : [];
        const reviewsPrivacy = rv.status === 'fulfilled' ? (rv.value?.data?.privacy || 'private') : 'private';
        const favorites = fv.status === 'fulfilled' ? (fv.value?.data?.favorites || []) : [];
        const favoritesPrivacy = fv.status === 'fulfilled' ? (fv.value?.data?.privacy || 'private') : 'private';
        setPublicLists({ list, listPrivacy, reviews, reviewsPrivacy, favorites, favoritesPrivacy });
      } catch {}
    } catch (e) {
      console.error('Failed to load user', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const avatarUrl = (a) => {
    if (!a) return 'https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg';
    if (a.startsWith('http')) return a;
    const clean = a.replace(/^\/+/, '');
    return clean.startsWith('uploads/') ? `${IMAGE_BASE}/${clean}` : `${IMAGE_BASE}/uploads/${clean}`;
  };

  const doFollow = async () => {
    if (busy) return; setBusy(true);
    const before = isFollowing;
    setIsFollowing(true);
    try {
      await followApi(id);
      await load();
    } catch (e) {
      console.error(e);
      setIsFollowing(before);
    } finally { setBusy(false); }
  };
  const doUnfollow = async () => {
    if (busy) return; setBusy(true);
    const before = isFollowing;
    setIsFollowing(false);
    try {
      await unfollowApi(id);
      await load();
    } catch (e) {
      console.error(e);
      setIsFollowing(before);
    } finally { setBusy(false); }
  };

  if (loading) return <div className="p-6 mt-16">Loading...</div>;
  if (!user) return <div className="p-6 mt-16">User not found</div>;

  const imgSrc = (m) => !m?.image ? '' : (m.image.startsWith('http') ? m.image : `${IMAGE_BASE}/${(m.image || '').replace(/^\/+/, '')}`);
  const MangaCard = ({ m, status, rating }) => (
    <div
      key={m?._id || m?.id}
      className="rounded-lg shadow overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
      onClick={() => (window.location.href = `/manga-detail/${m._id || m.id}`)}
    >
      {imgSrc(m) && (
        <img src={imgSrc(m)} alt={m?.title || 'Manga'} className="w-full h-40 object-cover" onError={(e)=> (e.currentTarget.style.display='none')} />
      )}
      <div className="p-3">
        <div className="font-semibold line-clamp-2">{m?.title || 'Untitled'}</div>
        <div className="text-xs text-gray-600 dark:text-gray-400">{m?.author || 'Unknown'}</div>
        {(rating || status) && (
          <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">
            {typeof rating === 'number' && rating > 0 ? `⭐ ${rating}/5` : null}
            {status ? <span className="ml-2 px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-700/40 text-yellow-700 dark:text-yellow-300">{status}</span> : null}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 mt-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <img src={avatarUrl(user.avatar)} alt="avatar" className="w-20 h-20 rounded-full object-cover" />
        <div>
          <h2 className="text-2xl font-semibold">{user.name || 'User'}</h2>
          {/* Hide internal IDs from UI */}
        </div>
        <div className="ml-auto">
          {!isMe && (
            isFollowing ? (
              <button onClick={doUnfollow} disabled={busy} className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded">Unfollow</button>
            ) : (
              <button onClick={doFollow} disabled={busy} className="px-3 py-1 bg-blue-600 text-white rounded">Follow</button>
            )
          )}
        </div>
      </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="font-semibold mb-2">Following ({user?.following?.length || 0})</h3>
          <ul className="space-y-2">
      {(user?.following || []).map((u) => (
              <li key={`f-${u._id || u}`} className="flex items-center gap-3">
                <img src={avatarUrl(u.avatar)} alt="a" className="w-8 h-8 rounded-full" />
        <Link to={`/user/${u._id || u}`} className="text-blue-600">{u.name || 'User'}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <h3 className="font-semibold mb-2">Followers ({user?.followers?.length || 0})</h3>
          <ul className="space-y-2">
      {(user?.followers || []).map((u) => (
              <li key={`r-${u._id || u}`} className="flex items-center gap-3">
                <img src={avatarUrl(u.avatar)} alt="a" className="w-8 h-8 rounded-full" />
        <Link to={`/user/${u._id || u}`} className="text-blue-600">{u.name || 'User'}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Public sections or private indicators */}
      <div className="space-y-8 mt-6">
        {/* Personal List */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">📚 Personal List</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{publicLists.listPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {publicLists.listPrivacy !== 'public' ? (
            <p className="text-sm text-gray-500">This list is private.</p>
          ) : publicLists.list.length === 0 ? (
            <p className="text-sm text-gray-500">No items shared.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicLists.list.map((entry) => (
                <MangaCard key={entry._id} m={entry.manga} status={entry.status} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">📝 Reviews</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{publicLists.reviewsPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {publicLists.reviewsPrivacy !== 'public' ? (
            <p className="text-sm text-gray-500">This section is private.</p>
          ) : publicLists.reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews shared.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicLists.reviews.map((r) => (
                <MangaCard key={r._id} m={r.manga} rating={r.rating} />
              ))}
            </div>
          )}
        </section>

        {/* Favorites */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">💖 Favorites</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{publicLists.favoritesPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {publicLists.favoritesPrivacy !== 'public' ? (
            <p className="text-sm text-gray-500">This section is private.</p>
          ) : publicLists.favorites.length === 0 ? (
            <p className="text-sm text-gray-500">No favorites shared.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicLists.favorites.map((m) => (
                <MangaCard key={m._id || m.id} m={m} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
