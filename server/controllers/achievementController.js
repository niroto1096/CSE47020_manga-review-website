const Achievement = require('../models/achievementModel');
const UserModel = require('../models/userModel');
const Review = require('../models/reviewModel');
const Comment = require('../models/commentsModel');
const { addXp } = require('../lib/leveling');

// Achievement definitions with unlock conditions
const achievementDefinitions = [
  // Review Achievements
  {
    id: 'first_review',
    title: 'First Steps',
    description: 'Write your first manga review',
    rarity: 'common',
    xpReward: 25,
    checkUnlock: async (userId) => {
      const reviewCount = await Review.countDocuments({ user: userId });
      return reviewCount >= 1;
    }
  },
  {
    id: 'review_veteran',
    title: 'Review Veteran',
    description: 'Write 100 manga reviews',
    rarity: 'epic',
    xpReward: 500,
    specialReward: { type: 'title', value: 'Review Master' },
    checkUnlock: async (userId) => {
      const reviewCount = await Review.countDocuments({ user: userId });
      return reviewCount >= 100;
    }
  },
  {
    id: 'critic_legend',
    title: 'Legendary Critic',
    description: 'Write 500 manga reviews',
    rarity: 'legendary',
    xpReward: 2000,
    specialReward: { type: 'profile_frame', value: 'golden_frame' },
    checkUnlock: async (userId) => {
      const reviewCount = await Review.countDocuments({ user: userId });
      return reviewCount >= 500;
    }
  },
  // Community Achievements
  {
    id: 'helpful_commenter',
    title: 'Helpful Soul',
    description: 'Leave 50 comments on reviews',
    rarity: 'rare',
    xpReward: 150,
    checkUnlock: async (userId) => {
      const commentCount = await Comment.countDocuments({ user: userId });
      return commentCount >= 50;
    }
  },
  {
    id: 'discussion_master',
    title: 'Discussion Master',
    description: 'Leave 500 comments on reviews',
    rarity: 'epic',
    xpReward: 750,
    specialReward: { type: 'badge', value: 'community_champion' },
    checkUnlock: async (userId) => {
      const commentCount = await Comment.countDocuments({ user: userId });
      return commentCount >= 500;
    }
  },
  // Rating Achievements
  {
    id: 'diverse_reader',
    title: 'Diverse Reader',
    description: 'Rate manga from 10 different genres',
    rarity: 'rare',
    xpReward: 200,
    checkUnlock: async (userId) => {
      const uniqueGenres = await Review.aggregate([
        { $match: { user: userId } },
        { $lookup: { from: 'mangas', localField: 'manga', foreignField: '_id', as: 'mangaData' } },
        { $unwind: '$mangaData' },
        { $unwind: '$mangaData.genres' },
        { $group: { _id: '$mangaData.genres' } },
        { $count: 'uniqueGenres' }
      ]);
      return uniqueGenres.length > 0 && uniqueGenres[0].uniqueGenres >= 10;
    }
  },
  // Streak Achievements
  {
    id: 'dedicated_reader',
    title: 'Dedicated Reader',
    description: 'Maintain a 30-day login streak',
    rarity: 'epic',
    xpReward: 400,
    checkUnlock: async (userId) => {
      const user = await UserModel.findById(userId);
      return user && user.loginStreak >= 30;
    }
  },
  {
    id: 'unstoppable_force',
    title: 'Unstoppable Force',
    description: 'Maintain a 100-day login streak',
    rarity: 'legendary',
    xpReward: 1500,
    specialReward: { type: 'title', value: 'Unstoppable' },
    checkUnlock: async (userId) => {
      const user = await UserModel.findById(userId);
      return user && user.loginStreak >= 100;
    }
  }
];

// Check and unlock achievements for a user
exports.checkAchievements = async (userId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return;

    const userAchievements = user.achievementsUnlocked || [];
    
    for (let achievementDef of achievementDefinitions) {
      // Skip if already unlocked
      if (userAchievements.includes(achievementDef.id)) continue;
      
      // Check if conditions are met
      const shouldUnlock = await achievementDef.checkUnlock(userId);
      
      if (shouldUnlock) {
        // Create achievement record
        const achievement = new Achievement({
          id: achievementDef.id,
          title: achievementDef.title,
          description: achievementDef.description,
          rarity: achievementDef.rarity,
          xpReward: achievementDef.xpReward,
          specialReward: achievementDef.specialReward,
          unlockedBy: userId,
          unlockedAt: new Date()
        });
        
        await achievement.save();
        
        // Update user achievements
        await UserModel.findByIdAndUpdate(userId, {
          $push: { achievementsUnlocked: achievementDef.id }
        });
        
        // Award XP
        await addXp(userId, achievementDef.xpReward, `Achievement unlocked: ${achievementDef.title}`);
        
        console.log(`🏆 Achievement unlocked for user ${userId}: ${achievementDef.title}`);
      }
    }
  } catch (err) {
    console.error('checkAchievements error', err.message);
  }
};

// Get user's achievements
exports.getUserAchievements = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const achievements = await Achievement.find({ unlockedBy: userId }).sort({ unlockedAt: -1 });
    
    // Calculate achievement stats
    const stats = {
      total: achievements.length,
      common: achievements.filter(a => a.rarity === 'common').length,
      rare: achievements.filter(a => a.rarity === 'rare').length,
      epic: achievements.filter(a => a.rarity === 'epic').length,
      legendary: achievements.filter(a => a.rarity === 'legendary').length,
      totalXpEarned: achievements.reduce((sum, a) => sum + a.xpReward, 0)
    };

    return res.status(200).json({ achievements, stats });
  } catch (err) {
    console.error('getUserAchievements error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get all available achievements (for progress tracking)
exports.getAllAchievements = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await UserModel.findById(userId);
    const unlockedIds = user.achievementsUnlocked || [];

    const allAchievements = achievementDefinitions.map(def => ({
      ...def,
      unlocked: unlockedIds.includes(def.id)
    }));

    return res.status(200).json({ achievements: allAchievements });
  } catch (err) {
    console.error('getAllAchievements error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};