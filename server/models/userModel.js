const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  password: String,
  avatar: String,
  // gamification
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  totalXp: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 },
  totalReviewLikesReceived: { type: Number, default: 0 },
  // daily xp cap tracking
  xpDay: { type: Number, default: 0 },
  xpDayDate: { type: Date },
  dailyComments: { type: Number, default: 0 },
  dailyReviews: { type: Number, default: 0 },
  // streak system
  loginStreak: { type: Number, default: 0 },
  lastLoginDate: { type: Date },
  activityStreak: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  // privacy settings for profile sections
  personalListPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },
  reviewedPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },
  favoritesPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },
  // social: who I follow and who follows me
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }
  ],
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    }
  ],
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'mangas'
    }
  ],
  address: String,
  phone: String,
  company: String,       
  website: String 
});

module.exports = mongoose.model('users', userSchema);
