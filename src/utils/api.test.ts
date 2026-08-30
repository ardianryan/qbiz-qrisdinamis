import { assertEquals, assertStringIncludes, assertExists } from "@std/assert";
import { db } from "../../db/db.ts";
import { merchants, invoices } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { app } from "../../main.tsx";

const API_KEY = "qbiz_api_key_live_2026_w8a2b3d9x7c"; // Super Admin API Key

Deno.test("API - GET /login should return login page", async () => {
  const res = await app.request("/login");
  assertEquals(res.status, 200);
  const text = await res.text();
  assertStringIncludes(text, "Access the Gateway");
});

Deno.test("API - POST /api/v1/invoices should reject unauthorized requests", async () => {
  const res = await app.request("/api/v1/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      order_id: "TEST-ORD-UNAUTH",
      amount: 10000,
      merchant_id: "mrc_dummy"
    })
  });
  assertEquals(res.status, 401);
  const json = await res.json();
  assertEquals(json.error, "Unauthorized");
});

Deno.test("API - POST /api/v1/invoices and GET /pay/:id integration test", async () => {
  // 1. Fetch or create a test merchant in database to bind the invoice
  let merchantId = "mrc_test_integration";
  const existingMerchant = await db.select().from(merchants).where(eq(merchants.id, merchantId));
  
  if (existingMerchant.length === 0) {
    await db.insert(merchants).values({
      id: merchantId,
      name: "Test Integration Merchant",
      phoneNumber: "08123456789",
      qrisImageUrl: "/static/uploads/test.png",
      qrisPayload: "00020101021151240016ID.CO.QRIS.WWW020412346304ABCD",
      logoUrl: "/static/uploads/logo_test.png",
      sessionFilePath: "sessions/mrc_test_integration.json",
      status: "ACTIVE"
    });
  }

  // 2. Send API request to create invoice with customer profile and purchase items details
  const orderId = `ORD-INT-${Date.now()}`;
  const res = await app.request("/api/v1/invoices", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      order_id: orderId,
      amount: 45000,
      customer_name: "Test Customer",
      customer_email: "test@qbiz.com",
      customer_phone: "081122334455",
      merchant_id: merchantId,
      items: [
        { name: "Coffee Late", quantity: 2, price: 20000 },
        { name: "Donut Glaze", quantity: 1, price: 5000 }
      ]
    })
  });

  assertEquals(res.status, 200);
  const data = await res.json();
  assertExists(data.invoice.id);
  assertExists(data.invoice.checkout_url);
  assertExists(data.invoice.unique_code);

  const invoiceId = data.invoice.id;

  // 3. Verify public secure pay view returns 200 OK without redirecting to login page
  const payRes = await app.request(`/pay/${invoiceId}`);
  assertEquals(payRes.status, 200);
  const payHtml = await payRes.text();
  assertStringIncludes(payHtml, "Test Integration Merchant"); // Should dynamically display merchant name in header
  assertStringIncludes(payHtml, "Coffee Late"); // Should display purchase items details list
  assertStringIncludes(payHtml, "Donut Glaze");
  assertStringIncludes(payHtml, "081122334455"); // Should display customer phone number
  assertStringIncludes(payHtml, "QRIS Food Merchant"); // Should show the brand label

  // 4. Verify polling status endpoint returns correct status details
  const statusRes = await app.request(`/api/v1/invoices/${invoiceId}/status`);
  assertEquals(statusRes.status, 200);
  const statusJson = await statusRes.json();
  assertEquals(statusJson.status, "PENDING");

  // Cleanup: delete the created test invoice and merchant
  await db.delete(invoices).where(eq(invoices.id, invoiceId));
  await db.delete(merchants).where(eq(merchants.id, merchantId));
});

Deno.test("Security Headers - should send standard protective security headers on all responses", async () => {
  const res = await app.request("/login");
  assertEquals(res.headers.get("x-content-type-options"), "nosniff");
  assertEquals(res.headers.get("x-frame-options"), "SAMEORIGIN");
  assertEquals(res.headers.get("x-xss-protection"), "1; mode=block");
  assertEquals(res.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assertEquals(res.headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=()");
});

Deno.test("Payload Size Limiter - should reject oversized request payloads", async () => {
  const res = await app.request("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": (2 * 1024 * 1024).toString() // 2MB
    },
    body: JSON.stringify({ email: "test@test.com", password: "123" })
  });
  assertEquals(res.status, 413);
  const json = await res.json();
  assertStringIncludes(json.error, "Payload too large");
});

Deno.test("Workspace Switcher - should reject unauthorized workspace switch", async () => {
  const res = await app.request("/api/v1/workspaces/switch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ merchantId: "mrc_test" })
  });
  assertEquals(res.status, 401);
});

Deno.test("Notification Test API - should validate invalid channel", async () => {
  const res = await app.request("/api/v1/merchants/mrc_test/notifications/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel: "invalid_channel", config: {} })
  });
  // Unauthenticated returns 401/403
  assertEquals(res.status === 401 || res.status === 403, true);
});


