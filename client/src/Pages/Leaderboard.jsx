import React, { useEffect, useState } from 'react';
import { getLeaderboardApi } from '@/Api/authApi';

const IMAGE_BASE = import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:8000';

export default function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getLeaderboardApi();
        setUsers(data.users || []);
      } catch (e) {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🏆 Leaderboard</h1>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 rounded-lg shadow">
        {users.length === 0 ? (
          <div className="p-6 text-gray-600 dark:text-gray-400">No users yet.</div>
        ) : (
          users.map((u, idx) => (
            <div key={u._id || idx} className="flex items-center gap-4 p-4">
              <div className="w-8 text-center font-semibold">{idx + 1}</div>
              <img
                src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${IMAGE_BASE}/uploads/${u.avatar.replace(/^\/+/, '')}`) : 'https://c8.alamy.com/comp/2PWERD5/student-avatar-illustration-simple-cartoon-user-portrait-user-profile-icon-youth-avatar-vector-illustration-2PWERD5.jpg'}
                alt={u.name || 'User'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 dark:text-white">{u.name || 'User'}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Level {u.level ?? 1} • XP {u.xp ?? 0} (Total {u.totalXp ?? 0})
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                Reviews: {u.totalReviews ?? 0} • Comments: {u.totalComments ?? 0} • Likes Recv: {u.totalReviewLikesReceived ?? 0}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
