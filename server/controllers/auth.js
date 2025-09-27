const userModel = require('../models/userModel')
const otpModel = require('../models/otpModel')
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const Review = require('../models/reviewModel')
const Rating = require('../models/ratingModel')

exports.registration = async (req, res) => {
  try {
    const { name, email,password, address, phone, company, website ,role } = req.body;


    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json("User already exists!");
    }

    if (password.length < 8) {
      return res
        .status(402)
        .json("Password must be at least 8 characters long!");
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await otpModel.create({
      name,
      email,
      password,
      address,
      phone,
      company,
      website,
      role,
      otp,
      
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "konodiosama69@gmail.com",
        pass: "fekm kopo koua kmuv",
      },
    });

    const mailOptions = {
      from: '"Page2Page" konodiosama69@gmail.com',
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is: <b>${otp}</b></p><p>This OTP is valid for 1 minutes.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json("OTP sent to your email. Please verify to complete registration.");
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json("Something went wrong");
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    
    console.log(otp,email)
    const record = await otpModel.findOne({ email });
    if (!record) {
      return res.status(400).json("Your OTP has expired!");
    }

    if (record.otp !== otp) {
      return res.status(400).json("Invalid OTP!");
    }

    const { name, password, address, phone, company, website ,role  } = record;
    await userModel.create({ name, email,password, address, phone, company, website ,role  });

    await otpModel.deleteOne({ email });

    res.status(200).json("Account created successfully!");
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json("Internal Server Error");
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET 
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json("User not found!");
    }

    if (user.password !== password) {
      return res.status(400).json("Invalid credentials!");
    }

    
    const token = jwt.sign({ id: user._id, name:user.name, email: user.email,role : user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    
    res.cookie("token", token, {
      httpOnly: true,
      secure: "production",
      sameSite: "None", 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json("Internal Server Error");
  }
};


exports.verifyUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    req.user = decoded; 

    // Return the latest user record from DB to include fields like avatar
    try {
      const fullUser = await userModel.findById(decoded.id).select('-password');
      return res.status(200).json({ message: "User verified", user: fullUser || decoded });
    } catch (e) {
      return res.status(200).json({ message: "User verified", user: decoded });
    }
  } catch (error) {
    return res.status(402).json({ message: "Invalid or expired token", error: error.message });
  }
};


exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: 'production',
      sameSite: 'None',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update avatar: expects multipart/form-data with file field "avatar"
exports.updateAvatar = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const avatarPath = req.file.filename; // stored in /uploads
    const user = await userModel.findByIdAndUpdate(userId, { avatar: avatarPath }, { new: true }).select('-password');
    return res.status(200).json({ message: 'Avatar updated', user });
  } catch (err) {
    console.error('updateAvatar error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Add manga to user's favorites
exports.addFavorite = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { mangaId } = req.body;
    if (!mangaId) return res.status(400).json({ message: 'mangaId required' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.favorites) user.favorites = [];
    if (!user.favorites.map(String).includes(String(mangaId))) {
      user.favorites.push(mangaId);
      await user.save();
    }
    return res.status(200).json({ message: 'Added to favorites', favorites: user.favorites });
  } catch (err) {
    console.error('addFavorite error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Remove manga from favorites
exports.removeFavorite = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { mangaId } = req.body;
    if (!mangaId) return res.status(400).json({ message: 'mangaId required' });

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.favorites = (user.favorites || []).filter((f) => String(f) !== String(mangaId));
    await user.save();
    return res.status(200).json({ message: 'Removed from favorites', favorites: user.favorites });
  } catch (err) {
    console.error('removeFavorite error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Get populated favorites
exports.getFavorites = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const user = await userModel.findById(userId).populate({ path: 'favorites' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ favorites: user.favorites || [] });
  } catch (err) {
    console.error('getFavorites error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Update privacy settings (auth required)
exports.updatePrivacy = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { personalListPrivacy, reviewedPrivacy, favoritesPrivacy } = req.body;
    const allowed = (v) => (v === 'public' || v === 'private');
    const update = {};
    if (allowed(personalListPrivacy)) update.personalListPrivacy = personalListPrivacy;
    if (allowed(reviewedPrivacy)) update.reviewedPrivacy = reviewedPrivacy;
    if (allowed(favoritesPrivacy)) update.favoritesPrivacy = favoritesPrivacy;
    const user = await userModel.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    return res.status(200).json({ message: 'Privacy updated', user });
  } catch (err) {
    console.error('updatePrivacy error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Public: get favorites of a specific user (for public profile views)
exports.getUserFavoritesPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).populate({ path: 'favorites' }).select('favorites favoritesPrivacy');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ favorites: user.favorites || [], privacy: user.favoritesPrivacy || 'private' });
  } catch (err) {
    console.error('getUserFavoritesPublic error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const { addXp, XP_PER_FOLLOW_GAINED } = require("../lib/leveling");

// Follow another user
exports.followUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId required' });
    if (String(userId) === String(targetUserId)) return res.status(400).json({ message: "Can't follow yourself" });

    const me = await userModel.findById(userId);
    const target = await userModel.findById(targetUserId);
    if (!me || !target) return res.status(404).json({ message: 'User not found' });
    me.following = me.following || [];
    target.followers = target.followers || [];
    if (!me.following.map(String).includes(String(targetUserId))) me.following.push(targetUserId);
    let newFollowerAdded = false;
    if (!target.followers.map(String).includes(String(userId))) {
      target.followers.push(userId);
      newFollowerAdded = true;
    }
    await me.save();
    if (newFollowerAdded) {
      try {
        addXp(target, XP_PER_FOLLOW_GAINED);
      } catch {}
    }
    await target.save();
    return res.status(200).json({ message: 'Followed', following: me.following });
  } catch (err) {
    console.error('followUser error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Unfollow
exports.unfollowUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: 'targetUserId required' });
    const me = await userModel.findById(userId);
    const target = await userModel.findById(targetUserId);
    if (!me || !target) return res.status(404).json({ message: 'User not found' });
    me.following = (me.following || []).filter((f) => String(f) !== String(targetUserId));
    target.followers = (target.followers || []).filter((f) => String(f) !== String(userId));
    await me.save();
    await target.save();
    return res.status(200).json({ message: 'Unfollowed', following: me.following });
  } catch (err) {
    console.error('unfollowUser error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Leaderboard: top users by level then totalXp
exports.getLeaderboard = async (req, res) => {
  try {
    const users = await userModel
      .find({})
      .select('name avatar level xp totalXp totalReviews totalComments totalReviewLikesReceived')
      .sort({ level: -1, totalXp: -1 })
      .limit(50)
      .lean();
    return res.status(200).json({ users });
  } catch (err) {
    console.error('getLeaderboard error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Public user details
exports.getPublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel
      .findById(id)
      .select('-password')
      .populate({ path: 'following', select: '_id name avatar' })
      .populate({ path: 'followers', select: '_id name avatar' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ user });
  } catch (err) {
    console.error('getPublicUser error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Activity feed from followed users
exports.getFeed = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const me = await userModel.findById(decoded.id).select('following');
    const following = me?.following || [];
    if (!following.length) return res.status(200).json({ feed: [] });

    const reviews = await Review.find({ user: { $in: following } })
      .populate({ path: 'user', select: '_id name avatar' })
      .populate({ path: 'manga' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const ratings = await Rating.find({ user: { $in: following } })
      .populate({ path: 'user', select: '_id name avatar' })
      .populate({ path: 'manga' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    const feed = [
      ...reviews.map((r) => ({ type: 'review', ...r })),
      ...ratings.map((r) => ({ type: 'rating', ...r })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
    return res.status(200).json({ feed });
  } catch (err) {
    console.error('getFeed error', err.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Delete user profile and all associated data
exports.deleteUserProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Import required models
    const Comment = require('../models/commentsModel');
    const PersonalList = require('../models/personalListModel');
    const Rating = require('../models/ratingModel');

    // Delete all user's reviews
    await Review.deleteMany({ user: userId });

    // Delete all user's comments
    await Comment.deleteMany({ user: userId });

    // Delete all user's ratings
    await Rating.deleteMany({ user: userId });

    // Delete all user's personal list entries
    await PersonalList.deleteMany({ user: userId });

    // Remove user from other users' following/followers lists
    await userModel.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    await userModel.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );

    // Remove user from manga raters list and favorites
    const Manga = require('../models/mangaModel');
    await Manga.updateMany(
      { raters: userId },
      { $pull: { raters: userId } }
    );
    await userModel.updateMany(
      { favorites: { $exists: true } },
      { $pull: { favorites: userId } }
    );

    // Remove user from review likes/dislikes
    await Review.updateMany(
      { $or: [{ likes: userId }, { dislikes: userId }] },
      { $pull: { likes: userId, dislikes: userId } }
    );

    // Remove user from comment likes/dislikes
    await Comment.updateMany(
      { $or: [{ likes: userId }, { dislikes: userId }] },
      { $pull: { likes: userId, dislikes: userId } }
    );

    // Finally, delete the user profile
    await userModel.findByIdAndDelete(userId);

    // Clear the authentication cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None'
    });

    return res.status(200).json({ 
      message: 'User profile and all associated data deleted successfully' 
    });

  } catch (err) {
    console.error('deleteUserProfile error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};