import { assertEquals, assertExists } from "jsr:@std/assert";
import { AVAILABLE_SCOPES, verifyApiKeyAndScope, createApiKey, revokeApiKey } from "./api-keys.ts";
import { UserSession } from "../middleware/auth.ts";

Deno.test("API Keys Service - AVAILABLE_SCOPES should have standard 5 granular permissions", () => {
  assertEquals(AVAILABLE_SCOPES.length >= 5, true);
  const ids = AVAILABLE_SCOPES.map(s => s.id);
  assertEquals(ids.includes('invoices:create'), true);
  assertEquals(ids.includes('invoices:read'), true);
  assertEquals(ids.includes('transactions:read'), true);
  assertEquals(ids.includes('merchants:read'), true);
  assertEquals(ids.includes('webhooks:manage'), true);
});

Deno.test("API Keys Service - verifyApiKeyAndScope should reject empty token", async () => {
  const result = await verifyApiKeyAndScope("");
  assertEquals(result.isValid, false);
  assertEquals(result.error?.includes('missing'), true);
});

Deno.test("API Keys Service - verifyApiKeyAndScope should reject invalid random key", async () => {
  const result = await verifyApiKeyAndScope("qbiz_live_fakeinvalidtoken123456789");
  assertEquals(result.isValid, false);
});

Deno.test("API Keys Service - createApiKey should reject invalid name or empty scopes", async () => {
  const res1 = await createApiKey({ name: "ab", userId: "usr_1", scopes: ["invoices:create"] });
  assertEquals(res1.success, false);

  const res2 = await createApiKey({ name: "Valid Name", userId: "usr_1", scopes: [] });
  assertEquals(res2.success, false);
});

