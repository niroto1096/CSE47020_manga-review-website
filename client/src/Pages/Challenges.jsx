import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/challenge/challenges', {
        withCredentials: true
      });
      setChallenges(response.data.challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeChallenge = async (challengeId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/challenge/challenges/${challengeId}/complete`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.message === 'Challenge completed!') {
        // Refresh challenges to show updated status
        fetchChallenges();
        // Show success message
        alert(`🎉 Challenge completed! +${response.data.xpAwarded} XP`);
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert(error.response?.data?.message || 'Error completing challenge');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 pt-24">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-4xl font-bold text-gray-800">🎯 Daily Challenges</h1>
        <div className="text-sm text-gray-500">Complete challenges to earn XP!</div>
      </div>

      <div className="space-y-6">
        {challenges.map((challenge) => {
          const participant = challenge.participants[0];
          const progress = participant?.progress || 0;
          const target = challenge.target;
          const completed = participant?.completed || false;
          const progressPercentage = Math.min((progress / target) * 100, 100);

          return (
            <div
              key={challenge._id}
              className={`bg-white rounded-xl shadow-lg p-6 border-l-4 transition-all duration-300 ${
                completed
                  ? 'border-green-500 bg-green-50'
                  : progress > 0
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${completed ? '✅' : '🎯'}`}>
                    {completed ? '✅' : '🎯'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">{challenge.title}</h3>
                    <p className="text-gray-600">{challenge.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${completed ? 'text-green-600' : 'text-blue-600'}`}>
                    +{challenge.xpReward} XP
                  </div>
                  <div className="text-sm text-gray-500">Reward</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: {progress} / {target}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      completed
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {challenge.type === 'daily' && 'Resets tomorrow'}
                  {challenge.type === 'weekly' && 'Resets next week'}
                  {challenge.type === 'monthly' && 'Resets next month'}
                </div>
                
                {completed ? (
                  <div className="flex items-center gap-2 text-green-600 font-semibold">
                    <span>✅ Completed!</span>
                    {participant.completedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(participant.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : progress >= target ? (
                  <button
                    onClick={() => completeChallenge(challenge._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    🎉 Claim Reward
                  </button>
                ) : (
                  <div className="text-gray-500 font-medium">
                    {target - progress} more to go!
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No challenges available</h3>
          <p className="text-gray-500">Check back tomorrow for new challenges!</p>
        </div>
      )}
    </div>
  );
};

export default Challenges;