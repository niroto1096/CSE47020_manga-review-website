const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Review = require("../models/reviewModel");
const Rating = require("../models/ratingModel");
const crypto = require("../crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "konodiosama69@gmail.com",
    pass: "lifc rwom fpuv iclb",
  },
});

/**
 * Step 1: User Registration
 * Encrypts user PII with RSA and computes Salted Password Hash
 */
exports.registration = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const trimmedName = name ? name.trim() : "";
    if (!trimmedName) {
      return res.status(400).json("Name is required!");
    }

    const existingName = await userModel.findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });
    if (existingName) {
      return res.status(401).json("User with same name already exists!");
    }

    const trimmedEmail = email ? email.trim() : "";
    const existingEmail = await userModel.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(401).json("User with same email already exists!");
    }

    if (!password || password.length < 8) {
      return res.status(402).json("Password must be at least 8 characters long!");
    }

    // 1. Generate Salt and Salted Password Hash from Scratch
    const salt = crypto.hash.generateSalt(16);
    const passwordHash = crypto.hash.hashPassword(password, salt);

    // 2. Encrypt User PII (name, email) with RSA from Scratch
    const sensitiveProfile = {
      name: trimmedName,
      email: trimmedEmail,
    };
    const encryptedProfile = await crypto.dataCrypto.encryptWithRSA(sensitiveProfile);

    // 3. Generate 4-digit OTP for email verification
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Delete stale OTPs
    await otpModel.deleteMany({ email: trimmedEmail });

    await otpModel.create({
      purpose: "REGISTRATION",
      name: trimmedName,
      email: trimmedEmail,
      password: passwordHash,
      salt: salt,
      role: role || "user",
      otp,
    });

    const mailOptions = {
      from: '"Page2Page Manga (CSE447)" <konodiosama69@gmail.com>',
      to: trimmedEmail,
      subject: "Your Registration Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Welcome to Page2Page!</h2>
          <p>Your registration verification OTP code is:</p>
          <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #6b7280; font-size: 13px;">This OTP is valid for 3 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP REGISTRATION] Sent to ${trimmedEmail}: ${otp}`);

    res.status(200).json("OTP sent to your email. Please verify to complete registration.");
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json(err.message || "Something went wrong");
  }
};

/**
 * Step 2: Verify Registration OTP
 * Creates the user record with salted password hash, salt, and RSA-encrypted profile
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;

    if (!email || !otp) {
      return res.status(400).json("Email and OTP are required!");
    }

    const record = await otpModel.findOne({ email, purpose: "REGISTRATION" }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json("Your OTP has expired! Please request a new one or register again.");
    }

    if (String(record.otp).trim() !== String(otp).trim()) {
      return res.status(400).json("Invalid OTP! Please check the code sent to your email.");
    }

    const { name, password, salt, role } = record;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      await otpModel.deleteMany({ email });
      return res.status(400).json("User with same email already exists!");
    }

    // Encrypt sensitive profile info (name, email) with RSA
    const profileData = { name, email };
    const encryptedProfile = await crypto.dataCrypto.encryptWithRSA(profileData);

    await userModel.create({
      name,
      email,
      password, // Salted password hash
      salt,
      role: role || "user",
      encryptedProfile
    });

    await otpModel.deleteMany({ email });

    res.status(200).json("Account created successfully! Please login with your credentials.");
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json("Internal Server Error: " + error.message);
  }
};

/**
 * Resend OTP
 */
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json("Email is required!");
    }

    const record = await otpModel.findOne({ email }).sort({ createdAt: -1 });
    if (!record) {
      return res.status(400).json("No verification in progress for this email.");
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    record.otp = newOtp;
    record.createdAt = new Date();
    await record.save();

    const mailOptions = {
      from: '"Page2Page Manga (CSE447)" <konodiosama69@gmail.com>',
      to: email,
      subject: "Your New OTP Code",
      html: `<p>Your new verification OTP code is: <b>${newOtp}</b></p><p>This OTP is valid for 3 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP RESEND] New OTP for ${email}: ${newOtp}`);

    res.status(200).json("New OTP sent to your email.");
  } catch (err) {
    console.error("Resend OTP error:", err.message);
    res.status(500).json("Failed to resend OTP: " + err.message);
  }
};

