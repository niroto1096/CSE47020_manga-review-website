const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
  },
  avatar: String,
  // Encrypted PII Container (RSA Encrypted + HMAC Integrity Envelope)
  encryptedProfile: {
    type: mongoose.Schema.Types.Mixed
  },

  // Privacy settings for profile sections
  personalListPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },
  reviewedPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },
  favoritesPrivacy: { type: String, enum: ['public', 'private'], default: 'private' },

  // Social relations
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('users', userSchema);
