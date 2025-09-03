const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // reference to user collection
      required: true,
    },
    manga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mangas", // reference to manga collection
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    reactors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // users who reacted (like/upvote/etc.)
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Comment = mongoose.model("comments", commentSchema);

module.exports = Comment;
