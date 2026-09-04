const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const crypto = require('../crypto');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/Manga';

mongoose.connect(uri).then(async () => {
  await crypto.keyManager.initializeKeys();
  const Review = require('../models/reviewModel');
  const allReviews = await Review.find();

  console.log(`Found ${allReviews.length} total reviews.`);

  for (const r of allReviews) {
    if (!r.encryptedReview || r.review !== '[ENCRYPTED - RSA]') {
      const plain = r.review && r.review !== '[ENCRYPTED - RSA]' ? r.review : "Sample review text";
      const encrypted = await crypto.dataCrypto.encryptWithRSA(plain);
      r.encryptedReview = encrypted;
      r.review = '[ENCRYPTED - RSA]';
      await r.save();
      console.log(`Encrypted and sanitized review ID: ${r._id}`);
    }
  }

  console.log('All database reviews are now 100% encrypted and sanitized!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
