const mongoose = require("mongoose");

const mangaSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
    details: { type: String, required: true },
    genre: [{ type: String, required: true }],
    theme: [{ type: String }],
    rating: { type: Number, default: 0 }, // average rating
    numRatings: { type: Number, default: 0 }, // number of ratings
    raters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // users who rated
      },
    ],
    author: { type: String, required: true },
    synopsis: { type: String },
    release_year: { type: String },
    volume: { type: String },
    chapter: { type: String },
  },
  {
    timestamps: true,
  }
);

const Manga = mongoose.model("mangas", mangaSchema);

module.exports = Manga;
