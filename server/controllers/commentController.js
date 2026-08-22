const mongoose = require("mongoose"); // <-- add this
const Joi = require("joi");
const Comment = require("../models/commentsModel"); // your schema file above
const Manga = require("../models/mangaModel"); // assume you have a Manga model

// Validate request body
const addCommentSchema = Joi.object({
  mangaId: Joi.string().required(),
  comment: Joi.string().trim().min(1).max(5000).required(),
  // If you’re not using auth middleware, allow userId in the body:
  userId: Joi.string().optional(),
});

exports.addComment = async (req, res) => {
  try {
    // Prefer user id from auth middleware (e.g., req.user.id); fallback to body
    const authUserId = req.user?.id || req.user?._id;
    const { mangaId, comment, userId } = await addCommentSchema.validateAsync(
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

    // Create & save comment
    const doc = await Comment.create({
      user: finalUserId,
      manga: mangaId,
      comment,
    });

    // Populate user fields you want to expose (e.g., name, avatar)
    const populated = await Comment.findById(doc._id).populate({
      path: "user",
      select: "name username avatar",
    });

    return res.status(201).json({
      message: "Comment added",
      comment: populated,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: err.details.map((d) => d.message),
      });
    }
    console.error("addComment error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.listComments = async (req, res) => {
  try {
    const { mangaId } = req.query;
    const rawPage = Number(req.query.page ?? 1);
    const rawLimit = Number(req.query.limit ?? 20);

    if (!mangaId) {
      return res.status(400).json({ message: "mangaId is required" });
    }
    if (!mongoose.isValidObjectId(mangaId)) {
      return res.status(400).json({ message: "Invalid mangaId" });
    }

    // clamp pagination
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
    const skip = (page - 1) * limit;

    // current user (optional)
    const currentUserId = req.user?.id || req.query.userId || null;
    const currentUserObjId =
      currentUserId && mongoose.isValidObjectId(currentUserId)
        ? new mongoose.Types.ObjectId(currentUserId)
        : null;

    const [result] = await Comment.aggregate([
      { $match: { manga: new mongoose.Types.ObjectId(mangaId) } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            // compute counts + userReaction
            {
              $addFields: {
                likes: { $ifNull: ["$likes", []] },
                dislikes: { $ifNull: ["$dislikes", []] },
              },
            },
            {
              $addFields: {
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                userReaction: currentUserObjId
                  ? {
                      $switch: {
                        branches: [
                          {
                            case: { $in: [currentUserObjId, "$likes"] },
                            then: "like",
                          },
                          {
                            case: { $in: [currentUserObjId, "$dislikes"] },
                            then: "dislike",
                          },
                        ],
                        default: "none",
                      },
                    }
                  : "none",
              },
            },
            // populate user (name, username, avatar)
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
            // trim payload
            {
              $project: {
                comment: 1,
                manga: 1,
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
    console.error("listComments error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.toggleReaction = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user?.id || req.body.userId; // prefer auth middleware
    const { reaction } = req.body; // expected: "like" | "dislike" | "none"

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!["like", "dislike", "none"].includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    // remove user from both arrays first
    comment.likes = comment.likes.filter((u) => String(u) !== String(userId));
    comment.dislikes = comment.dislikes.filter(
      (u) => String(u) !== String(userId)
    );

    // add them back based on reaction
    if (reaction === "like") comment.likes.push(userId);
    if (reaction === "dislike") comment.dislikes.push(userId);

    await comment.save();

    const populated = await Comment.findById(comment._id).populate({
      path: "user",
      select: "name username avatar",
    });

    res.json({
      message: "Reaction updated",
      likesCount: populated.likes.length,
      dislikesCount: populated.dislikes.length,
      comment: populated,
    });
  } catch (err) {
    console.error("toggleReaction error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.editComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user?.id || req.body.userId; // prefer auth middleware
    const { comment: newComment } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Validate the new comment
    const commentSchema = Joi.object({
      comment: Joi.string().trim().min(1).max(5000).required(),
    });

    const { comment } = await commentSchema.validateAsync(
      { comment: newComment },
      { abortEarly: false }
    );

    // Find the comment and verify ownership
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if the user is the author of the comment
    if (String(existingComment.user) !== String(userId)) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    // Update the comment
    existingComment.comment = comment;
    await existingComment.save();

    // Populate user fields for response
    const populated = await Comment.findById(existingComment._id).populate({
      path: "user",
      select: "name username avatar",
    });

    res.json({
      message: "Comment updated successfully",
      comment: populated,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        message: "Validation error",
        details: err.details.map((d) => d.message),
      });
    }
    console.error("editComment error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
