const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  password: String,
  address: String,
  phone: String,
  company: String,       
  website: String ,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 
  },
});

module.exports = mongoose.model('otps', otpSchema);