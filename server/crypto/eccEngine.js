/**
 * ==============================================================================
 * ECC (Elliptic Curve Cryptography) Engine (Implemented from Scratch)
 * CSE447: Network Security & Cryptography
 * 
 * Includes:
 * 1. Finite Field Arithmetic over F_p (Modular Inverse, Addition, Multiplication)
 * 2. Elliptic Curve Operations (Point Addition, Point Doubling, Point at Infinity)
 * 3. Scalar Multiplication (k * P) using Double-and-Add Algorithm
 * 4. Asymmetric ECC Key Pair Generation (Private Scalar d, Public Point Q = d * G)
 * 5. Asymmetric ElGamal-style Point Encryption & Decryption for Strings
 * ==============================================================================
 */

const { extendedGCD } = require("./rsaEngine");

/**
 * Standard Curve Parameters (secp256k1 curve: y^2 = x^3 + 7 mod p)
 */
const CURVE = {
  // Prime field modulus p
  p: BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F"),
  // Curve equation coefficients y^2 = x^3 + a*x + b
  a: 0n,
  b: 7n,
  // Base Generator Point G = (Gx, Gy)
  G: {
    x: BigInt("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"),
    y: BigInt("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8")
  },
  // Order of G
  n: BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141")
};

/**
 * Modular arithmetic helper: handles negative inputs cleanly
 */
function mod(n, m) {
  const result = BigInt(n) % BigInt(m);
  return result >= 0n ? result : result + BigInt(m);
}

/**
 * Modular Inverse modulo p using Extended Euclidean Algorithm
 */
function modInverse(k, p) {
  const { gcd, x } = extendedGCD(mod(k, p), p);
  if (gcd !== 1n) {
    throw new Error("Inverse does not exist");
  }
  return mod(x, p);
}

/**
 * Checks if a point is the Point-at-Infinity (identity element O)
 */
function isInfinity(P) {
  return !P || P.infinity === true;
}

/**
 * Point Addition: R = P + Q on curve y^2 = x^3 + a*x + b mod p
 */
function pointAdd(P, Q, p = CURVE.p, a = CURVE.a) {
  if (isInfinity(P)) return Q;
  if (isInfinity(Q)) return P;

  const Px = mod(P.x, p);
  const Py = mod(P.y, p);
  const Qx = mod(Q.x, p);
  const Qy = mod(Q.y, p);

  // If Px == Qx and Py == -Qy (mod p), P + Q = Point at Infinity
  if (Px === Qx && mod(Py + Qy, p) === 0n) {
    return { infinity: true };
  }

  // If P == Q, perform Point Doubling
  if (Px === Qx && Py === Qy) {
    return pointDouble(P, p, a);
  }

  // Slope lambda = (Qy - Py) / (Qx - Px) mod p
  const num = mod(Qy - Py, p);
  const den = mod(Qx - Px, p);
  const lambda = mod(num * modInverse(den, p), p);

  // Rx = lambda^2 - Px - Qx mod p
  const Rx = mod(lambda * lambda - Px - Qx, p);
  // Ry = lambda * (Px - Rx) - Py mod p
  const Ry = mod(lambda * (Px - Rx) - Py, p);

  return { x: Rx, y: Ry };
}

/**
 * Point Doubling: R = 2 * P on curve y^2 = x^3 + a*x + b mod p
 */
function pointDouble(P, p = CURVE.p, a = CURVE.a) {
  if (isInfinity(P)) return P;
  if (mod(P.y, p) === 0n) return { infinity: true };

  const Px = mod(P.x, p);
  const Py = mod(P.y, p);

  // Slope lambda = (3 * Px^2 + a) / (2 * Py) mod p
  const num = mod(3n * Px * Px + a, p);
  const den = mod(2n * Py, p);
  const lambda = mod(num * modInverse(den, p), p);

  // Rx = lambda^2 - 2*Px mod p
  const Rx = mod(lambda * lambda - 2n * Px, p);
  // Ry = lambda * (Px - Rx) - Py mod p
  const Ry = mod(lambda * (Px - Rx) - Py, p);

  return { x: Rx, y: Ry };
}

/**
 * Scalar Point Multiplication: R = k * P using Double-and-Add Algorithm
 */
function scalarMultiply(k, P, p = CURVE.p, a = CURVE.a) {
  let scalar = BigInt(k);
  if (scalar === 0n || isInfinity(P)) return { infinity: true };

  let current = { x: P.x, y: P.y };
  let result = { infinity: true };

  while (scalar > 0n) {
    if (scalar & 1n) {
      result = pointAdd(result, current, p, a);
    }
    current = pointDouble(current, p, a);
    scalar >>= 1n;
  }

  return result;
}

