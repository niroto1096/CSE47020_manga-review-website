const express = require("express");
const {
  registration,
  verifyOTP,
  login,
  verifyUser,
  logout,
  updateAvatar,
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

module.exports = router;
