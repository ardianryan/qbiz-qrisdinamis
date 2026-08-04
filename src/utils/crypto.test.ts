import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
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