/**
 * Step 1 of 2FA Login:
 * Validates Primary Credentials (Email + Password using Salted Hash)
 * If valid, generates & emails 2FA OTP (2nd Factor)
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json("Email and password are required!");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json("Invalid credentials!");
    }

    // Verify Password using Salted Hash from Scratch
    let isPasswordValid = false;
    if (user.salt) {
      isPasswordValid = crypto.hash.verifyPassword(password, user.salt, user.password);
    } else {
      // Backward compatibility fallback: plain password check and automatic salt migration
      if (user.password === password) {
        isPasswordValid = true;
        const newSalt = crypto.hash.generateSalt(16);
        user.salt = newSalt;
        user.password = crypto.hash.hashPassword(password, newSalt);
        await user.save();
      }
    }

    if (!isPasswordValid) {
      return res.status(400).json("Invalid credentials!");
    }

    // Generate 2FA OTP (Second Factor)
    const twoFactorOtp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store in OTP collection
    await otpModel.deleteMany({ email, purpose: "LOGIN_2FA" });
    await otpModel.create({
      purpose: "LOGIN_2FA",
      email: user.email,
      otp: twoFactorOtp,
      role: user.role
    });

    // Send 2FA OTP via Nodemailer
    const mailOptions = {
      from: '"Page2Page Security (CSE447 2FA)" <konodiosama69@gmail.com>',
      to: user.email,
      subject: "Two-Step Login Verification Code (2FA)",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Two-Factor Authentication (2FA)</h2>
          <p>Hello <b>${user.name}</b>,</p>
          <p>You are logging into your account. Please enter the following 2FA verification code to complete your login:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827; margin: 16px 0;">
            ${twoFactorOtp}
          </div>
          <p style="color: #6b7280; font-size: 13px;">This code is valid for 3 minutes. If you did not attempt this login, please change your password immediately.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[LOGIN 2FA] Code generated for ${user.email}: ${twoFactorOtp}`);

    return res.status(200).json({
      status: "2FA_REQUIRED",
      message: "Two-factor OTP code sent to your email. Please enter it to complete login.",
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json("Internal Server Error");
  }
};

/**
 * Step 2 of 2FA Login:
 * Validates the Second Factor OTP and issues JWT session cookie
 */
exports.verifyLogin2FA = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json("Email and OTP are required!");
    }

    const otpRecord = await otpModel.findOne({ email, purpose: "LOGIN_2FA" }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json("2FA code has expired! Please log in again.");
    }

    if (String(otpRecord.otp).trim() !== String(otp).trim()) {
      return res.status(400).json("Invalid 2FA verification code!");
    }

    const user = await userModel.findOne({ email }).select("-password -salt");
    if (!user) {
      return res.status(404).json("User not found!");
    }

    // Clean up OTP
    await otpModel.deleteMany({ email, purpose: "LOGIN_2FA" });

    // Decrypt profile if RSA encrypted
    if (user.encryptedProfile) {
      try {
        const decrypted = await crypto.dataCrypto.decryptWithRSA(user.encryptedProfile);
        if (decrypted && typeof decrypted === "object") {
          user.name = decrypted.name || user.name;
          user.email = decrypted.email || user.email;
          user.address = decrypted.address || user.address;
          user.phone = decrypted.phone || user.phone;
          user.company = decrypted.company || user.company;
          user.website = decrypted.website || user.website;
        }
      } catch (err) {
        console.warn("[Login 2FA] Decryption notice:", err.message);
      }
    }

    // Secure JWT Token Generation
    const JWT_SECRET = process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET";
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "2FA Login successful! Session granted.",
      user
    });
  } catch (error) {
    console.error("2FA Verification Error:", error.message);
    res.status(500).json("Internal Server Error: " + error.message);
  }
};

/**
 * Verify User Session & Decrypt Profile Data with HMAC integrity check
 */
