const express = require("express");
const {
  registration,
  verifyOTP,
  resendOTP,
  login,
  verifyLogin2FA,
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
  getPublicKeys,
  rotateKeys,
} = require("../controllers/auth");
const { getListPublic } = require("../controllers/pListController");
const { getUserReviewsPublic } = require("../controllers/reviewController");
const upload = require("../middlewares/multer");

const router = express.Router();

// Registration & OTP
router.post("/registration", registration);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);

// 2-Step Authentication (2FA) Login Flow
router.post("/login", login); // Step 1: Password Check -> Sends 2FA OTP
router.post("/login/verify-2fa", verifyLogin2FA); // Step 2: Validates 2FA OTP -> Issues Session

// Session Management
router.get("/verify-user", verifyUser);
router.get("/log-out", logout);

// Profile & Avatars
router.post("/avatar", upload.single("avatar"), updateAvatar);

// Favorites
router.post("/favorites/add", addFavorite);
router.post("/favorites/remove", removeFavorite);
router.get("/favorites", getFavorites);

// Privacy settings
router.post("/privacy", updatePrivacy);
router.get("/user/:id/favorites-public", getUserFavoritesPublic);
router.get("/user/:id/personal-list-public", getListPublic);
router.get("/user/:id/reviews-public", getUserReviewsPublic);

// Social routes
router.post("/follow", followUser);
router.post("/unfollow", unfollowUser);
router.get("/feed", getFeed);
router.get("/user/:id", getPublicUser);

// Key Management Module Routes
router.get("/crypto/keys", getPublicKeys);
router.post("/crypto/rotate", rotateKeys);

module.exports = router;
