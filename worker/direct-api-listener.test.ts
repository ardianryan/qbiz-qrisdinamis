import { assertEquals } from "@std/assert";
import { saveDirectTokenSession, loadDirectTokenSession } from "./direct-api-listener.ts";
import { getActiveWorkerCount } from "./listener-router.ts";

Deno.test("Direct API Listener - encrypted token session save and load round-trip", async () => {
  const testMerchantId = "mrc_direct_test_001";
  const sampleSession = {
    accessToken: "gobiz_access_sample_token_12345",
    refreshToken: "gobiz_refresh_sample_token_67890",
    expiresAt: Date.now() + 3600_000,
    obtainedAt: Date.now(),
    phoneNumber: "+6281234567890",
    deviceId: "018f67c5-5555-7777-8888-99990000aaaa",
  };

  try {
    await saveDirectTokenSession(testMerchantId, sampleSession);

    // Ensure raw file on disk is AES-256-GCM encrypted (does not leak plaintext token)
    const rawDisk = await Deno.readTextFile(`sessions/${testMerchantId}.token.json`);
    assertEquals(rawDisk.includes("gobiz_access_sample_token_12345"), false);

    const loaded = await loadDirectTokenSession(testMerchantId);
    assertEquals(loaded?.accessToken, sampleSession.accessToken);
    assertEquals(loaded?.refreshToken, sampleSession.refreshToken);
    assertEquals(loaded?.phoneNumber, sampleSession.phoneNumber);
    assertEquals(loaded?.deviceId, sampleSession.deviceId);
  } finally {
    await Deno.remove(`sessions/${testMerchantId}.token.json`).catch(() => {});
  }
});

Deno.test("Listener Router - getActiveWorkerCount returns numeric count", () => {
  const count = getActiveWorkerCount();
  assertEquals(typeof count, "number");
  assertEquals(count >= 0, true);
});
