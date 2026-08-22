const PersonalList = require("../models/personalListModel");
const userModel = require("../models/userModel");
const crypto = require("../crypto");

// Create or update an entry (Encrypted with ECC from Scratch)
const updatePersonalList = async (req, res) => {
  try {
    const { userId, mangaId, status } = req.body;
    if (!userId || !mangaId || !status) {
      return res
        .status(400)
        .json({ message: "userId, mangaId, and status are required" });
    }

    // Encrypt reading list status with ECC
    const listPayload = { status, mangaId, updatedAt: new Date() };
    const encryptedData = await crypto.dataCrypto.encryptWithECC(listPayload);

    let entry = await PersonalList.findOne({ user: userId, manga: mangaId });

    if (entry) {
      entry.status = status;
      entry.encryptedData = encryptedData;
      await entry.save();
    } else {
      entry = await PersonalList.create({
        user: userId,
        manga: mangaId,
        status,
        encryptedData
      });
    }

    return res
      .status(200)
      .json({ message: "Personal list updated & ECC encrypted", data: entry });
  } catch (err) {
    console.error("Error in updatePersonalList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get the current status for a user + manga (Decrypted on Retrieval)
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
      return res.status(200).json({ status: null });
    }

    // Decrypt ECC container
    if (entry.encryptedData) {
      try {
        const decrypted = await crypto.dataCrypto.decryptWithECC(entry.encryptedData);
        if (decrypted && decrypted.status) {
          entry.status = decrypted.status;
        }
      } catch (decErr) {
        console.warn("[getStatus] ECC decrypt notice:", decErr.message);
      }
    }

    return res.status(200).json({ status: entry.status, data: entry });
  } catch (err) {
    console.error("Error in getStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get paginated personal list for a user (with ECC Decryption)
const getList = async (req, res) => {
  try {
    const { userId, page = 1, limit = 20, status } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const query = { user: userId };
    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: "Unread" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      PersonalList.find(query)
        .populate("manga")
        .skip(skip)
        .limit(Number(limit)),
      PersonalList.countDocuments(query),
    ]);

    for (const item of items) {
      if (item.encryptedData) {
        try {
          const decrypted = await crypto.dataCrypto.decryptWithECC(item.encryptedData);
          if (decrypted && decrypted.status) {
            item.status = decrypted.status;
          }
        } catch (decErr) {
          console.warn("[getList] ECC decrypt notice:", decErr.message);
        }
      }
    }

    return res.status(200).json({ total, page: Number(page), items });
  } catch (err) {
    console.error("Error in getList:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUBLIC: get a user's personal list if privacy allows
const getListPublic = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).select("personalListPrivacy");
    if (!user) return res.status(404).json({ message: "User not found" });
    if ((user.personalListPrivacy || "private") !== "public") {
      return res.status(200).json({ items: [], privacy: "private" });
    }
    const items = await PersonalList.find({ user: id, status: { $ne: "Unread" } }).populate("manga");

    for (const item of items) {
      if (item.encryptedData) {
        try {
          const decrypted = await crypto.dataCrypto.decryptWithECC(item.encryptedData);
          if (decrypted && decrypted.status) {
            item.status = decrypted.status;
          }
        } catch (decErr) {
          console.warn("[getListPublic] ECC decrypt notice:", decErr.message);
        }
      }
    }

    return res.status(200).json({ items, privacy: "public" });
  } catch (err) {
    console.error("getListPublic error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  updatePersonalList,
  getStatus,
  getList,
  getListPublic,
};
