/**
 * ==============================================================================
 * High-Level Data Encryption & Integrity Wrapper
 * CSE447: Network Security & Cryptography
 * 
 * Provides automated encryption/decryption with HMAC integrity verification:
 * - RSA Asymmetric for User Profiles, PII, and Reviews
 * - ECC Asymmetric for Personal Lists, History, and Favorites
 * ==============================================================================
 */

const rsaEngine = require("./rsaEngine");
const eccEngine = require("./eccEngine");
const macEngine = require("./macEngine");
const keyManager = require("./keyManager");

/**
 * Encrypts data using the active RSA Public Key and packages with HMAC MAC
 */
async function encryptWithRSA(plainData) {
  const activeRSA = await keyManager.getActiveRSAKey();
  const activeMAC = await keyManager.getActiveMACKey();

  const text = typeof plainData === "string" ? plainData : JSON.stringify(plainData);
  const cipher = rsaEngine.encrypt(text, activeRSA.publicKey);
  const envelope = macEngine.packageEncryptedRecord(cipher, "RSA-SCRATCH", activeRSA.version, activeMAC.secretKey);

  return envelope;
}

/**
 * Verifies MAC integrity and decrypts RSA ciphertext
 */
async function decryptWithRSA(envelope) {
  if (!envelope) return null;
  if (typeof envelope === "string") {
    try {
      envelope = JSON.parse(envelope);
    } catch {
      return envelope; // Plain text fallback
    }
  }

  if (!envelope.ciphertext || !envelope.mac) {
    return envelope; // Not an encrypted envelope
  }

  const version = envelope.key_version || "v1";
  const rsaKey = await keyManager.getRSAKey(version) || await keyManager.getActiveRSAKey();
  const macKey = await keyManager.getMACKey(version) || await keyManager.getActiveMACKey();

  // Verify MAC integrity (throws error if tampered)
  const untamperedCipher = macEngine.verifyEncryptedRecord(envelope, macKey.secretKey);
  const decryptedText = rsaEngine.decrypt(untamperedCipher, rsaKey.privateKey);

  try {
    return JSON.parse(decryptedText);
  } catch {
    return decryptedText;
  }
}

/**
 * Encrypts data using the active ECC Public Key and packages with HMAC MAC
 */
async function encryptWithECC(plainData) {
  const activeECC = await keyManager.getActiveECCKey();
  const activeMAC = await keyManager.getActiveMACKey();

  const text = typeof plainData === "string" ? plainData : JSON.stringify(plainData);
  const cipher = eccEngine.encrypt(text, activeECC.publicKey);
  const envelope = macEngine.packageEncryptedRecord(cipher, "ECC-SCRATCH", activeECC.version, activeMAC.secretKey);

  return envelope;
}

/**
 * Verifies MAC integrity and decrypts ECC ciphertext
 */
async function decryptWithECC(envelope) {
  if (!envelope) return null;
  if (typeof envelope === "string") {
    try {
      envelope = JSON.parse(envelope);
    } catch {
      return envelope; // Plain text fallback
    }
  }

  if (!envelope.ciphertext || !envelope.mac) {
    return envelope; // Not an encrypted envelope
  }

  const version = envelope.key_version || "v1";
  const eccKey = await keyManager.getECCKey(version) || await keyManager.getActiveECCKey();
  const macKey = await keyManager.getMACKey(version) || await keyManager.getActiveMACKey();

  // Verify MAC integrity (throws error if tampered)
  const untamperedCipher = macEngine.verifyEncryptedRecord(envelope, macKey.secretKey);
  const decryptedText = eccEngine.decrypt(untamperedCipher, eccKey.privateKey);

  try {
    return JSON.parse(decryptedText);
  } catch {
    return decryptedText;
  }
}

module.exports = {
  encryptWithRSA,
  decryptWithRSA,
  encryptWithECC,
  decryptWithECC
};
