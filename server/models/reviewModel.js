const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    review: {
      type: String,
      default: "[ENCRYPTED - RSA]",
    },
    // Encrypted Review Envelope (RSA Encrypted + HMAC Integrity)
    encryptedReview: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    // Reactions
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    dislikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ensure one review per user per manga
reviewSchema.index({ user: 1, manga: 1 }, { unique: true });

// Useful indexes for queries
reviewSchema.index({ manga: 1, createdAt: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// Virtual counts
reviewSchema.virtual("likesCount").get(function () {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});
reviewSchema.virtual("dislikesCount").get(function () {
  return Array.isArray(this.dislikes) ? this.dislikes.length : 0;
});

reviewSchema.set("toObject", { virtuals: true });
reviewSchema.set("toJSON", { virtuals: true });

const Review = mongoose.model("reviews", reviewSchema);
module.exports = Review;
