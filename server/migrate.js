require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const mongoose = require("mongoose");
const Rating = require("./models/ratingModel");

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is missing. Check your .env file.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  await Rating.init();
  console.log("✅ Indexes ensured on ratings");
  await mongoose.disconnect();
})();