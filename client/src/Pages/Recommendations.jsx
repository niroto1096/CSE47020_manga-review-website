import React from 'react';
import { useGetPersonalizedRecommendationsQuery, useGetTrendingMangaQuery } from '../Api/recommendationApi';
import { Link } from 'react-router-dom';

const Recommendations = () => {
  const { data: recommendations, isLoading: recLoading } = useGetPersonalizedRecommendationsQuery();
  const { data: trending, isLoading: trendLoading } = useGetTrendingMangaQuery();

  if (recLoading || trendLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-300 h-64 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 pt-24 space-y-12">
      {/* Personalized Recommendations */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">📚 For You</h2>
          <div className="text-sm text-gray-500">Based on your ratings</div>
        </div>
        
        {recommendations?.recommendations?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.recommendations.map((manga) => (
              <Link
                key={manga._id}
                to={`/manga/${manga._id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={`http://localhost:8080/uploads/${manga.image}`}
                    alt={manga.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    ⭐ {manga.avgScore?.toFixed(1) || 'N/A'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {manga.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {manga.genres?.slice(0, 2).join(', ')}
                  </p>
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    {manga.recommendCount} similar users recommend this
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No recommendations yet</h3>
            <p className="text-gray-500">Rate some manga to get personalized recommendations!</p>
          </div>
        )}
      </section>

      {/* Trending Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-3xl font-bold text-gray-800">🔥 Trending This Week</h2>
          <div className="text-sm text-gray-500">Most reviewed recently</div>
        </div>
        
        {trending?.trending?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trending.trending.map((manga, index) => (
              <Link
                key={manga._id}
                to={`/manga/${manga._id}`}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={`http://localhost:8080/uploads/${manga.image}`}
                    alt={manga.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    #{index + 1} Trending
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 group-hover:text-red-600 transition-colors">
                    {manga.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {manga.genres?.slice(0, 2).join(', ')}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-red-600 font-medium">🔥 Hot</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No trending manga yet</h3>
            <p className="text-gray-500">Be the first to review and rate manga!</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Recommendations;