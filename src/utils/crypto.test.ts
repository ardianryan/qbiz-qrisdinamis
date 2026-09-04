import { assertEquals } from "@std/assert";
import { encryptSession, decryptSession } from "./crypto.ts";

Deno.test("Session Encryption & Decryption - should securely encrypt and decrypt Puppeteer cookie JSON string", async () => {
  const originalCookies = [
    {
      name: "access_token",
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      domain: "gobiz.co.id",
      path: "/",
      expires: Date.now() + 100000,
      size: 50,
      httpOnly: true,
      secure: true,
      session: false,
    }
  ];

  const jsonText = JSON.stringify(originalCookies);
  
  // Encrypt the JSON text
  const ciphertext = await encryptSession(jsonText);
  
  // Verify it is not plain text
  assertEquals(ciphertext.includes("access_token"), false);
  
  // Decrypt
  const decryptedText = await decryptSession(ciphertext);
  
  // Parse back to array
  const decryptedCookies = JSON.parse(decryptedText);
  
  // Assert match
  assertEquals(decryptedCookies.length, 1);
  assertEquals(decryptedCookies[0].name, "access_token");
  assertEquals(decryptedCookies[0].value, originalCookies[0].value);
});

Deno.test("Password Cryptography - should hash with PBKDF2 (100,000 iterations) and verify correctly", async () => {
  const { hashPassword, verifyPassword } = await import("../middleware/auth.ts");
  const rawPassword = "SuperSecurePassword2026!";

  // 1. Generate modern PBKDF2 hash
  const hash = await hashPassword(rawPassword);
  assertEquals(hash.startsWith("pbkdf2$100000$"), true);

  // 2. Verify with valid password
  const isValid = await verifyPassword(rawPassword, hash);
  assertEquals(isValid, true);

  // 3. Verify with invalid password
  const isInvalid = await verifyPassword("WrongPassword123", hash);
  assertEquals(isInvalid, false);

  // 4. Verify legacy single-round SHA-256 backwards compatibility
  const legacyEncoder = new TextEncoder();
  const legacyData = legacyEncoder.encode("LegacyPass2026" + "qbiz_password_salt_2026");
  const legacyHashBuf = await crypto.subtle.digest("SHA-256", legacyData);
  const legacyHashHex = Array.from(new Uint8Array(legacyHashBuf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const isLegacyValid = await verifyPassword("LegacyPass2026", legacyHashHex);
  assertEquals(isLegacyValid, true);

  const isLegacyWrong = await verifyPassword("WrongPass", legacyHashHex);
  assertEquals(isLegacyWrong, false);
});

Deno.test("Environment Secret Hardening - validateSecret should reject insecure default placeholders in production", async () => {
  const { validateSecret } = await import("../middleware/auth.ts");

  // 1. Should accept strong random secrets
  const validCheck = validateSecret("COOKIE_SECRET", "a1b2c3d4e5f67890123456789abcdef0", true);
  assertEquals(validCheck.isValid, true);

  // 2. Should reject missing secrets in production
  const missingCheck = validateSecret("COOKIE_SECRET", "", true);
  assertEquals(missingCheck.isValid, false);

  // 3. Should reject short secrets (< 16 chars) in production
  const shortCheck = validateSecret("COOKIE_SECRET", "short_secret", true);
  assertEquals(shortCheck.isValid, false);

  // 4. Should reject known template placeholder strings in production
  const placeholderCheck1 = validateSecret("COOKIE_SECRET", "qbiz_cookie_signing_secret_key_2026", true);
  assertEquals(placeholderCheck1.isValid, false);

  const placeholderCheck2 = validateSecret("COOKIE_SECRET", "change_me_to_a_secure_random_cookie_secret_key_2026", true);
  assertEquals(placeholderCheck2.isValid, false);

  const placeholderCheck3 = validateSecret("JWT_SECRET", "qbiz_jwt_secret_key_2026", true);
  assertEquals(placeholderCheck3.isValid, false);
});
