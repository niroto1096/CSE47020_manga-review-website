const userModel = require('../models/userModel');
const Review = require('../models/reviewModel');
const Rating = require('../models/ratingModel');
const Manga = require('../models/mangaModel');

// Get personalized recommendations based on user's ratings and reviews
exports.getRecommendations = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get user's highly rated manga (4+ stars)
    const userHighRatings = await Review.find({ 
      user: userId, 
      rating: { $gte: 4 } 
    }).populate('manga').lean();

    // Get users with similar high ratings
    const userMangaIds = userHighRatings.map(r => r.manga._id);
    const similarUsers = await Review.find({
      manga: { $in: userMangaIds },
      rating: { $gte: 4 },
      user: { $ne: userId }
    }).distinct('user');

    // Get manga highly rated by similar users that current user hasn't rated
    const userRatedMangaIds = await Review.find({ user: userId }).distinct('manga');
    const recommendations = await Review.find({
      user: { $in: similarUsers },
      rating: { $gte: 4 },
      manga: { $nin: userRatedMangaIds }
    }).populate('manga').lean();

    // Calculate recommendation scores
    const mangaScores = {};
    recommendations.forEach(r => {
      const mangaId = r.manga._id.toString();
      if (!mangaScores[mangaId]) {
        mangaScores[mangaId] = { manga: r.manga, score: 0, count: 0 };
      }
      mangaScores[mangaId].score += r.rating;
      mangaScores[mangaId].count += 1;
    });

    // Sort by average rating and recommendation count
    const sortedRecommendations = Object.values(mangaScores)
      .map(item => ({
        ...item.manga,
        avgScore: item.score / item.count,
        recommendCount: item.count
      }))
      .sort((a, b) => (b.avgScore * b.recommendCount) - (a.avgScore * a.recommendCount))
      .slice(0, 10);

    return res.status(200).json({ recommendations: sortedRecommendations });
  } catch (err) {
    console.error('getRecommendations error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get trending manga (most reviewed/rated in last 7 days)
exports.getTrending = async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const trending = await Review.aggregate([
      { $match: { createdAt: { $gte: weekAgo } } },
      { 
        $group: {
          _id: '$manga',
          avgRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
          trendScore: { $sum: { $multiply: ['$rating', 0.7] } } // Weight by rating
        }
      },
      { $match: { reviewCount: { $gte: 2 } } }, // At least 2 reviews
      { $sort: { trendScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'mangas',
          localField: '_id',
          foreignField: '_id',
          as: 'manga'
        }
      },
      { $unwind: '$manga' }
    ]);

    return res.status(200).json({ trending: trending.map(t => t.manga) });
  } catch (err) {
    console.error('getTrending error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};