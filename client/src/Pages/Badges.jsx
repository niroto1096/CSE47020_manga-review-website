import React, { useEffect, useState } from 'react';
import { getBadgesApi } from '@/Api/authApi';

export default function Badges() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getBadgesApi();
        setBadges(data.badges || []);
      } catch (e) {
        setError('Failed to load badges');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading badges...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const categories = [...new Set(badges.map(b => b.category))];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">🏆 Badges & Achievements</h1>
      
      {categories.map(category => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.filter(b => b.category === category).map(badge => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BadgeCard({ badge }) {
  const progressPercent = Math.min(100, (badge.progress / badge.threshold) * 100);
  
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      badge.unlocked 
        ? 'bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-600' 
        : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-600'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-2xl ${badge.unlocked ? '' : 'grayscale opacity-50'}`}>
          {badge.icon}
        </span>
        <div>
          <h3 className={`font-semibold ${badge.unlocked ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-800 dark:text-gray-200'}`}>
            {badge.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {badge.description}
          </p>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className={badge.unlocked ? 'text-green-600 font-semibold' : 'text-gray-800 dark:text-gray-200'}>
            {badge.progress} / {badge.threshold}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className={`h-2 rounded-full transition-all ${
              badge.unlocked ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
      
      {badge.unlocked && (
        <div className="text-center">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ Unlocked
          </span>
        </div>
      )}
    </div>
  );
}