/**
 * Generates an ECC Key Pair (Private Scalar d, Public Point Q = d * G)
 */
function generateKeyPair() {
  // Generate random private scalar d in range [1, n - 1]
  let hex = "";
  for (let i = 0; i < 64; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  const d = mod(BigInt("0x" + hex), CURVE.n - 1n) + 1n;

  // Compute public point Q = d * G
  const Q = scalarMultiply(d, CURVE.G);

  return {
    publicKey: {
      x: Q.x.toString(16),
      y: Q.y.toString(16),
      algorithm: "ECC-SCRATCH"
    },
    privateKey: {
      d: d.toString(16),
      algorithm: "ECC-SCRATCH"
    }
  };
}

/**
 * Derives a keystream mask from shared point S = (Sx, Sy) using custom sponge/modular round
 */
function deriveKeystream(Sx, Sy, length) {
  const mask = Buffer.alloc(length);
  let state = mod(Sx * 31n + Sy * 17n + 1337n, CURVE.p);

  for (let i = 0; i < length; i++) {
    // Linear Congruential + Modular rotation from scratch
    state = mod(state * 6364136223846793005n + 1442695040888963407n, CURVE.p);
    mask[i] = Number(state & 0xffn);
  }
  return mask;
}

/**
 * Asymmetric ECC Encryption:
 * 1. Choose ephemeral scalar k in [1, n - 1]
 * 2. Compute C1 = k * G
 * 3. Compute Shared Secret Point S = k * Q_pub
 * 4. Mask message bytes using derived keystream from S
 */
function encrypt(plaintext, publicKey) {
  if (typeof plaintext !== "string") {
    plaintext = JSON.stringify(plaintext);
  }

  const Qpub = {
    x: BigInt("0x" + publicKey.x),
    y: BigInt("0x" + publicKey.y)
  };

  // Generate ephemeral random scalar k
  let hex = "";
  for (let i = 0; i < 64; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  const k = mod(BigInt("0x" + hex), CURVE.n - 1n) + 1n;

  // C1 = k * G
  const C1 = scalarMultiply(k, CURVE.G);

  // Shared Secret Point S = k * Qpub
  const S = scalarMultiply(k, Qpub);
  if (isInfinity(S)) {
    throw new Error("Degenerate ECC shared secret");
  }

  const plainBytes = Buffer.from(plaintext, "utf-8");
  const mask = deriveKeystream(S.x, S.y, plainBytes.length);

  // C2 = Plaintext XOR Mask
  const cipherBytes = Buffer.alloc(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    cipherBytes[i] = plainBytes[i] ^ mask[i];
  }

  return JSON.stringify({
    alg: "ECC-SCRATCH",
    C1: {
      x: C1.x.toString(16),
      y: C1.y.toString(16)
    },
    C2: cipherBytes.toString("hex")
  });
}

/**
 * Asymmetric ECC Decryption:
 * 1. Compute Shared Secret Point S = d_priv * C1
 * 2. Unmask C2 using keystream from S
 */
function decrypt(ciphertextJson, privateKey) {
  const payload = typeof ciphertextJson === "string" ? JSON.parse(ciphertextJson) : ciphertextJson;
  if (!payload || payload.alg !== "ECC-SCRATCH" || !payload.C1 || !payload.C2) {
    throw new Error("Invalid ECC ciphertext format");
  }

  const d = BigInt("0x" + privateKey.d);
  const C1 = {
    x: BigInt("0x" + payload.C1.x),
    y: BigInt("0x" + payload.C1.y)
  };

  // S = d * C1
  const S = scalarMultiply(d, C1);
  if (isInfinity(S)) {
    throw new Error("Degenerate ECC shared secret in decryption");
  }

  const cipherBytes = Buffer.from(payload.C2, "hex");
  const mask = deriveKeystream(S.x, S.y, cipherBytes.length);

  const plainBytes = Buffer.alloc(cipherBytes.length);
  for (let i = 0; i < cipherBytes.length; i++) {
    plainBytes[i] = cipherBytes[i] ^ mask[i];
  }

  return plainBytes.toString("utf-8");
}

module.exports = {
  CURVE,
  mod,
  modInverse,
  pointAdd,
  pointDouble,
  scalarMultiply,
  generateKeyPair,
  encrypt,
  decrypt
};
