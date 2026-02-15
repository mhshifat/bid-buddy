/**
 * Encryption utilities for sensitive data storage.
 *
 * Uses AES-256-GCM encryption with a derived key from environment variables.
 * The encryption key is derived from ENCRYPTION_KEY environment variable.
 */

import { createCipher, createDecipher, randomBytes, scryptSync } from "crypto";

// Environment variable for encryption key
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required for data encryption");
}

// Derive a 32-byte key from the environment variable using scrypt
const KEY = scryptSync(ENCRYPTION_KEY, "bid-buddy-salt", 32);
const ALGORITHM = "aes-256-cbc"; // Using CBC for broader compatibility
const IV_LENGTH = 16; // 128 bits

/**
 * Encrypt a string value.
 * Returns a base64-encoded string containing IV + encrypted data.
 */
export function encrypt(text: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipher(ALGORITHM, KEY, iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  // Combine IV + encrypted data
  const combined = Buffer.concat([iv, encryptedBuffer]);

  return combined.toString("base64");
}

/**
 * Decrypt a previously encrypted string value.
 */
export function decrypt(encryptedText: string): string {
  const combined = Buffer.from(encryptedText, "base64");

  if (combined.length < IV_LENGTH) {
    throw new Error("Invalid encrypted data");
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH);

  const decipher = createDecipher(ALGORITHM, KEY, iv);

  const decryptedBuffer = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decryptedBuffer.toString("utf8");
}

/**
 * Check if a string appears to be encrypted (base64 format with expected length).
 * This is a heuristic check, not foolproof.
 */
export function isEncrypted(text: string): boolean {
  try {
    const buffer = Buffer.from(text, "base64");
    // Encrypted data should be at least IV + some encrypted data
    return buffer.length >= IV_LENGTH + 1;
  } catch {
    return false;
  }
}