/**
 * ==============================================================================
 * Key Management Module (CSE447 Requirement #5)
 * Handles Key Generation, Distribution, Secure Storage, Versioning, and Rotation
 * ==============================================================================
 */

const mongoose = require("mongoose");
const CryptoKey = require("../models/keyModel");
const rsaEngine = require("./rsaEngine");
const eccEngine = require("./eccEngine");
const hashEngine = require("./hashEngine");

// In-memory key cache for high-performance cryptographic operations
const keyCache = {
  RSA: new Map(),
  ECC: new Map(),
  MAC: new Map(),
  active: {
    RSA: null,
    ECC: null,
    MAC: null
  }
};

function isDbConnected() {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Initializes cryptographic keys on server startup.
 * Generates initial 'v1' keys if none exist in the database.
 */
async function initializeKeys() {
  try {
    const keyTypes = ["RSA", "ECC", "MAC"];

    for (const type of keyTypes) {
      let activeKey = null;
      if (isDbConnected()) {
        try {
          activeKey = await CryptoKey.findOne({ keyType: type, isActive: true });
        } catch (dbErr) {
          console.warn(`[KeyManager] DB query error for ${type}:`, dbErr.message);
        }
      }

      if (!activeKey) {
        console.log(`[KeyManager] Initializing ${type} key v1...`);
        activeKey = await generateAndSaveKey(type, "v1");
      }

      // Populate Cache
      cacheKey(activeKey);
    }

    console.log("[KeyManager] Key Management Module initialized successfully.");
    console.log(`[KeyManager] Active Versions -> RSA: ${keyCache.active.RSA?.version}, ECC: ${keyCache.active.ECC?.version}, MAC: ${keyCache.active.MAC?.version}`);
  } catch (error) {
    console.error("[KeyManager] Error initializing keys:", error.message);
  }
}

/**
 * Generates and stores a new key pair for a given key type and version
 */
async function generateAndSaveKey(keyType, version) {
  let publicKey = null;
  let privateKey = null;
  let secretKey = null;

  if (keyType === "RSA") {
    const rsaPair = rsaEngine.generateKeyPair(256);
    publicKey = rsaPair.publicKey;
    privateKey = rsaPair.privateKey;
  } else if (keyType === "ECC") {
    const eccPair = eccEngine.generateKeyPair();
    publicKey = eccPair.publicKey;
    privateKey = eccPair.privateKey;
  } else if (keyType === "MAC") {
    // Generate 256-bit random hex secret key for HMAC
    secretKey = hashEngine.generateSalt(32);
  }

  const keyDoc = {
    keyType,
    version,
    isActive: true,
    publicKey,
    privateKey,
    secretKey,
    createdAt: new Date()
  };

  if (isDbConnected()) {
    try {
      const created = await CryptoKey.create(keyDoc);
      return created;
    } catch (err) {
      console.warn(`[KeyManager] Could not save key to DB:`, err.message);
    }
  }

  return keyDoc;
}

/**
 * Caches a key document in memory
 */
function cacheKey(keyDoc) {
  if (!keyDoc) return;
  const { keyType, version, isActive } = keyDoc;
  if (!keyCache[keyType]) keyCache[keyType] = new Map();
  keyCache[keyType].set(version, keyDoc);

  if (isActive) {
    keyCache.active[keyType] = keyDoc;
  }
}

/**
 * Retrieves the currently active RSA key
 */
async function getActiveRSAKey() {
  if (keyCache.active.RSA) return keyCache.active.RSA;
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "RSA", isActive: true });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  // Generate on-demand fallback
  const generated = await generateAndSaveKey("RSA", "v1");
  cacheKey(generated);
  return generated;
}

/**
 * Retrieves RSA key by version
 */
async function getRSAKey(version = "v1") {
  if (keyCache.RSA.has(version)) return keyCache.RSA.get(version);
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "RSA", version });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  return null;
}

/**
 * Retrieves the currently active ECC key
 */
async function getActiveECCKey() {
  if (keyCache.active.ECC) return keyCache.active.ECC;
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "ECC", isActive: true });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  // Generate on-demand fallback
  const generated = await generateAndSaveKey("ECC", "v1");
  cacheKey(generated);
  return generated;
}

/**
 * Retrieves ECC key by version
 */
async function getECCKey(version = "v1") {
  if (keyCache.ECC.has(version)) return keyCache.ECC.get(version);
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "ECC", version });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  return null;
}

/**
 * Retrieves the currently active MAC key
 */
async function getActiveMACKey() {
  if (keyCache.active.MAC) return keyCache.active.MAC;
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "MAC", isActive: true });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  // Generate on-demand fallback
  const generated = await generateAndSaveKey("MAC", "v1");
  cacheKey(generated);
  return generated;
}

/**
 * Retrieves MAC key by version
 */
async function getMACKey(version = "v1") {
  if (keyCache.MAC.has(version)) return keyCache.MAC.get(version);
  if (isDbConnected()) {
    const key = await CryptoKey.findOne({ keyType: "MAC", version });
    if (key) {
      cacheKey(key);
      return key;
    }
  }
  return null;
}

/**
 * Rotates keys for a given type (or all types)
 * Creates a new version (e.g. v1 -> v2) and marks old active keys as inactive
 */
async function rotateKeys(keyType = "ALL") {
  const typesToRotate = keyType === "ALL" ? ["RSA", "ECC", "MAC"] : [keyType];
  const results = {};

  for (const type of typesToRotate) {
    const currentActive = keyCache.active[type];
    let newVersionNum = 1;

    if (currentActive && currentActive.version) {
      const match = currentActive.version.match(/v(\d+)/);
      if (match) {
        newVersionNum = parseInt(match[1], 10) + 1;
      }
      currentActive.isActive = false;
      currentActive.rotatedAt = new Date();

      if (isDbConnected()) {
        try {
          await CryptoKey.updateMany({ keyType: type, isActive: true }, { isActive: false, rotatedAt: new Date() });
        } catch (err) {
          console.warn(`[KeyManager] Could not update active keys in DB for ${type}:`, err.message);
        }
      }
    }

    const newVersion = `v${newVersionNum}`;
    const newKey = await generateAndSaveKey(type, newVersion);
    cacheKey(newKey);

    results[type] = {
      previousVersion: currentActive ? currentActive.version : "none",
      activeVersion: newVersion,
      rotatedAt: new Date()
    };
  }

  console.log(`[KeyManager] Key rotation completed:`, results);
  return results;
}

/**
 * Public Key Distribution
 * Exports public key certificates and active versions (no private or secret keys exposed)
 */
function getPublicDistribution() {
  return {
    RSA: {
      version: keyCache.active.RSA?.version,
      publicKey: keyCache.active.RSA?.publicKey
    },
    ECC: {
      version: keyCache.active.ECC?.version,
      publicKey: keyCache.active.ECC?.publicKey
    },
    activeVersions: {
      RSA: keyCache.active.RSA?.version,
      ECC: keyCache.active.ECC?.version,
      MAC: keyCache.active.MAC?.version
    },
    system: "CSE447 Cryptographic Engine"
  };
}

module.exports = {
  initializeKeys,
  getActiveRSAKey,
  getRSAKey,
  getActiveECCKey,
  getECCKey,
  getActiveMACKey,
  getMACKey,
  rotateKeys,
  getPublicDistribution
};
