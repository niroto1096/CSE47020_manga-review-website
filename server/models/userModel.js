const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  password: String,
  avatar: String,
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
