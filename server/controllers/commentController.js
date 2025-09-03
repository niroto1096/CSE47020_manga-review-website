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
    const { mangaId, page = 1, limit = 20 } = req.query;
    if (!mangaId)
      return res.status(400).json({ message: "mangaId is required" });

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Comment.find({ manga: mangaId })
        .populate({ path: "user", select: "name username avatar" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Comment.countDocuments({ manga: mangaId }),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
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

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const idx = comment.reactors.findIndex((u) => String(u) === String(userId));
    if (idx === -1) comment.reactors.push(userId);
    else comment.reactors.splice(idx, 1);

    await comment.save();

    const populated = await Comment.findById(comment._id).populate({
      path: "user",
      select: "name username avatar",
    });

    res.json({ message: "Updated", comment: populated });
  } catch (err) {
    console.error("toggleReaction error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
