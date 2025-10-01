const express = require('express');
const router = express.Router();
const { getUserAchievements, getAllAchievements } = require('../controllers/achievementController');

router.get('/user', getUserAchievements);
router.get('/all', getAllAchievements);

module.exports = router;