/**
 * ==============================================================================
 * Comprehensive Unit Test Suite for CSE447 Scratch Cryptographic Engines & Key Manager
 * ==============================================================================
 */

const crypto = require("./index");

async function runTests() {
  console.log("===============================================================");
  console.log("  CSE447 CRYPTOGRAPHY ENGINE TEST SUITE (SCRATCH IMPLEMENTATION) ");
  console.log("===============================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // --- 1. SHA-256 Tests ---
  console.log("--- Testing Pure SHA-256 Hash Engine ---");
  const emptyHash = crypto.hash.sha256("");
  assert(
    emptyHash === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "SHA-256: Empty string digest matches NIST standard"
  );

  const abcHash = crypto.hash.sha256("abc");
  assert(
    abcHash === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    "SHA-256: 'abc' digest matches NIST standard"
  );

  // --- 2. Salted Password Hashing Tests ---
  console.log("\n--- Testing Salted Password Hashing & Verification ---");
  const password = "SuperSecretPassword123!";
  const salt = crypto.hash.generateSalt(16);
  const passwordHash = crypto.hash.hashPassword(password, salt);

  assert(salt.length === 32, "Salt generation produces 32 hex characters (16 bytes)");
  assert(
    crypto.hash.verifyPassword(password, salt, passwordHash) === true,
    "Password Verification: Correct password succeeds"
  );
  assert(
    crypto.hash.verifyPassword("WrongPassword", salt, passwordHash) === false,
    "Password Verification: Incorrect password fails"
  );

  // --- 3. HMAC Engine & Tamper Detection Tests ---
  console.log("\n--- Testing Pure HMAC & Data Integrity Verification ---");
  const macKey = "CSE447_LAB_PROJECT_SECRET_KEY";
  const messageData = "Manga review: Berserk is an absolute masterpiece!";
  const hmac = crypto.mac.computeHMAC(messageData, macKey);

  assert(
    crypto.mac.verifyHMAC(messageData, macKey, hmac) === true,
    "HMAC Verification: Authentic message verified successfully"
  );
  assert(
    crypto.mac.verifyHMAC(messageData + " [tampered]", macKey, hmac) === false,
    "HMAC Verification: Tampered message rejected"
  );

  // --- 4. RSA Asymmetric Engine Tests ---
  console.log("\n--- Testing Pure RSA Asymmetric Engine (From Scratch) ---");
  console.log("Generating 256-bit RSA key pair (prime generation & Miller-Rabin test)...");
  const startRsaKey = Date.now();
  const rsaKeys = crypto.rsa.generateKeyPair(256);
  console.log(`RSA Key Pair generated in ${Date.now() - startRsaKey}ms`);

  const userSensitiveData = "User Email: user@example.com, Phone: +1-555-0199, Address: Sector 4, Dhaka";
  const rsaCipher = crypto.rsa.encrypt(userSensitiveData, rsaKeys.publicKey);
  const rsaDecrypted = crypto.rsa.decrypt(rsaCipher, rsaKeys.privateKey);

  assert(rsaDecrypted === userSensitiveData, "RSA: Encrypt and Decrypt UTF-8 user PII text matches perfectly");

  // --- 5. ECC Asymmetric Engine Tests ---
  console.log("\n--- Testing Pure ECC Asymmetric Engine (From Scratch) ---");
  console.log("Generating ECC Key Pair over secp256k1 curve...");
  const startEccKey = Date.now();
  const eccKeys = crypto.ecc.generateKeyPair();
  console.log(`ECC Key Pair generated in ${Date.now() - startEccKey}ms`);

  const personalListData = JSON.stringify({
    status: "Reading",
    mangaId: "64e29b9f848b1a001c456789",
    progressChapter: 45,
    notes: "Peak fiction arc"
  });

  const eccCipher = crypto.ecc.encrypt(personalListData, eccKeys.publicKey);
  const eccDecrypted = crypto.ecc.decrypt(eccCipher, eccKeys.privateKey);

  assert(eccDecrypted === personalListData, "ECC: Encrypt and Decrypt personal list data matches perfectly");

  // --- 6. Packaged Envelope with MAC & Tamper Detection ---
  console.log("\n--- Testing Complete Envelope { ciphertext, mac, algorithm, key_version } ---");
  const packageRecord = crypto.mac.packageEncryptedRecord(rsaCipher, "RSA-SCRATCH", "v1", macKey);

  assert(
    packageRecord.algorithm === "RSA-SCRATCH" && packageRecord.key_version === "v1",
    "Record Packaging: Envelope has required metadata"
  );

  const unpackedCipher = crypto.mac.verifyEncryptedRecord(packageRecord, macKey);
  const finalDecrypted = crypto.rsa.decrypt(unpackedCipher, rsaKeys.privateKey);
  assert(finalDecrypted === userSensitiveData, "Record Unpacking: Untampered record unpacked & decrypted successfully");

  // Tamper simulation
  let tamperDetected = false;
  try {
    const tamperedRecord = { ...packageRecord, ciphertext: packageRecord.ciphertext + "X" };
    crypto.mac.verifyEncryptedRecord(tamperedRecord, macKey);
  } catch (err) {
    tamperDetected = true;
  }
  assert(tamperDetected === true, "Integrity Check: Tampered ciphertext immediately rejected by MAC verification");

  // --- 7. Key Management & Rotation Tests ---
  console.log("\n--- Testing Key Management & Rotation Module ---");
  await crypto.keyManager.initializeKeys();
  const activeRSA = await crypto.keyManager.getActiveRSAKey();
  const activeECC = await crypto.keyManager.getActiveECCKey();
  const activeMAC = await crypto.keyManager.getActiveMACKey();

  assert(activeRSA && activeRSA.publicKey && activeRSA.version === "v1", "KeyManager: Initialized active RSA key v1");
  assert(activeECC && activeECC.publicKey && activeECC.version === "v1", "KeyManager: Initialized active ECC key v1");
  assert(activeMAC && activeMAC.secretKey && activeMAC.version === "v1", "KeyManager: Initialized active MAC key v1");

  // Test Key Distribution (Safe Public Certificate)
  const publicDist = crypto.keyManager.getPublicDistribution();
  assert(
    publicDist.RSA.publicKey && !publicDist.RSA.privateKey && publicDist.ECC.publicKey && !publicDist.ECC.privateKey,
    "Key Distribution: Exports public keys securely without exposing private keys"
  );

  // Test Key Rotation
  console.log("Executing Key Rotation (v1 -> v2)...");
  const rotationResult = await crypto.keyManager.rotateKeys("ALL");
  const newActiveRSA = await crypto.keyManager.getActiveRSAKey();
  assert(
    rotationResult.RSA.activeVersion === "v2" && newActiveRSA.version === "v2",
    "Key Rotation: Successfully rotated RSA keys to v2"
  );

  console.log("\n===============================================================");
  console.log(`  RESULT: ${passed}/${total} TESTS PASSED SUCCESSFULLY! `);
  console.log("===============================================================\n");
}

runTests();
