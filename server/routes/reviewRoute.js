const express = require('express');
const { createReview, getReviewsByManga } = require('../controllers/reviewController');
const auth = require('../middlewares/auth'); // assuming you have an auth middleware

const router = express.Router();

router.post('/', auth, createReview);
router.get('/:mangaId', getReviewsByManga);

module.exports = router;