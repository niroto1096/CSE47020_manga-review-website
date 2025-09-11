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
  followUser,
  unfollowUser,
  getFeed,
  getPublicUser,
} = require("../controllers/auth");
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
// new social routes
router.post('/follow', followUser);
router.post('/unfollow', unfollowUser);
router.get('/feed', getFeed);
router.get('/user/:id', getPublicUser);

module.exports = router;
