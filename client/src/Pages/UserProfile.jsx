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
  const [publicLists, setPublicLists] = useState({ list: [], reviews: [], favorites: [] });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">📚 Personal List</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{user.personalListPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {user.personalListPrivacy === 'public' ? (
            <p className="text-sm text-gray-500">Visible on their Profile page.</p>
          ) : (
            <p className="text-sm text-gray-500">This list is private.</p>
          )}
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">📝 Reviews</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{user.reviewedPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {user.reviewedPrivacy === 'public' ? (
            <p className="text-sm text-gray-500">Visible on their Profile page.</p>
          ) : (
            <p className="text-sm text-gray-500">This section is private.</p>
          )}
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">💖 Favorites</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700">{user.favoritesPrivacy === 'public' ? 'Public' : 'Private'}</span>
          </div>
          {user.favoritesPrivacy === 'public' ? (
            <p className="text-sm text-gray-500">Visible on their Profile page.</p>
          ) : (
            <p className="text-sm text-gray-500">This section is private.</p>
          )}
        </div>
      </div>
    </div>
  );
}
