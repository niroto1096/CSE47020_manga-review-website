const mongoose = require("mongoose");
const Joi = require("joi");
const Review = require("../models/reviewModel");
const Manga = require("../models/mangaModel");
const userModel = require("../models/userModel");
const nodemailer = require("nodemailer");

// Email notification utility function
const sendLikeNotificationEmail = async (reviewAuthor, likerName, mangaTitle) => {
  try {
    console.log("sendLikeNotificationEmail called with:", {
      reviewAuthorEmail: reviewAuthor?.email,
      likerName,
      mangaTitle
    });
    
    if (!reviewAuthor.email) {
      console.log("No email address for review author, skipping notification");
      return;
    }

    console.log("Creating email transporter...");
    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "konodiosama69@gmail.com",
        pass: process.env.EMAIL_PASS || "fekm kopo koua kmuv",
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: '"Manga Review Website" konodiosama69@gmail.com',
      to: reviewAuthor.email,
      subject: `${likerName} liked your review!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Great news!</h2>
          <p>Hello <strong>${reviewAuthor.name}</strong>,</p>
          <p><strong>${likerName}</strong> liked your review for <strong>"${mangaTitle}"</strong>!</p>
          <p>Your thoughtful review is getting recognition from the community. Keep sharing your manga insights!</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666;">
              Visit our website to see more interactions with your reviews and discover new manga!
            </p>
          </div>
          <p style="color: #888; font-size: 12px;">
            This notification was sent because someone liked your review. 
            You can manage your notification preferences in your profile settings.
          </p>
        </div>
      `,
    };

    console.log("Sending email...");
    await transporter.sendMail(mailOptions);
    console.log(`Like notification email sent successfully to ${reviewAuthor.email}`);
  } catch (error) {
    console.error("Error sending like notification email:", error);
    console.error("Full error details:", error.message);
    // Don't throw error to avoid disrupting the main flow
  }
};

// Validate request body for creating/updating reviews
const reviewSchema = Joi.object({
  mangaId: Joi.string().required(),
  review: Joi.string().trim().min(10).max(5000).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  userId: Joi.string().optional(),
});

const { addXp, XP_PER_REVIEW } = require("../lib/leveling");
const Activity = require("../models/activityModel");

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

    // Determine if a review already exists (to award XP only on first creation)
    let existing = await Review.findOne({ user: finalUserId, manga: mangaId }).select("_id");

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

    // If this was a newly created review, award XP and increment totalReviews
    if (!existing) {
      const user = await userModel.findById(finalUserId).select("level xp totalReviews name email avatar");
      if (user) {
        user.totalReviews = (user.totalReviews || 0) + 1;
        const xpRes = addXp(user, XP_PER_REVIEW);
        await user.save();
        
        // Check for achievements after review
        const { checkAchievements } = require('./achievementController');
        checkAchievements(user._id).catch(err => console.error('Achievement check failed:', err));
        
        // Activity: review_created
        try {
          await Activity.create({
            user: user._id,
            type: 'review_created',
            meta: { mangaId, mangaTitle: req.body?.mangaTitle || manga?.title },
          });
          if (xpRes.leveledUp) {
            await Activity.create({ user: user._id, type: 'level_up', meta: { level: xpRes.newLevel } });
          }
        } catch (e) { console.error('activity log (review) failed', e.message); }
        req._xpResult = { awarded: xpRes.awarded, capped: xpRes.capped, leveledUp: xpRes.leveledUp, level: xpRes.newLevel, xp: xpRes.newXp };
      }
    }

    // Populate user fields
    const populated = await Review.findById(reviewDoc._id).populate({
      path: "user",
      select: "name username avatar",
    });

    return res.status(201).json({
      message: existing ? "Review updated successfully" : "Review created successfully",
      review: populated,
      xp: req._xpResult || null,
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

    const doc = await Review.findById(reviewId).populate([
      { path: "user", select: "name email" },
      { path: "manga", select: "title" }
    ]);
    if (!doc) return res.status(404).json({ message: "Review not found" });

    // Check if this is a new like (not previously liked)
    const wasAlreadyLiked = doc.likes && doc.likes.some(u => String(u) === String(userId));
    const isNewLike = reaction === "like" && !wasAlreadyLiked;

    // Remove from both first
    doc.likes = (doc.likes || []).filter((u) => String(u) !== String(userId));
    doc.dislikes = (doc.dislikes || []).filter((u) => String(u) !== String(userId));

    if (reaction === "like") doc.likes.push(userId);
    if (reaction === "dislike") doc.dislikes.push(userId);

    await doc.save();

    // Send email notification for new likes (but not to self)
    console.log("Email notification check:", {
      isNewLike,
      reviewAuthorId: String(doc.user._id),
      likerId: String(userId),
      isDifferentUser: String(doc.user._id) !== String(userId)
    });
    
    if (isNewLike && String(doc.user._id) !== String(userId)) {
      console.log("Attempting to send email notification...");
      try {
        const liker = await userModel.findById(userId).select("name");
        console.log("Liker found:", liker?.name);
        console.log("Review author email:", doc.user?.email);
        console.log("Manga title:", doc.manga?.title);
        
        if (liker && doc.user && doc.manga) {
          console.log("All data available, sending email...");
          // Send email notification in background (don't wait for it)
          sendLikeNotificationEmail(doc.user, liker.name, doc.manga.title).catch(err => {
            console.error("Background email sending failed:", err);
          });
        } else {
          console.log("Missing data for email:", {
            hasLiker: !!liker,
            hasUser: !!doc.user,
            hasManga: !!doc.manga
          });
        }
      } catch (emailError) {
        console.error("Error getting liker info for email:", emailError);
        // Continue with response even if email fails
      }
    }

    // Award XP to review author when they receive a new like
    if (isNewLike && String(doc.user._id) !== String(userId)) {
      try {
        const author = await userModel.findById(doc.user._id).select("level xp totalXp totalReviewLikesReceived");
        if (author) {
          const { addXp, XP_PER_REVIEW_LIKE_RECEIVED } = require("../lib/leveling");
          author.totalReviewLikesReceived = (author.totalReviewLikesReceived || 0) + 1;
          const xpRes = addXp(author, XP_PER_REVIEW_LIKE_RECEIVED);
          await author.save();
          
          // Check for achievements after receiving likes
          const { checkAchievements } = require('./achievementController');
          checkAchievements(author._id).catch(err => console.error('Achievement check failed:', err));
          
          try { const Activity = require("../models/activityModel"); await Activity.create({ user: author._id, type: 'review_liked', meta: { reviewId: doc._id, mangaId: doc.manga?._id || doc.manga } }); if (xpRes.leveledUp) await Activity.create({ user: author._id, type: 'level_up', meta: { level: xpRes.newLevel } }); } catch (e) {}
        }
      } catch (xpErr) {
        console.error("like xp award failed:", xpErr.message);
      }
    }

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

// Test email functionality
exports.testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const testUser = { name: "Test User", email: email };
    await sendLikeNotificationEmail(testUser, "Test Liker", "Test Manga");
    
    res.json({ message: "Test email sent successfully" });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ message: "Failed to send test email", error: error.message });
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
