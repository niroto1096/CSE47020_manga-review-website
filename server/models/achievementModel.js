const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  achievementId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  xpReward: { type: Number, default: 0 },
  specialReward: { type: String }, // e.g., "profile_frame", "title", "badge"
  unlockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

achievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

module.exports = mongoose.model('achievements', achievementSchema);