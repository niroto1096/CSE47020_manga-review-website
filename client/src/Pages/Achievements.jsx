import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Achievements = () => {
  const [userAchievements, setUserAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('unlocked'); // 'unlocked' or 'all'

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      const [userResponse, allResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/achievements/user', { withCredentials: true }),
        axios.get('http://localhost:8080/api/achievements/all', { withCredentials: true })
      ]);
      
      setUserAchievements(userResponse.data.achievements);
      setStats(userResponse.data.stats);
      setAllAchievements(allResponse.data.achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'common': return '⚪';
      case 'rare': return '🔵';
      case 'epic': return '🟣';
      case 'legendary': return '🟡';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-24">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-4xl font-bold text-gray-800">🏆 Achievements</h1>
        <div className="text-sm text-gray-500">Track your progress and unlock rewards</div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 text-center shadow-md">
          <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total Unlocked</div>
        </div>
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 text-center shadow-md">
          <div className="text-xl font-bold text-gray-700">{stats.common || 0}</div>
          <div className="text-xs text-gray-600">⚪ Common</div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 text-center shadow-md">
          <div className="text-xl font-bold text-blue-700">{stats.rare || 0}</div>
          <div className="text-xs text-blue-600">🔵 Rare</div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-4 text-center shadow-md">
          <div className="text-xl font-bold text-purple-700">{stats.epic || 0}</div>
          <div className="text-xs text-purple-600">🟣 Epic</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl p-4 text-center shadow-md">
          <div className="text-xl font-bold text-yellow-700">{stats.legendary || 0}</div>
          <div className="text-xs text-yellow-600">🟡 Legendary</div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('unlocked')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'unlocked'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Unlocked ({userAchievements.length})
        </button>
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Achievements ({allAchievements.length})
        </button>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {view === 'unlocked' ? (
          userAchievements.length > 0 ? (
            userAchievements.map((achievement) => (
              <div
                key={achievement._id}
                className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <h3 className="font-bold text-gray-800">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-clip-text text-transparent`}>
                      {getRarityIcon(achievement.rarity)} {achievement.rarity.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <div className="text-green-600 font-semibold">
                    ✅ Unlocked! +{achievement.xpReward} XP
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                </div>
                
                {achievement.specialReward && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm font-medium text-yellow-800">
                      🎁 Special Reward: {achievement.specialReward.value}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No achievements yet</h3>
              <p className="text-gray-500">Start reviewing and engaging to unlock achievements!</p>
            </div>
          )
        ) : (
          allAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`rounded-xl shadow-lg p-6 border-l-4 transition-all duration-300 ${
                achievement.unlocked
                  ? 'bg-white border-green-500'
                  : 'bg-gray-50 border-gray-300 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{achievement.unlocked ? '🏆' : '🔒'}</div>
                  <div>
                    <h3 className={`font-bold ${achievement.unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                      {achievement.title}
                    </h3>
                    <p className={`text-sm ${achievement.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold bg-gradient-to-r ${getRarityColor(achievement.rarity)} bg-clip-text text-transparent`}>
                    {getRarityIcon(achievement.rarity)} {achievement.rarity.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-4">
                <div className={`font-semibold ${achievement.unlocked ? 'text-green-600' : 'text-gray-500'}`}>
                  {achievement.unlocked ? '✅ Unlocked!' : '🔒 Locked'} +{achievement.xpReward} XP
                </div>
                {!achievement.unlocked && (
                  <div className="text-xs text-gray-400">Keep exploring to unlock!</div>
                )}
              </div>
              
              {achievement.specialReward && (
                <div className={`mt-3 p-2 rounded-lg border ${
                  achievement.unlocked
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-100 border-gray-200'
                }`}>
                  <div className={`text-sm font-medium ${
                    achievement.unlocked ? 'text-yellow-800' : 'text-gray-500'
                  }`}>
                    🎁 Special Reward: {achievement.specialReward.value}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Achievements;