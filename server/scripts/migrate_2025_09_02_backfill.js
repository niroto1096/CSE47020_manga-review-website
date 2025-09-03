require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/manga_db";

async function run() {
  await mongoose.connect(MONGO_URI, {});
  const col = mongoose.connection.collection("mangas");

  // 1) Backfill rating fields if missing
  await col.updateMany(
    {
      $or: [
        { rating: { $exists: false } },
        { numRatings: { $exists: false } },
        { raters: { $exists: false } },
      ],
    },
    { $set: { rating: 0, numRatings: 0, raters: [] } }
  );

  // 2) Normalize genre safely (handles array|string|null/missing)
  await col.updateMany({}, [
    {
      $set: {
        genre: {
          $cond: [
            {
              $or: [
                { $eq: [{ $type: "$genre" }, "missing"] },
                { $eq: [{ $type: "$genre" }, "null"] },
              ],
            },
            [],
            {
              $cond: [
                { $isArray: "$genre" },
                {
                  // clean array: trim & drop empties/nulls
                  $filter: {
                    input: {
                      $map: {
                        input: "$genre",
                        as: "g",
                        in: {
                          $trim: { input: { $ifNull: ["$$g", ""] } },
                        },
                      },
                    },
                    as: "x",
                    cond: { $ne: ["$$x", ""] },
                  },
                },
                {
                  // string → split, trim, drop empties
                  $filter: {
                    input: {
                      $map: {
                        input: { $split: ["$genre", ","] },
                        as: "g",
                        in: { $trim: { input: "$$g" } },
                      },
                    },
                    as: "x",
                    cond: { $ne: ["$$x", ""] },
                  },
                },
              ],
            },
          ],
        },
      },
    },
  ]);

  // 3) Normalize theme safely (same logic)
  await col.updateMany({}, [
    {
      $set: {
        theme: {
          $cond: [
            {
              $or: [
                { $eq: [{ $type: "$theme" }, "missing"] },
                { $eq: [{ $type: "$theme" }, "null"] },
              ],
            },
            [],
            {
              $cond: [
                { $isArray: "$theme" },
                {
                  $filter: {
                    input: {
                      $map: {
                        input: "$theme",
                        as: "t",
                        in: { $trim: { input: { $ifNull: ["$$t", ""] } } },
                      },
                    },
                    as: "x",
                    cond: { $ne: ["$$x", ""] },
                  },
                },
                {
                  $filter: {
                    input: {
                      $map: {
                        input: { $split: ["$theme", ","] },
                        as: "t",
                        in: { $trim: { input: "$$t" } },
                      },
                    },
                    as: "x",
                    cond: { $ne: ["$$x", ""] },
                  },
                },
              ],
            },
          ],
        },
      },
    },
  ]);

  // (Optional) helpful indexes
  await col.createIndex(
    { title: "text", author: "text", synopsis: "text", genre: 1 },
    { name: "manga_search_idx" }
  );
  await col.createIndex({ featured: 1 }, { name: "featured_idx" });

  console.log("✅ Backfill complete");
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});