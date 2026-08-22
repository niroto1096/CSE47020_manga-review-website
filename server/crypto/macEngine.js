/**
 * ==============================================================================
 * MAC / HMAC Engine (Implemented from Scratch)
 * CSE447: Network Security & Cryptography
 * 
 * Includes:
 * 1. Pure HMAC-SHA256 Implementation (RFC 2104 compliant)
 * 2. Key Padding (ipad 0x36, opad 0x5c)
 * 3. Data Integrity & Tamper Detection Verification
 * 4. Record Packaging with { ciphertext, mac, algorithm, key_version }
 * ==============================================================================
 */

const { sha256, constantTimeCompare } = require("./hashEngine");

const BLOCK_SIZE = 64; // 64 bytes (512 bits) for SHA-256
const IPAD = 0x36;
const OPAD = 0x5c;

/**
 * Computes HMAC-SHA256 from Scratch
 * HMAC(K, m) = H((K' ^ opad) || H((K' ^ ipad) || m))
 * 
 * @param {string|Buffer} message - The message data to authenticate
 * @param {string|Buffer} key - The secret MAC key
 * @returns {string} 64-character lowercase hex MAC
 */
function computeHMAC(message, key) {
  let keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(String(key), "utf-8");
  const msgBuf = Buffer.isBuffer(message) ? message : Buffer.from(String(message), "utf-8");

  // 1. If key is longer than block size, hash it first
  if (keyBuf.length > BLOCK_SIZE) {
    keyBuf = Buffer.from(sha256(keyBuf), "hex");
  }

  // 2. Pad key with zeroes to block size
  const paddedKey = Buffer.alloc(BLOCK_SIZE);
  keyBuf.copy(paddedKey, 0);

  // 3. Create inner and outer padded keys
  const kIpad = Buffer.alloc(BLOCK_SIZE);
  const kOpad = Buffer.alloc(BLOCK_SIZE);

  for (let i = 0; i < BLOCK_SIZE; i++) {
    kIpad[i] = paddedKey[i] ^ IPAD;
    kOpad[i] = paddedKey[i] ^ OPAD;
  }

  // 4. Inner hash: H((K' ^ ipad) || message)
  const innerData = Buffer.concat([kIpad, msgBuf]);
  const innerHashHex = sha256(innerData);
  const innerHashBuf = Buffer.from(innerHashHex, "hex");

  // 5. Outer hash: H((K' ^ opad) || innerHash)
  const outerData = Buffer.concat([kOpad, innerHashBuf]);
  return sha256(outerData);
}

/**
 * Verifies MAC to detect unauthorized modification / tampering
 * @param {string|Buffer} message 
 * @param {string|Buffer} key 
 * @param {string} expectedMAC 
 * @returns {boolean} True if data is intact and untampered
 */
function verifyHMAC(message, key, expectedMAC) {
  if (!expectedMAC) return false;
  const calculatedMAC = computeHMAC(message, key);
  return constantTimeCompare(calculatedMAC.toLowerCase(), expectedMAC.toLowerCase());
}

/**
 * Packages encrypted data with integrity metadata
 * Format required by CSE447 Project Plan:
 * {
 *   ciphertext,
 *   mac,
 *   algorithm,
 *   key_version
 * }
 */
function packageEncryptedRecord(ciphertext, algorithm, keyVersion, macKey) {
  const cipherStr = typeof ciphertext === "string" ? ciphertext : JSON.stringify(ciphertext);
  // MAC binds ciphertext + algorithm + keyVersion together
  const dataToSign = `${algorithm}:${keyVersion}:${cipherStr}`;
  const mac = computeHMAC(dataToSign, macKey);

  return {
    ciphertext: cipherStr,
    mac,
    algorithm,
    key_version: keyVersion || "v1"
  };
}

/**
 * Verifies and unpacks an encrypted record
 * Throws an error if tampering or invalid MAC is detected
 */
function verifyEncryptedRecord(record, macKey) {
  if (!record || !record.ciphertext || !record.mac) {
    throw new Error("Invalid encrypted record format (missing ciphertext or MAC)");
  }

  const dataToVerify = `${record.algorithm}:${record.key_version}:${record.ciphertext}`;
  const isValid = verifyHMAC(dataToVerify, macKey, record.mac);

  if (!isValid) {
    throw new Error(`Data integrity violation! MAC verification failed for record (Tampering detected).`);
  }

  return record.ciphertext;
}

module.exports = {
  computeHMAC,
  verifyHMAC,
  packageEncryptedRecord,
  verifyEncryptedRecord
};
