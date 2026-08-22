const mongoose = require("mongoose");

const personalListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    manga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mangas",
      required: true,
    },
    status: {
      type: String,
      enum: ["Reading", "Completed", "Planned", "Unread"],
      default: "Unread",
    },
    // Encrypted Container (ECC Encrypted + HMAC Integrity Envelope)
    encryptedData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const PersonalList = mongoose.model("personal_lists", personalListSchema);

module.exports = PersonalList;
