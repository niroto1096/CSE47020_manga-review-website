const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
    comment: {
      type: String,
      required: true,
      trim: true,
    },

    // (optional legacy) previous field—keep for now if already used
    reactors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],

    // NEW: reactions
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

// Quick counts (handy for responses)
commentSchema.virtual("likesCount").get(function () {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});
commentSchema.virtual("dislikesCount").get(function () {
  return Array.isArray(this.dislikes) ? this.dislikes.length : 0;
});

// Ensure virtuals appear in JSON
commentSchema.set("toObject", { virtuals: true });
commentSchema.set("toJSON", { virtuals: true });

// Helper to toggle reaction atomically (server-side use)
commentSchema.statics.toggleReaction = async function ({
  commentId,
  userId,
  reaction, // "like" | "dislike" | "none"
}) {
  if (!["like", "dislike", "none"].includes(reaction)) {
    throw new Error("Invalid reaction");
  }

  const update = { $pull: { likes: userId, dislikes: userId } };

  if (reaction === "like") update.$addToSet = { likes: userId };
  if (reaction === "dislike") update.$addToSet = { dislikes: userId };

  const updated = await this.findByIdAndUpdate(commentId, update, {
    new: true,
  });
  return updated;
};

// (Optional) Useful indexes
commentSchema.index({ manga: 1, createdAt: -1 });
commentSchema.index({ user: 1, createdAt: -1 });

const Comment = mongoose.model("comments", commentSchema);
module.exports = Comment;
