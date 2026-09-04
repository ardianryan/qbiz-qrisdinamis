import { COOKIE_SECRET } from '../middleware/auth.ts';

const ENCRYPTION_KEY_RAW = COOKIE_SECRET;

/**
 * Derive 256-bit AES key using Web Crypto PBKDF2 for encryption at rest
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY_RAW),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  
  // Fixed salt for consistent key derivation across restarts
  const salt = encoder.encode("qbiz_session_encryption_salt_2026");
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plain text using AES-256-GCM and return a Base64 string
 */
export async function encryptSession(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await getCryptoKey();
  
  // Generate random 12-byte initialization vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );
  
  // Package IV and ciphertext together
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // Encode as Base64 for file storage compatibility
  const binaryString = Array.from(combined).map(b => String.fromCharCode(b)).join('');
  return btoa(binaryString);
}

/**
 * Decrypt AES-256-GCM Base64 string back to original plain text
 */
export async function decryptSession(encryptedBase64: string): Promise<string> {
  const key = await getCryptoKey();
  const decoder = new TextDecoder();
  
  // Decode from Base64
  const binaryString = atob(encryptedBase64);
  const combined = new Uint8Array(binaryString.split('').map(char => char.charCodeAt(0)));
  
  if (combined.length < 12) {
    throw new Error("Invalid cipher text length");
  }
  
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return decoder.decode(decrypted);
}
