/**
 * ==============================================================================
 * RSA Cryptographic Engine (Implemented from Scratch)
 * CSE447: Network Security & Cryptography
 * 
 * Includes:
 * 1. BigInt Modular Arithmetic (Extended Euclidean, Modular Exponentiation, Modular Inverse)
 * 2. Miller-Rabin Primality Testing & Prime Generation
 * 3. RSA Key Pair Generation (p, q, n, phi, e, d)
 * 4. Chunk-based String Encryption & Decryption (C = M^e mod n, M = C^d mod n)
 * ==============================================================================
 */

/**
 * Modular Exponentiation: Computes (base^exp) % mod efficiently
 * Complexity: O(log exp) using repeated squaring / binary exponentiation
 */
function modPow(base, exp, mod) {
  let b = BigInt(base) % BigInt(mod);
  let e = BigInt(exp);
  const m = BigInt(mod);
  let result = 1n;

  if (m === 1n) return 0n;

  while (e > 0n) {
    if (e % 2n === 1n) {
      result = (result * b) % m;
    }
    b = (b * b) % m;
    e = e / 2n;
  }
  return result;
}

/**
 * Extended Euclidean Algorithm
 * Computes gcd(a, b) and Bézout coefficients x, y such that: a*x + b*y = gcd(a, b)
 */
function extendedGCD(a, b) {
  let old_r = BigInt(a), r = BigInt(b);
  let old_s = 1n, s = 0n;
  let old_t = 0n, t = 1n;

  while (r !== 0n) {
    const quotient = old_r / r;
    
    let temp_r = r;
    r = old_r - quotient * r;
    old_r = temp_r;

    let temp_s = s;
    s = old_s - quotient * s;
    old_s = temp_s;

    let temp_t = t;
    t = old_t - quotient * t;
    old_t = temp_t;
  }

  return { gcd: old_r, x: old_s, y: old_t };
}

/**
 * Modular Multiplicative Inverse
 * Computes d such that (e * d) % phi === 1
 */
function modInverse(e, phi) {
  const { gcd, x } = extendedGCD(e, phi);
  if (gcd !== 1n) {
    throw new Error("Modular inverse does not exist (numbers are not coprime)");
  }
  // Ensure positive result in range [0, phi - 1]
  return ((x % phi) + phi) % phi;
}

/**
 * Miller-Rabin Probabilistic Primality Test
 * Determines whether candidate n is prime with error probability < 4^(-k)
 */
function isProbablePrime(n, k = 20) {
  const num = BigInt(n);
  if (num <= 1n) return false;
  if (num <= 3n) return true;
  if (num % 2n === 0n || num % 3n === 0n) return false;

  // Write n - 1 as 2^r * d
  let d = num - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r += 1n;
  }

  // Witness loop
  for (let i = 0; i < k; i++) {
    // Pick random base a in [2, n - 2]
    const a = 2n + BigInt(Math.floor(Math.random() * 1000000000)) % (num - 4n);
    let x = modPow(a, d, num);

    if (x === 1n || x === num - 1n) continue;

    let composite = true;
    for (let j = 0n; j < r - 1n; j++) {
      x = (x * x) % num;
      if (x === num - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

/**
 * Generates a random probable prime with the specified bit length
 */
function generatePrime(bits = 128) {
  const min = 1n << BigInt(bits - 1);
  const max = (1n << BigInt(bits)) - 1n;

  while (true) {
    // Generate random BigInt
    let hex = "";
    const hexDigits = Math.ceil(bits / 4);
    for (let i = 0; i < hexDigits; i++) {
      hex += Math.floor(Math.random() * 16).toString(16);
    }
    let candidate = BigInt("0x" + hex);
    // Ensure bit length and odd
    candidate = (candidate | min | 1n) & max;

    if (isProbablePrime(candidate, 25)) {
      return candidate;
    }
  }
}

/**
 * Generates an RSA Key Pair (Public & Private Keys)
 * @param {number} keySizeBits - e.g. 256 or 512 bits
 */
function generateKeyPair(keySizeBits = 256) {
  const primeBits = Math.floor(keySizeBits / 2);
  let p, q, n, phi, e, d;

  const standardE = 65537n;

  while (true) {
    p = generatePrime(primeBits);
    q = generatePrime(primeBits);
    if (p === q) continue;

    n = p * q;
    phi = (p - 1n) * (q - 1n);

    // Verify e and phi are coprime
    const { gcd } = extendedGCD(standardE, phi);
    if (gcd === 1n) {
      e = standardE;
      try {
        d = modInverse(e, phi);
        break;
      } catch {
        continue;
      }
    }
  }

  return {
    publicKey: {
      e: e.toString(),
      n: n.toString(),
      algorithm: "RSA-SCRATCH"
    },
    privateKey: {
      d: d.toString(),
      n: n.toString(),
      algorithm: "RSA-SCRATCH"
    }
  };
}

/**
 * Encrypts a plaintext string using RSA Public Key (e, n)
 * Chunks string into numeric blocks to support arbitrary string sizes.
 */
function encrypt(plaintext, publicKey) {
  if (typeof plaintext !== "string") {
    plaintext = JSON.stringify(plaintext);
  }

  const e = BigInt(publicKey.e);
  const n = BigInt(publicKey.n);

  const bytes = Buffer.from(plaintext, "utf-8");
  // Calculate max chunk size in bytes so block integer is strictly < n
  const nBytes = Math.floor((n.toString(2).length - 1) / 8);
  const chunkSize = Math.max(1, nBytes - 1);

  const encryptedBlocks = [];

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    // Convert chunk buffer to BigInt
    let m = 0n;
    for (let b = 0; b < chunk.length; b++) {
      m = (m << 8n) | BigInt(chunk[b]);
    }

    if (m >= n) {
      throw new Error(`Message block integer (${m}) exceeds RSA modulus n (${n})`);
    }

    // C = M^e mod n
    const c = modPow(m, e, n);
    encryptedBlocks.push({
      c: c.toString(16),
      len: chunk.length // Store original chunk byte length for lossless decoding
    });
  }

  return JSON.stringify({
    alg: "RSA-SCRATCH",
    blocks: encryptedBlocks
  });
}

/**
 * Decrypts RSA ciphertext using RSA Private Key (d, n)
 */
function decrypt(ciphertextJson, privateKey) {
  const payload = typeof ciphertextJson === "string" ? JSON.parse(ciphertextJson) : ciphertextJson;
  if (!payload || payload.alg !== "RSA-SCRATCH" || !Array.isArray(payload.blocks)) {
    throw new Error("Invalid RSA ciphertext format");
  }

  const d = BigInt(privateKey.d);
  const n = BigInt(privateKey.n);

  const decryptedChunks = [];

  for (const block of payload.blocks) {
    const c = BigInt("0x" + block.c);
    // M = C^d mod n
    const m = modPow(c, d, n);

    // Convert BigInt back to bytes of known length
    const len = block.len;
    const chunkBytes = Buffer.alloc(len);
    let temp = m;
    for (let b = len - 1; b >= 0; b--) {
      chunkBytes[b] = Number(temp & 0xffn);
      temp >>= 8n;
    }
    decryptedChunks.push(chunkBytes);
  }

  return Buffer.concat(decryptedChunks).toString("utf-8");
}

module.exports = {
  modPow,
  extendedGCD,
  modInverse,
  isProbablePrime,
  generatePrime,
  generateKeyPair,
  encrypt,
  decrypt
};
