const express = require('express');
const router = express.Router();
const { getRecommendations, getTrending } = require('../controllers/recommendationController');

router.get('/recommendations', getRecommendations);
router.get('/trending', getTrending);

module.exports = router;