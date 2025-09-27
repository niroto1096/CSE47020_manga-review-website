const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
  type: { type: String, required: true }, // 'review_created', 'comment_added', 'level_up', 'follow_gained', 'review_liked'
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('activities', activitySchema);
