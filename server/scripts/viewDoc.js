const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Manga').then(async () => {
  const Review = require('../models/reviewModel');
  const doc = await Review.findOne();
  console.log(JSON.stringify(doc, null, 2));
  process.exit(0);
});
