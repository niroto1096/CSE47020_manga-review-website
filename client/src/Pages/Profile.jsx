import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAllManga, getMyPersonalList, getUserReviewApi, getReviewSummaryApi } from "@/Api/mangaApi";
import { uploadAvatar, verifyUser as verifyUserApi, getPublicUserApi } from "@/Api/authApi";

const IMAGE_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

const Profile = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username") || "Guest";

  const [personalList, setPersonalList] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [reviewed, setReviewed] = useState([]); // NEW
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState({}); // { [mangaId]: 1..5 }
  const [profileDebug, setProfileDebug] = useState({ reviewedCount: 0, ratingsCount: 0, error: null });
  const DEBUG = false; // hide debug UI in production
  const [avgRatings, setAvgRatings] = useState({}); // { [mangaId]: { average, count } }
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const fileRef = useRef();

  // helpers
  const isReviewedByUser = (m) => {
    if (!m) return false;
    if (Array.isArray(m.raters) && userId) {
      if (m.raters.includes(userId)) return true;
      if (m.raters.some((r) => (r?._id || r?.id) === userId)) return true;
    }
    if (Array.isArray(m.ratings) && userId) {
      if (
        m.ratings.some(
          (r) => (r?.user?._id || r?.user?.id || r?.user) === userId
        )
      ) {
        return true;
      }
    }
    return false;
  };

  const imgSrc = (m) =>
    !m?.image
      ? ""
      : m.image.startsWith("http")
      ? m.image
      : `${IMAGE_BASE}/${m.image.replace(/^\/+/, "")}`;

  useEffect(() => {
    (async () => {
      try {
        // fetch verified user to get avatar if available
        try {
          const v = await verifyUserApi();
          const u = v?.data?.user;
          if (u?.avatar) setAvatar(u.avatar);
        } catch (e) {
          // ignore
        }
        if (userId) {
          // also fetch followers count for this user
          try {
            const { data } = await getPublicUserApi(userId);
            const fc = Array.isArray(data?.user?.followers) ? data.user.followers.length : 0;
            setFollowersCount(fc);
            const fgc = Array.isArray(data?.user?.following) ? data.user.following.length : 0;
            setFollowingCount(fgc);
          } catch (e) {
            // ignore
          }
          const res = await getMyPersonalList(userId, 1, 20);
          const list = res?.data?.data || res?.data?.items || res?.data || [];
          // hide entries with status === 'unread' (case-insensitive)
          const cleaned = list.filter((e) => {
            const s = (e?.status || "").toString().trim().toLowerCase();
            return s !== "unread";
          });
          setPersonalList(cleaned);
          // fetch live averages for personal list items
          try {
            const sums = await Promise.allSettled(
              cleaned.map(async (entry) => {
                const mid = String(entry?.manga?._id || entry?.manga?.id || entry?.manga);
                const resS = await getReviewSummaryApi(mid);
                const body = resS?.data || {};
                return [mid, { average: body?.average ?? 0, count: body?.count ?? 0 }];
              })
            );
            const map = {};
            sums.forEach((r) => {
              if (r.status === "fulfilled" && Array.isArray(r.value)) {
                map[r.value[0]] = r.value[1];
              }
            });
            setAvgRatings(map);
          } catch (err) {
            console.debug("Profile: failed to fetch avgRatings", err);
          }
        }

        const resM = await getAllManga("");
        const mangas = resM?.data?.manga || resM?.data || [];

        setFeatured(mangas.filter((m) => m.featured === true));

        const top5 = [...mangas]
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
          .slice(0, 5);
        setRecommended(top5);

        // fetch favorites for profile
        try {
          const favRes = await (await import('@/Api/authApi')).getFavoritesApi();
          const favs = favRes?.data?.favorites || favRes?.data || [];
          // favs are full manga objects
          setFeatured((prev)=>prev); // no-op to avoid lint
          setReviewed((r)=>r);
          // store favorites separately
          setFavoriteList(favs || []);
        } catch (e) {
          // ignore
        }

        // reviewed by current user
        if (userId) {
          // We'll check user reviews via the review API, since reviews/ratings are stored
          // in separate collections and may not appear directly on the manga documents.
          const reviewedList = [];

          // Build a set of mangaIds we want to fetch user review data for (featured + top5)
          const ids = new Set();
          (mangas.filter((m) => m.featured === true) || []).forEach((m) => ids.add(String(m._id || m.id)));
          top5.forEach((m) => ids.add(String(m._id || m.id)));

          // Check every manga to see if the user has a review for it.
          const checks = await Promise.all(
            mangas.map(async (m) => {
              const mid = String(m._id || m.id);
              try {
                const { data } = await getUserReviewApi(mid, userId);
                if (data && data.review) {
                  reviewedList.push(m);
                  ids.add(mid);
                  return [mid, Number(data.review.rating ?? 0)];
                }
                return null;
              } catch (err) {
                // 404 or no review — ignore
                return null;
              }
            })
          );

          const entries = checks.filter(Boolean);

          // For the remaining ids (featured/top5) that didn't return in checks, try to fetch ratings so we can show them where needed
          const remaining = Array.from(ids).filter((id) => !entries.some((e) => e[0] === id));
          const more = await Promise.all(
            remaining.map(async (mid) => {
              try {
                const { data } = await getUserReviewApi(mid, userId);
                return [mid, Number(data?.review?.rating ?? 0)];
              } catch {
                return [mid, 0];
              }
            })
          );

          const map = Object.fromEntries([...entries, ...more]);
          setUserRatings(map);
          setReviewed(reviewedList);
          setProfileDebug({ reviewedCount: reviewedList.length, ratingsCount: Object.keys(map).length, error: null });
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const avatarUrl = (a) => {
  if (!a) return "https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg";
  if (a.startsWith('http')) return a;
  // server stores filename only (e.g. "167...jpg"); uploads are served at /uploads/<filename>
  const clean = a.replace(/^\/+/, '');
  if (clean.startsWith('uploads/')) return `${IMAGE_BASE}/${clean}`;
  return `${IMAGE_BASE}/uploads/${clean}`;
  };

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const onUploadAvatar = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await uploadAvatar(fd);
      const u = res?.data?.user;
      if (u?.avatar) setAvatar(u.avatar);
      setAvatarPreview(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      console.error('Avatar upload failed', err);
    }
  };

  // Big vertical card (for all sections)
  const BigCard = ({ m, status, userRating }) => (
    <div
      key={m?._id || m?.id}
      className="rounded-lg shadow-lg overflow-hidden cursor-pointer transition
                 bg-gray-200 hover:bg-gray-300
                 dark:bg-gray-800 dark:hover:bg-gray-700"
      onClick={() => m && navigate(`/manga-detail/${m._id || m.id}`)}
    >
      <img
        src={imgSrc(m)}
        alt={m?.title || "Manga"}
        className="w-full h-60 object-cover"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <div className="p-4">
        <h3 className="text-lg font-bold leading-tight line-clamp-2 text-gray-900 dark:text-gray-100">
          {m?.title || "Untitled"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {m?.author || "Unknown"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {userRating !== undefined ? (
            <>⭐ {userRating}/5</>
          ) : (
            // If this card is part of Personal List (status provided), show live average with 2 decimals and count
            status && (() => {
              const id = String(m?._id || m?.id || "");
              const s = avgRatings[id];
              if (s) return <>{`⭐ ${Number(s.average ?? 0).toFixed(2)}/5 (${s.count ?? 0})`}</>;
              if (Number.isFinite(Number(m?.rating))) return <>{`⭐ ${Number(m.rating).toFixed(2)}/5 (${m?.numRatings ?? 0})`}</>;
              return <>{`⭐ ${(m?.rating ?? userRatings[id] ?? 0)}/5`}</>;
            })()
          )}
        </p>
        {status && (
          <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
            Status: {status}
          </p>
        )}
      </div>
    </div>
  );

  const [favoriteList, setFavoriteList] = React.useState([]);

  const removeFavorite = async (mid) => {
    try {
      const { removeFavoriteApi } = await import('@/Api/authApi');
      await removeFavoriteApi(mid);
      setFavoriteList((prev)=>prev.filter((f)=>String(f._id||f.id)!==String(mid)));
    } catch (e) {
      console.error('remove favorite failed', e);
    }
  };

  return (
    <div className="min-h-screen px-4 py-20 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Profile header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 mb-10">
        <div className="relative">
          <img
            src={avatarPreview || avatarUrl(avatar)}
            alt="Profile Avatar"
            className="w-28 h-28 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <div className="absolute bottom-0 right-0">
            <label className="bg-blue-600 text-white px-2 py-1 rounded text-xs cursor-pointer">
              Change
              <input ref={fileRef} type="file" accept="image/*" onChange={onSelectFile} className="hidden" />
            </label>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold">{username}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Joined: Jan 2025
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
            Followers: {followersCount} • Following: {followingCount}
          </p>
          {avatarPreview && (
            <div className="mt-2 flex items-center gap-2">
              <button onClick={onUploadAvatar} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Upload</button>
              <button onClick={() => { setAvatarPreview(null); if (fileRef.current) fileRef.current.value = ''; }} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-sm rounded">Cancel</button>
            </div>
          )}
        </div>
        
      </div>

      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Loading...
        </p>
      ) : (
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Personal List */}
          {DEBUG && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <strong>DEBUG:</strong>
              <div>UserId: {userId || 'none'}</div>
              <div>Reviewed count: {profileDebug.reviewedCount}</div>
              <div>User ratings stored: {profileDebug.ratingsCount}</div>
              {profileDebug.error && <div>Error: {profileDebug.error}</div>}
              <div className="mt-2">
                <strong>Reviewed titles:</strong>
                {reviewed.length === 0 ? (
                  <div>none</div>
                ) : (
                  <ul className="list-disc ml-6 mt-1 max-h-40 overflow-auto text-xs">
                    {reviewed.map((m, idx) => (
                      <li key={`rv-${idx}`}>{m?.title || m?.name || `id:${m?._id || m?.id}`}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="mt-2">
                <strong>Ratings map (sample):</strong>
                <div className="text-xs mt-1">{Object.entries(userRatings).slice(0,10).map(([k,v])=> `${k}:${v}`).join(', ') || 'none'}</div>
              </div>
            </div>
          )}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📚 My Personal List</h2>
            {personalList.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                You don’t have anything in your list yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {personalList.map((entry) => (
                  <BigCard
                    key={entry._id}
                    m={entry.manga}
                    status={entry.status}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Reviewed */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">📝 Reviewed by You</h2>
            {userId ? (
              reviewed.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  You haven’t reviewed any manga yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {reviewed.map((m) => (
                    <BigCard
                      key={`rev-${m._id || m.id}`}
                      m={m}
                      userRating={userRatings[String(m._id || m.id)]}
                    />
                  ))}
                </div>
              )
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Sign in to see your reviews.
              </p>
            )}
          </section>

          {/* Featured Comics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">⭐ Featured Comics</h2>
            {featured.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">
                No featured comics available.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featured.map((m) => (
                  <BigCard key={`feat-${m._id || m.id}`} m={m} />
                ))}
              </div>
            )}
          </section>

          {/* Favorites */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">💖 Favorites</h2>
            {favoriteList.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">You don't have favorites yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {favoriteList.map((m) => (
                  <div key={`fav-${m._id||m.id}`} className="relative">
                    <BigCard m={m} />
                    <button onClick={()=>removeFavorite(m._id||m.id)} className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recommended Comics */}
          {/* Recommended section intentionally hidden on Profile page */}
        </div>
      )}
    </div>
  );
};

export default Profile;
