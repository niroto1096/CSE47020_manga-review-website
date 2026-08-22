const mongoose = require("mongoose");
const Joi = require("joi");
const Review = require("../models/reviewModel");
const Manga = require("../models/mangaModel");
const userModel = require("../models/userModel");

// Validate request body for creating/updating reviews
const reviewSchema = Joi.object({
  mangaId: Joi.string().required(),
  review: Joi.string().trim().min(10).max(5000).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  userId: Joi.string().optional(),
});

// Create or update a review
exports.createOrUpdateReview = async (req, res) => {
  try {
    const authUserId = req.user?.id || req.user?._id;
    const { mangaId, review, rating, userId } = await reviewSchema.validateAsync(
      { ...req.body, userId: req.body.userId },
      { abortEarly: false }
    );

    const finalUserId = authUserId || userId;
    if (!finalUserId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not provided" });
    }

    // Ensure manga exists
    const manga = await Manga.findById(mangaId).select("_id");
    if (!manga) {
      return res.status(404).json({ message: "Manga not found" });
    }

    // Use upsert to create or update the review
    const reviewDoc = await Review.findOneAndUpdate(
      { user: finalUserId, manga: mangaId },
      { review, rating },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    // Populate user fields
    const populated = await Review.findById(reviewDoc._id).populate({
      path: "user",
      select: "name username avatar",
    });

    return res.status(201).json({
      message: "Review saved successfully",
      review: populated,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: err.details.map((d) => d.message),
      });
    }
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Review already exists for this manga",
      });
    }
    console.error("createOrUpdateReview error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get user's review for a specific manga
exports.getUserReview = async (req, res) => {
  try {
    const { mangaId } = req.query;
    const userId = req.user?.id || req.query.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mangaId) {
      return res.status(400).json({ message: "mangaId is required" });
    }

    if (!mongoose.isValidObjectId(mangaId)) {
      return res.status(400).json({ message: "Invalid mangaId" });
    }

    const review = await Review.findOne({ 
      user: userId, 
      manga: mangaId 
    }).populate({
      path: "user",
      select: "name username avatar",
    });

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ review });
  } catch (err) {
    console.error("getUserReview error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all reviews for a manga with pagination
exports.getMangaReviews = async (req, res) => {
  try {
    const { mangaId } = req.query;
    const currentUserId = req.user?.id || req.query.userId || null;
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 10);

    if (!mangaId) {
      return res.status(400).json({ message: "mangaId is required" });
    }

    if (!mongoose.isValidObjectId(mangaId)) {
      return res.status(400).json({ message: "Invalid mangaId" });
    }

    // Clamp pagination
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : 10;
    const skip = (page - 1) * limit;

    const [result] = await Review.aggregate([
      { $match: { manga: new mongoose.Types.ObjectId(mangaId) } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            { $addFields: { likes: { $ifNull: ["$likes", []] }, dislikes: { $ifNull: ["$dislikes", []] } } },
            { $addFields: { likesCount: { $size: "$likes" }, dislikesCount: { $size: "$dislikes" } } },
            {
              $addFields: {
                userReaction: currentUserId && mongoose.isValidObjectId(currentUserId)
                  ? {
                      $switch: {
                        branches: [
                          { case: { $in: [new mongoose.Types.ObjectId(currentUserId), "$likes"] }, then: "like" },
                          { case: { $in: [new mongoose.Types.ObjectId(currentUserId), "$dislikes"] }, then: "dislike" },
                        ],
                        default: "none",
                      },
                    }
                  : "none",
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }],
              },
            },
            { $set: { user: { $first: "$user" } } },
            {
              $project: {
                review: 1,
                rating: 1,
                user: 1,
                createdAt: 1,
                updatedAt: 1,
                likesCount: 1,
                dislikesCount: 1,
                userReaction: 1,
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
      {
        $project: {
          items: 1,
          total: { $ifNull: [{ $first: "$meta.total" }, 0] },
        },
      },
    ]);

    const total = result?.total ?? 0;
    res.json({
      items: result?.items ?? [],
      total,
      page,
      pages: Math.ceil(total / (limit || 1)),
    });
  } catch (err) {
    console.error("getMangaReviews error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle like/dislike reaction on a review
exports.toggleReviewReaction = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user?.id || req.body.userId;
    const { reaction } = req.body; // "like" | "dislike" | "none"

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!["like", "dislike", "none"].includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const doc = await Review.findById(reviewId);
    if (!doc) return res.status(404).json({ message: "Review not found" });

    // Remove from both first
    doc.likes = (doc.likes || []).filter((u) => String(u) !== String(userId));
    doc.dislikes = (doc.dislikes || []).filter((u) => String(u) !== String(userId));

    if (reaction === "like") doc.likes.push(userId);
    if (reaction === "dislike") doc.dislikes.push(userId);

    await doc.save();

    const populated = await Review.findById(doc._id).populate({
      path: "user",
      select: "name username avatar",
    });

    res.json({
      message: "Reaction updated",
      likesCount: populated.likes?.length || 0,
      dislikesCount: populated.dislikes?.length || 0,
      review: populated,
    });
  } catch (err) {
    console.error("toggleReviewReaction error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get review summary (average rating and count) for a manga
exports.getReviewSummary = async (req, res) => {
  try {
    const { mangaId } = req.query;
    if (!mangaId) return res.status(400).json({ message: "mangaId is required" });
    if (!mongoose.isValidObjectId(mangaId)) {
      return res.status(400).json({ message: "Invalid mangaId" });
    }

    const [summary] = await Review.aggregate([
      { $match: { manga: new mongoose.Types.ObjectId(mangaId) } },
      {
        $group: {
          _id: "$manga",
          count: { $sum: 1 },
          avg: { $avg: "$rating" },
        },
      },
    ]);

    const count = summary?.count || 0;
    const avg = summary?.avg ? Number(summary.avg.toFixed(2)) : 0;
    res.json({ mangaId, count, average: avg });
  } catch (err) {
    console.error("getReviewSummary error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// PUBLIC: get a user's reviews if privacy allows
exports.getUserReviewsPublic = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const user = await userModel.findById(id).select('reviewedPrivacy');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if ((user.reviewedPrivacy || 'private') !== 'public') {
      return res.status(200).json({ items: [], privacy: 'private' });
    }
    const items = await Review.find({ user: id })
      .populate({ path: 'manga' })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ items, privacy: 'public' });
  } catch (err) {
    console.error('getUserReviewsPublic error:', err.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
