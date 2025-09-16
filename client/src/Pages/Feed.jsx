import React, { useEffect, useState } from 'react';
import { getFeedApi } from '@/Api/authApi';
import { Link } from 'react-router-dom';

const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:8000";

export default function Feed() {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getFeedApi();
      setFeed(res?.data?.feed || []);
    } catch (e) {
      console.error('Failed to load feed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onSocial = () => load();
    window.addEventListener('social:follow-updated', onSocial);
    return () => window.removeEventListener('social:follow-updated', onSocial);
  }, []);

  if (loading) return <div className="p-6 mt-16">Loading feed...</div>;
  if (!feed || feed.length === 0) return <div className="p-6 mt-16">No recent activity from users you follow.</div>;

  return (
    <div className="p-6 mt-16">
      <h2 className="text-2xl font-semibold mb-4">Activity Feed</h2>
      <div className="space-y-4">
        {feed.map((item) => (
          <div key={item._id} className="p-4 bg-white dark:bg-gray-800 rounded shadow">
            <div className="flex items-center gap-3">
              <img
                src={item.user?.avatar ? `${IMAGE_BASE}/${item.user.avatar.startsWith('uploads/') ? item.user.avatar : `uploads/${item.user.avatar}`}` : '/vite.svg'}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <Link to={`/user/${item.user?._id}`} className="text-sm text-blue-600">{item.user?.name || 'User'}</Link>
                <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-3">
              {item.type === 'review' ? (
                <>
                  <div className="text-sm mb-2">Reviewed <Link to={`/manga-detail/${item.manga?._id}`} className="text-blue-600">{item.manga?.title || 'manga'}</Link></div>
                  <div className="text-sm">Rating: {item.rating} / 5</div>
                  <div className="mt-2 text-gray-700 dark:text-gray-200">{item.review}</div>
                </>
              ) : (
                <>
                  <div className="text-sm mb-1">Rated <Link to={`/manga-detail/${item.manga?._id}`} className="text-blue-600">{item.manga?.title || 'manga'}</Link></div>
                  <div className="text-sm">Score: {item.score} / 5</div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
