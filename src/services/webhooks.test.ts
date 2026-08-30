import { assertEquals, assertRejects } from "jsr:@std/assert";
import { 
  AVAILABLE_WEBHOOK_EVENTS, 
  generateWebhookSecret, 
  signWebhookPayload,
  createWebhookEndpoint 
} from "./webhooks.ts";

Deno.test("Webhooks Service - should have 3 standard events", () => {
  assertEquals(AVAILABLE_WEBHOOK_EVENTS.length, 3);
  assertEquals(AVAILABLE_WEBHOOK_EVENTS.includes('payment.success'), true);
  assertEquals(AVAILABLE_WEBHOOK_EVENTS.includes('invoice.created'), true);
  assertEquals(AVAILABLE_WEBHOOK_EVENTS.includes('invoice.expired'), true);
});

Deno.test("Webhooks Service - generateWebhookSecret should produce prefix and 48 hex chars", () => {
  const secret = generateWebhookSecret();
  assertEquals(secret.startsWith('whsec_'), true);
  assertEquals(secret.length, 6 + 48);
});

Deno.test("Webhooks Service - signWebhookPayload should generate valid HMAC-SHA256 signature", async () => {
  const secret = "test_secret_123";
  const payload = { event: "payment.success", amount: 50000 };
  const sig = await signWebhookPayload(payload, secret);
  assertEquals(typeof sig, "string");
  assertEquals(sig.length, 64); // 32-byte SHA256 hex string
});

Deno.test("Webhooks Service - createWebhookEndpoint should reject invalid URL or SSRF target", async () => {
  await assertRejects(
    () => createWebhookEndpoint({
      name: "Bad Webhook",
      url: "http://169.254.169.254/latest/meta-data",
      userId: "usr_superadmin",
      userRole: "SUPER_ADMIN",
      events: ["payment.success"]
    }),
    Error,
    "Invalid webhook target URL"
  );
});

Deno.test("Webhooks Service - createWebhookEndpoint should reject invalid events", async () => {
  await assertRejects(
    () => createWebhookEndpoint({
      name: "Bad Event",
      url: "https://example.com/webhook",
      userId: "usr_superadmin",
      userRole: "SUPER_ADMIN",
      events: ["invalid.event" as any]
    }),
    Error,
    "Invalid event"
  );
});
