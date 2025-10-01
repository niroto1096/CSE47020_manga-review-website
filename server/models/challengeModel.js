const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  category: { type: String, enum: ['reviews', 'comments', 'social', 'discovery'], required: true },
  target: { type: Number, required: true }, // e.g., "Write 3 reviews"
  xpReward: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const userChallengeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'challenges', required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, { timestamps: true });

userChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });

module.exports = {
  Challenge: mongoose.model('challenges', challengeSchema),
  UserChallenge: mongoose.model('user_challenges', userChallengeSchema)
};