exports.verifyUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const JWT_SECRET = process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET";
    const decoded = jwt.verify(token, JWT_SECRET);

    try {
      const fullUser = await userModel.findById(decoded.id).select("-password -salt");
      if (!fullUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Decrypt RSA encrypted profile
      if (fullUser.encryptedProfile) {
        try {
          const decrypted = await crypto.dataCrypto.decryptWithRSA(fullUser.encryptedProfile);
          if (decrypted && typeof decrypted === "object") {
            fullUser.name = decrypted.name || fullUser.name;
            fullUser.email = decrypted.email || fullUser.email;
            fullUser.address = decrypted.address || fullUser.address;
            fullUser.phone = decrypted.phone || fullUser.phone;
            fullUser.company = decrypted.company || fullUser.company;
            fullUser.website = decrypted.website || fullUser.website;
          }
        } catch (decErr) {
          console.warn("[verifyUser] Profile decrypt warning:", decErr.message);
        }
      }

      return res.status(200).json({ message: "User verified", user: fullUser });
    } catch (e) {
      return res.status(200).json({ message: "User verified", user: decoded });
    }
  } catch (error) {
    return res.status(402).json({ message: "Invalid or expired token", error: error.message });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Update Avatar
 */
exports.updateAvatar = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const avatarPath = req.file.filename;
    const user = await userModel.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true }).select("-password -salt");
    return res.status(200).json({ message: "Avatar updated", user });
  } catch (err) {
    console.error("updateAvatar error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Add Favorite
 */
exports.addFavorite = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const { mangaId } = req.body;
    if (!mangaId) return res.status(400).json({ message: "mangaId required" });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.map(String).includes(String(mangaId))) {
      user.favorites.push(mangaId);
      await user.save();
    }
    return res.status(200).json({ message: "Added to favorites", favorites: user.favorites });
  } catch (err) {
    console.error("addFavorite error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Remove Favorite
 */
exports.removeFavorite = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const { mangaId } = req.body;
    if (!mangaId) return res.status(400).json({ message: "mangaId required" });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.favorites = (user.favorites || []).filter((f) => String(f) !== String(mangaId));
    await user.save();
    return res.status(200).json({ message: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    console.error("removeFavorite error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get Favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const user = await userModel.findById(userId).populate({ path: "favorites" });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ favorites: user.favorites || [] });
  } catch (err) {
    console.error("getFavorites error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Update Privacy Settings
 */
exports.updatePrivacy = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const { personalListPrivacy, reviewedPrivacy, favoritesPrivacy } = req.body;
    const allowed = (v) => v === "public" || v === "private";
    const update = {};
    if (allowed(personalListPrivacy)) update.personalListPrivacy = personalListPrivacy;
    if (allowed(reviewedPrivacy)) update.reviewedPrivacy = reviewedPrivacy;
    if (allowed(favoritesPrivacy)) update.favoritesPrivacy = favoritesPrivacy;
    const user = await userModel.findByIdAndUpdate(userId, update, { new: true }).select("-password -salt");
    return res.status(200).json({ message: "Privacy updated", user });
  } catch (err) {
    console.error("updatePrivacy error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Public User Favorites
 */
exports.getUserFavoritesPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).populate({ path: "favorites" }).select("favorites favoritesPrivacy");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ favorites: user.favorites || [], privacy: user.favoritesPrivacy || "private" });
  } catch (err) {
    console.error("getUserFavoritesPublic error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Follow User (Atomic $addToSet to avoid document validation conflicts)
 */
exports.followUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const { targetUserId } = req.body;

    if (!targetUserId) return res.status(400).json({ message: "targetUserId required" });
    if (String(userId) === String(targetUserId)) return res.status(400).json({ message: "Can't follow yourself" });

    // Atomic update
    const me = await userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { following: targetUserId } },
      { new: true }
    );
    const target = await userModel.findByIdAndUpdate(
      targetUserId,
      { $addToSet: { followers: userId } },
      { new: true }
    );

    if (!me || !target) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "Followed", following: me.following || [] });
  } catch (err) {
    console.error("followUser error", err.message);
    return res.status(500).json({ message: "Internal Server Error: " + err.message });
  }
};

/**
 * Unfollow User (Atomic $pull)
 */
exports.unfollowUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const userId = decoded.id;
    const { targetUserId } = req.body;

    if (!targetUserId) return res.status(400).json({ message: "targetUserId required" });

    // Atomic update
    const me = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { following: targetUserId } },
      { new: true }
    );
    const target = await userModel.findByIdAndUpdate(
      targetUserId,
      { $pull: { followers: userId } },
      { new: true }
    );

    if (!me || !target) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "Unfollowed", following: me.following || [] });
  } catch (err) {
    console.error("unfollowUser error", err.message);
    return res.status(500).json({ message: "Internal Server Error: " + err.message });
  }
};

/**
 * Public User Profile
 */
exports.getPublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel
      .findById(id)
      .select("-password -salt")
      .populate({ path: "following", select: "_id name avatar" })
      .populate({ path: "followers", select: "_id name avatar" });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("getPublicUser error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Activity Feed
 */
exports.getFeed = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    const me = await userModel.findById(decoded.id).select("following");
    const following = me?.following || [];
    if (!following.length) return res.status(200).json({ feed: [] });

    const reviews = await Review.find({ user: { $in: following } })
      .populate({ path: "user", select: "_id name avatar" })
      .populate({ path: "manga" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Decrypt RSA encrypted reviews in feed
    for (const rev of reviews) {
      if (rev.encryptedReview) {
        try {
          const decrypted = await crypto.dataCrypto.decryptWithRSA(rev.encryptedReview);
          rev.review = decrypted;
        } catch (decErr) {
          console.warn("[getFeed] Review decryption note:", decErr.message);
        }
      }
    }

    const ratings = await Rating.find({ user: { $in: following } })
      .populate({ path: "user", select: "_id name avatar" })
      .populate({ path: "manga" })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const feed = [
      ...reviews.map((r) => ({ type: "review", ...r })),
      ...ratings.map((r) => ({ type: "rating", ...r })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
    return res.status(200).json({ feed });
  } catch (err) {
    console.error("getFeed error", err.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Key Management: Public Key Distribution
 */
exports.getPublicKeys = async (req, res) => {
  try {
    const distribution = crypto.keyManager.getPublicDistribution();
    return res.status(200).json(distribution);
  } catch (err) {
    console.error("getPublicKeys error:", err.message);
    return res.status(500).json({ message: "Failed to get public keys" });
  }
};

/**
 * Key Management: Key Rotation (RBAC: Admin Only)
 */
exports.rotateKeys = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "CSE447_SECURE_JWT_SECRET");
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin role required for key rotation" });
    }

    const { keyType } = req.body;
    const result = await crypto.keyManager.rotateKeys(keyType || "ALL");
    return res.status(200).json({ message: "Key rotation successful", result });
  } catch (err) {
    console.error("rotateKeys error:", err.message);
    return res.status(500).json({ message: "Failed to rotate keys: " + err.message });
  }
};