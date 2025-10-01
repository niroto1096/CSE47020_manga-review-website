const Challenge = require('../models/challengeModel');
const UserModel = require('../models/userModel');
const Review = require('../models/reviewModel');
const Comment = require('../models/commentsModel');
const { addXp } = require('../lib/leveling');

// Generate daily challenges
const generateDailyChallenge = () => {
  const challenges = [
    {
      title: "Review Master",
      description: "Write 3 manga reviews today",
      type: "daily",
      target: 3,
      xpReward: 100,
      checkProgress: async (userId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return await Review.countDocuments({
          user: userId,
          createdAt: { $gte: today, $lt: tomorrow }
        });
      }
    },
    {
      title: "Community Builder",
      description: "Leave 10 helpful comments today",
      type: "daily",
      target: 10,
      xpReward: 75,
      checkProgress: async (userId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return await Comment.countDocuments({
          user: userId,
          createdAt: { $gte: today, $lt: tomorrow }
        });
      }
    },
    {
      title: "Explorer",
      description: "Rate 5 different manga today",
      type: "daily",
      target: 5,
      xpReward: 60,
      checkProgress: async (userId) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const uniqueRatings = await Review.distinct('manga', {
          user: userId,
          createdAt: { $gte: today, $lt: tomorrow }
        });
        return uniqueRatings.length;
      }
    }
  ];
  
  return challenges[Math.floor(Math.random() * challenges.length)];
};

// Get user's active challenges
exports.getUserChallenges = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get today's challenges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let userChallenges = await Challenge.find({
      'participants.user': userId,
      startDate: { $gte: today, $lt: tomorrow }
    });

    // If no daily challenge exists, create one
    if (userChallenges.length === 0) {
      const dailyChallenge = generateDailyChallenge();
      const newChallenge = new Challenge({
        ...dailyChallenge,
        startDate: today,
        endDate: tomorrow,
        participants: [{
          user: userId,
          progress: 0,
          completed: false
        }]
      });
      
      await newChallenge.save();
      userChallenges = [newChallenge];
    }

    // Update progress for each challenge
    for (let challenge of userChallenges) {
      const participant = challenge.participants.find(p => p.user.toString() === userId);
      if (participant && !participant.completed) {
        const currentProgress = await challenge.checkProgress(userId);
        participant.progress = currentProgress;
        
        if (currentProgress >= challenge.target && !participant.completed) {
          participant.completed = true;
          participant.completedAt = new Date();
          
          // Award XP
          await addXp(userId, challenge.xpReward, `Completed challenge: ${challenge.title}`);
        }
        
        await challenge.save();
      }
    }

    return res.status(200).json({ challenges: userChallenges });
  } catch (err) {
    console.error('getUserChallenges error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Complete a challenge manually (for verification)
exports.completeChallenge = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { challengeId } = req.params;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const participant = challenge.participants.find(p => p.user.toString() === userId);
    if (!participant) {
      return res.status(404).json({ message: 'User not participating in this challenge' });
    }

    if (participant.completed) {
      return res.status(400).json({ message: 'Challenge already completed' });
    }

    // Check if user actually completed the challenge
    const currentProgress = await challenge.checkProgress(userId);
    if (currentProgress >= challenge.target) {
      participant.completed = true;
      participant.completedAt = new Date();
      participant.progress = currentProgress;
      
      await challenge.save();
      await addXp(userId, challenge.xpReward, `Completed challenge: ${challenge.title}`);
      
      return res.status(200).json({ 
        message: 'Challenge completed!', 
        xpAwarded: challenge.xpReward 
      });
    } else {
      return res.status(400).json({ 
        message: 'Challenge requirements not met',
        currentProgress,
        target: challenge.target
      });
    }
  } catch (err) {
    console.error('completeChallenge error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};