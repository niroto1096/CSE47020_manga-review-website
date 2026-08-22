const mongoose = require("mongoose");

const keySchema = new mongoose.Schema({
  keyType: {
    type: String,
    enum: ["RSA", "ECC", "MAC"],
    required: true
  },
  version: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publicKey: {
    type: mongoose.Schema.Types.Mixed // Object containing e, n or x, y
  },
  privateKey: {
    type: mongoose.Schema.Types.Mixed // Object containing d, n or d scalar
  },
  secretKey: {
    type: String // For MAC
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  rotatedAt: {
    type: Date
  }
});

// Composite unique index on keyType and version
keySchema.index({ keyType: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("CryptoKey", keySchema);
