const PersonalList = require("../models/personalListModel");
const userModel = require("../models/userModel");

// Create or update an entry
const updatePersonalList = async (req, res) => {
  try {
    const { userId, mangaId, status } = req.body;
    if (!userId || !mangaId || !status) {
      return res
        .status(400)
        .json({ message: "userId, mangaId, and status are required" });
    }

    let entry = await PersonalList.findOne({ user: userId, manga: mangaId });

    if (entry) {
      entry.status = status;
      await entry.save();
    } else {
      entry = await PersonalList.create({
        user: userId,
        manga: mangaId,
        status,
      });
    }

    return res
      .status(200)
      .json({ message: "Personal list updated", data: entry });
  } catch (err) {
    console.error("Error in updatePersonalList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get the current status for a user + manga
const getStatus = async (req, res) => {
  try {
    const { userId, mangaId } = req.query;
    if (!userId || !mangaId) {
      return res
        .status(400)
        .json({ message: "userId and mangaId are required" });
    }

    const entry = await PersonalList.findOne({ user: userId, manga: mangaId });
    if (!entry) {
      return res.status(200).json({ status: null }); // not in list yet
    }

    return res.status(200).json({ status: entry.status, data: entry });
  } catch (err) {
    console.error("Error in getStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get paginated personal list for a user (optionally filtered by status)
const getList = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20, status } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Base query
    const query = { user: userId };

    if (status) {
      // Explicit filter if passed in query
      query.status = status;
    } else {
      // Default: exclude "Unread"
      query.status = { $ne: "Unread" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      PersonalList.find(query)
        .populate("manga") // returns full manga details
        .skip(skip)
        .limit(Number(limit)),
      PersonalList.countDocuments(query),
    ]);

    return res.status(200).json({ total, page: Number(page), items });
  } catch (err) {
    console.error("Error in getList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  updatePersonalList,
  getStatus,
  getList,
};

// PUBLIC: get a user's personal list if privacy allows
module.exports.getListPublic = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const viewerId = req.user?.id || null;
    const user = await userModel.findById(id).select('personalListPrivacy');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if ((user.personalListPrivacy || 'private') !== 'public') {
      return res.status(200).json({ items: [], privacy: 'private' });
    }
    const items = await PersonalList.find({ user: id, status: { $ne: 'Unread' } }).populate('manga');
    return res.status(200).json({ items, privacy: 'public' });
  } catch (err) {
    console.error('getListPublic error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
