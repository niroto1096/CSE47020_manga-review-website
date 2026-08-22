/**
 * ==============================================================================
 * Central Cryptography Module
 * CSE447: Network Security & Cryptography
 * 
 * Exports all scratch-implemented cryptographic primitives & services:
 * - RSA Asymmetric Engine (RSA-SCRATCH)
 * - ECC Asymmetric Engine (ECC-SCRATCH)
 * - SHA-256 Hash & Salted Password Engine (HASH-SCRATCH)
 * - HMAC Message Authentication Code Engine (MAC-SCRATCH)
 * - Key Management Module (Generation, Storage, Distribution, Rotation)
 * - Data Encryption & Integrity Wrapper (dataCrypto)
 * ==============================================================================
 */

const rsaEngine = require("./rsaEngine");
const eccEngine = require("./eccEngine");
const hashEngine = require("./hashEngine");
const macEngine = require("./macEngine");
const keyManager = require("./keyManager");
const dataCrypto = require("./dataCrypto");

module.exports = {
  rsa: rsaEngine,
  ecc: eccEngine,
  hash: hashEngine,
  mac: macEngine,
  keyManager: keyManager,
  dataCrypto: dataCrypto
};
