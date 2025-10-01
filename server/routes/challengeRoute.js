const express = require('express');
const router = express.Router();
const { getUserChallenges, completeChallenge } = require('../controllers/challengeController');

router.get('/challenges', getUserChallenges);
router.post('/challenges/:challengeId/complete', completeChallenge);

module.exports = router;