const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    manga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mangas",
      required: true,
    },
    score: {
      type: Number,
      min: 1,
      max: 5, 
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate ratings (one per user per manga)
ratingSchema.index({ user: 1, manga: 1 }, { unique: true });

module.exports = mongoose.model("ratings", ratingSchema);
