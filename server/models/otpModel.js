const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  purpose: {
    type: String,
    enum: ['REGISTRATION', 'LOGIN_2FA'],
    default: 'REGISTRATION'
  },
  role: String,
  name: String,
  email: {
    type: String,
    required: true
  },
  password: String,
  salt: String,
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180 // Valid for 3 minutes
  }
});

module.exports = mongoose.model('otps', otpSchema);