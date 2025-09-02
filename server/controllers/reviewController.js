const Review = require('../models/reviewModel');

exports.createReview = async (req, res) => {
  try {
    const { manga, rating, comment } = req.body;
    const user = req.user._id; // assuming user is set by auth middleware
    const review = await Review.create({ manga, user, rating, comment });
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getReviewsByManga = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const reviews = await Review.find({ manga: mangaId }).populate('user', 'username');
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};