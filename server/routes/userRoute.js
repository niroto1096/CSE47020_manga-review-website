const express = require("express");
const {
  registration,
  verifyOTP,
  login,
  verifyUser,
  logout,
  updateAvatar,
  addFavorite,
  removeFavorite,
  getFavorites,
  updatePrivacy,
  getUserFavoritesPublic,
  followUser,
  unfollowUser,
  getFeed,
  getPublicUser,
  getLeaderboard,
  deleteUserProfile,
} = require("../controllers/auth");
const { getListPublic } = require("../controllers/pListController");
const { getUserReviewsPublic } = require("../controllers/reviewController");
const { getUserBadges } = require("../controllers/badgeController");
const upload = require('../middlewares/multer');

const router = express.Router();

router.post("/registration", registration);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/verify-user", verifyUser);
router.get("/log-out", logout);
// avatar upload
router.post('/avatar', upload.single('avatar'), updateAvatar);
router.post('/favorites/add', addFavorite);
router.post('/favorites/remove', removeFavorite);
router.get('/favorites', getFavorites);
// privacy settings
router.post("/privacy", updatePrivacy);
// public favorites for a user
router.get("/user/:id/favorites-public", getUserFavoritesPublic);
// public personal list for a user (respects privacy)
router.get("/user/:id/personal-list-public", getListPublic);
// public reviews for a user (respects privacy)
router.get("/user/:id/reviews-public", getUserReviewsPublic);
// new social routes
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/feed', getFeed);
router.get('/user/:id', getPublicUser);
router.get('/leaderboard', getLeaderboard);
// badges
router.get('/badges', getUserBadges);
// delete user profile
router.delete('/delete-profile', deleteUserProfile);

module.exports = router;
