// server/controllers/mangaController.js
const mongoose = require("mongoose");
const Manga = require("../models/mangaModel");
const Rating = require("../models/ratingModel");
const fs = require("fs");
const path = require("path");

// Helper: normalize Windows backslashes to forward slashes (good for URLs)
const normalizeImagePath = (p) => (p ? p.replace(/\\/g, "/") : p);

// ============= Upload Manga =============
exports.uploadManga = async (req, res) => {
  try {
    const {
      title,
      featured,
      details,
      genre,
      theme,
      rating,
      author,
      synopsis,
      release_year,
      volume,
      chapter,
    } = req.body;

    const image = req.file;
    if (!image) return res.status(400).json({ message: "Image is required" });

    const parsedGenre = Array.isArray(genre)
      ? genre
      : typeof genre === "string"
      ? genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean)
      : [];

    const parsedTheme = Array.isArray(theme)
      ? theme
      : typeof theme === "string"
      ? theme
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const doc = await Manga.create({
      title,
      featured: featured === true || featured === "true",
      details: details ?? "",
      genre: parsedGenre,
      theme: parsedTheme,
      rating: Number(rating) || 0,
      author: author ?? "",
      synopsis: synopsis ?? "",
      release_year: release_year ? Number(release_year) : null,
      volume: volume ? Number(volume) : null,
      chapter: chapter ? Number(chapter) : null,
      image: normalizeImagePath(image.path || `uploads/${image.filename}`),
    });

    return res
      .status(201)
      .json({ message: "Manga uploaded successfully", data: doc });
  } catch (err) {
    console.error("Upload failed:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// ============= Get All Manga (optional search) =============
exports.getAllManga = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const rx = search ? new RegExp(search, "i") : null;

    const query = rx
      ? {
          $or: [
            { title: rx },
            { author: rx },
            { synopsis: rx },
            { details: rx },
            { genre: { $regex: rx } }, // regex on array matches any element
            { theme: { $regex: rx } },
          ],
        }
      : {};

    const mangas = await Manga.find(query).sort({ createdAt: -1 });
    return res.status(200).json(mangas);
  } catch (err) {
    console.error("getAllManga error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============= Delete Manga (also remove file and ratings) =============
exports.deleteManga = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Manga.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Manga not found" });

    // Delete image file if present
    try {
      if (doc.image) {
        const abs = path.isAbsolute(doc.image)
          ? doc.image
          : path.resolve(process.cwd(), doc.image);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
      }
    } catch (e) {
      console.warn("Failed to delete image file:", e.message);
    }

    // Remove related ratings
    await Rating.deleteMany({ manga: id });

    return res.status(200).json({ message: "Deleted" });
  } catch (err) {
    console.error("deleteManga error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============= Update Featured Flag =============
exports.updateManga = async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body; // expects true/false or "true"/"false"
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const featured = status === true || status === "true";
    const updated = await Manga.findByIdAndUpdate(
      id,
      { featured },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Manga not found" });
    return res.status(200).json({ message: "Manga updated", data: updated });
  } catch (err) {
    console.error("updateManga error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============= Get Manga by ID =============
exports.getMangaById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid id" });

    const doc = await Manga.findById(id);
    if (!doc) return res.status(404).json({ message: "Manga not found" });

    return res.status(200).json(doc);
  } catch (err) {
    console.error("getMangaById error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============= Add / Update Rating (1–10, re-rating allowed) =============
exports.addRating = async (req, res) => {
  try {
    const { id } = req.params; // manga id
    const { userId, rating } = req.body; // 1..10 integer

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid userId or manga id" });
    }
    const parsed = Number(rating);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 10) {
      return res
        .status(400)
        .json({ message: "rating must be an integer 1–10" });
    }

    const exists = await Manga.findById(id).select("_id");
    if (!exists) return res.status(404).json({ message: "Manga not found" });

    // Upsert (create or update) user's rating
    const ratingDoc = await Rating.findOneAndUpdate(
      { user: userId, manga: id },
      { $set: { score: parsed } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    // Recompute avg & count from ratings collection
    const [stats] = await Rating.aggregate([
      { $match: { manga: ratingDoc.manga } }, // already an ObjectId
      {
        $group: { _id: "$manga", avg: { $avg: "$score" }, count: { $sum: 1 } },
      },
    ]);

    const avg = stats ? Number(stats.avg.toFixed(2)) : 0;
    const count = stats ? stats.count : 0;

    // Denormalize onto manga for fast reads
    const updated = await Manga.findByIdAndUpdate(
      id,
      { rating: avg, numRatings: count, $addToSet: { raters: userId } }, // keep raters if you still want it
      { new: true }
    ).select("_id rating numRatings");

    return res.json({
      message: "Rating saved",
      manga: updated,
      rating: ratingDoc,
    });
  } catch (err) {
    // handle race on unique index { user:1, manga:1 }
    if (err?.code === 11000) {
      return res
        .status(200)
        .json({ message: "Rating already exists (idempotent)" });
    }
    console.error("addRating error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// ============= Get current user's rating for a manga =============
exports.getMyRating = async (req, res) => {
  try {
    const { id } = req.params; // manga id
    const { userId } = req.query; // user id from client

    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ message: "Invalid userId or manga id" });
    }

    // ensure manga exists (optional but nice)
    const exists = await Manga.findById(id).select("_id");
    if (!exists) return res.status(404).json({ message: "Manga not found" });

    const r = await Rating.findOne({ user: userId, manga: id }).select("score");
    return res.json({ score: r ? r.score : null });
  } catch (err) {
    console.error("getMyRating error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
