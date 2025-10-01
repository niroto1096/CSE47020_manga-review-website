const userModel = require('../models/userModel');

// Get user badges with progress
exports.getUserBadges = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await userModel.findById(userId).select('level totalReviews totalComments totalReviewLikesReceived followers');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const followersCount = Array.isArray(user.followers) ? user.followers.length : 0;

    const badges = [
      // Reviewer badges
      { 
        id: 'reviewer_1', 
        name: 'Reviewer I', 
        icon: '📝', 
        description: 'Write your first review',
        category: 'Reviews',
        threshold: 1, 
        progress: user.totalReviews || 0,
        unlocked: (user.totalReviews || 0) >= 1 
      },
      { 
        id: 'reviewer_2', 
        name: 'Reviewer II', 
        icon: '✍️', 
        description: 'Write 5 reviews',
        category: 'Reviews',
        threshold: 5, 
        progress: user.totalReviews || 0,
        unlocked: (user.totalReviews || 0) >= 5 
      },
      { 
        id: 'reviewer_3', 
        name: 'Reviewer III', 
        icon: '📚', 
        description: 'Write 10 reviews',
        category: 'Reviews',
        threshold: 10, 
        progress: user.totalReviews || 0,
        unlocked: (user.totalReviews || 0) >= 10 
      },
      { 
        id: 'reviewer_master', 
        name: 'Review Master', 
        icon: '🏆', 
        description: 'Write 25 reviews',
        category: 'Reviews',
        threshold: 25, 
        progress: user.totalReviews || 0,
        unlocked: (user.totalReviews || 0) >= 25 
      },

      // Commenter badges
      { 
        id: 'commenter_1', 
        name: 'Commenter I', 
        icon: '💬', 
        description: 'Post 5 comments',
        category: 'Community',
        threshold: 5, 
        progress: user.totalComments || 0,
        unlocked: (user.totalComments || 0) >= 5 
      },
      { 
        id: 'commenter_2', 
        name: 'Commenter II', 
        icon: '🗨️', 
        description: 'Post 15 comments',
        category: 'Community',
        threshold: 15, 
        progress: user.totalComments || 0,
        unlocked: (user.totalComments || 0) >= 15 
      },
      { 
        id: 'commenter_3', 
        name: 'Commenter III', 
        icon: '💭', 
        description: 'Post 30 comments',
        category: 'Community',
        threshold: 30, 
        progress: user.totalComments || 0,
        unlocked: (user.totalComments || 0) >= 30 
      },

      // Social badges
      { 
        id: 'social_1', 
        name: 'Social Butterfly I', 
        icon: '🦋', 
        description: 'Gain 5 followers',
        category: 'Social',
        threshold: 5, 
        progress: followersCount,
        unlocked: followersCount >= 5 
      },
      { 
        id: 'social_2', 
        name: 'Social Butterfly II', 
        icon: '👥', 
        description: 'Gain 15 followers',
        category: 'Social',
        threshold: 15, 
        progress: followersCount,
        unlocked: followersCount >= 15 
      },
      { 
        id: 'social_3', 
        name: 'Influencer', 
        icon: '⭐', 
        description: 'Gain 30 followers',
        category: 'Social',
        threshold: 30, 
        progress: followersCount,
        unlocked: followersCount >= 30 
      },

      // Popular reviewer badges
      { 
        id: 'popular_1', 
        name: 'Loved Reviewer I', 
        icon: '❤️', 
        description: 'Get 10 likes on reviews',
        category: 'Recognition',
        threshold: 10, 
        progress: user.totalReviewLikesReceived || 0,
        unlocked: (user.totalReviewLikesReceived || 0) >= 10 
      },
      { 
        id: 'popular_2', 
        name: 'Loved Reviewer II', 
        icon: '💖', 
        description: 'Get 25 likes on reviews',
        category: 'Recognition',
        threshold: 25, 
        progress: user.totalReviewLikesReceived || 0,
        unlocked: (user.totalReviewLikesReceived || 0) >= 25 
      },
      { 
        id: 'popular_3', 
        name: 'Beloved Critic', 
        icon: '🌟', 
        description: 'Get 50 likes on reviews',
        category: 'Recognition',
        threshold: 50, 
        progress: user.totalReviewLikesReceived || 0,
        unlocked: (user.totalReviewLikesReceived || 0) >= 50 
      },

      // Level badges
      { 
        id: 'level_5', 
        name: 'Rising Star', 
        icon: '🌠', 
        description: 'Reach Level 5',
        category: 'Achievement',
        threshold: 5, 
        progress: user.level || 1,
        unlocked: (user.level || 1) >= 5 
      },
      { 
        id: 'level_10', 
        name: 'Veteran', 
        icon: '🎖️', 
        description: 'Reach Level 10',
        category: 'Achievement',
        threshold: 10, 
        progress: user.level || 1,
        unlocked: (user.level || 1) >= 10 
      },
      { 
        id: 'level_20', 
        name: 'Legend', 
        icon: '👑', 
        description: 'Reach Level 20',
        category: 'Achievement',
        threshold: 20, 
        progress: user.level || 1,
        unlocked: (user.level || 1) >= 20 
      },
    ];

    return res.status(200).json({ badges });
  } catch (err) {
    console.error('getUserBadges error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};