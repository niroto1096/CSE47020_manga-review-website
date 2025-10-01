import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [recentChallenges, setRecentChallenges] = useState([]);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [challengesResponse, achievementsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/challenge/challenges', { withCredentials: true }),
        axios.get('http://localhost:8080/api/achievements/user', { withCredentials: true })
      ]);
      
      setRecentChallenges(challengesResponse.data.challenges.slice(0, 3));
      setRecentAchievements(achievementsResponse.data.achievements.slice(0, 5));
      setUserStats(achievementsResponse.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelProgress = () => {
    if (!user) return 0;
    const currentLevelXp = user.level * 100;
    const nextLevelXp = (user.level + 1) * 100;
    const progress = ((user.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 pt-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="text-5xl">🎮</div>
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Gaming Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name}! Track your progress and achievements.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Level Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">⭐</div>
            <div className="text-right">
              <div className="text-2xl font-bold">Level {user?.level || 1}</div>
              <div className="text-blue-200 text-sm">{user?.xp || 0} XP</div>
            </div>
          </div>
          <div className="mb-2 text-sm text-blue-200">Progress to Level {(user?.level || 1) + 1}</div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${getLevelProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🔥</div>
            <div className="text-right">
              <div className="text-2xl font-bold">{user?.loginStreak || 0} Days</div>
              <div className="text-orange-200 text-sm">Login Streak</div>
            </div>
          </div>
          <div className="text-orange-100 text-sm">
            Activity Streak: {user?.activityStreak || 0} days
          </div>
        </div>

        {/* Achievements Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🏆</div>
            <div className="text-right">
              <div className="text-2xl font-bold">{userStats?.total || 0}</div>
              <div className="text-purple-200 text-sm">Achievements</div>
            </div>
          </div>
          <div className="text-purple-100 text-sm">
            +{userStats?.totalXpEarned || 0} XP from achievements
          </div>
        </div>

        {/* Reviews Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">📝</div>
            <div className="text-right">
              <div className="text-2xl font-bold">{user?.totalReviews || 0}</div>
              <div className="text-green-200 text-sm">Reviews Written</div>
            </div>
          </div>
          <div className="text-green-100 text-sm">
            {user?.totalComments || 0} comments posted
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Challenges */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🎯 Active Challenges</h2>
            <Link 
              to="/challenges" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentChallenges.length > 0 ? (
            <div className="space-y-4">
              {recentChallenges.map((challenge) => {
                const participant = challenge.participants[0];
                const progress = participant?.progress || 0;
                const target = challenge.target;
                const completed = participant?.completed || false;
                const progressPercentage = Math.min((progress / target) * 100, 100);

                return (
                  <div
                    key={challenge._id}
                    className={`p-4 rounded-lg border transition-all ${
                      completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{challenge.title}</h3>
                      <span className={`text-sm font-medium ${completed ? 'text-green-600' : 'text-blue-600'}`}>
                        +{challenge.xpReward} XP
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              completed ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {progress}/{target}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎯</div>
              <p>No active challenges</p>
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🏆 Recent Achievements</h2>
            <Link 
              to="/achievements" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              View All →
            </Link>
          </div>
          
          {recentAchievements.length > 0 ? (
            <div className="space-y-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl">🏆</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-green-600 font-semibold text-sm">
                    +{achievement.xpReward} XP
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🏆</div>
              <p>No achievements yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          to="/challenges"
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-semibold">Challenges</div>
        </Link>
        <Link
          to="/achievements"
          className="bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-2">🏆</div>
          <div className="font-semibold">Achievements</div>
        </Link>
        <Link
          to="/leaderboard"
          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-2">👑</div>
          <div className="font-semibold">Leaderboard</div>
        </Link>
        <Link
          to="/recommendations"
          className="bg-green-100 hover:bg-green-200 text-green-800 rounded-xl p-4 text-center transition-colors"
        >
          <div className="text-2xl mb-2">📚</div>
          <div className="font-semibold">For You</div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;