import { assertEquals, assertStringIncludes, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { db } from "../../db/db.ts";
import { merchants, invoices } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:8000";
const API_KEY = "qbiz_api_key_live_2026_w8a2b3d9x7c"; // Super Admin API Key

Deno.test("API - GET /login should return login page", async () => {
  const res = await fetch(`${BASE_URL}/login`);
  assertEquals(res.status, 200);
  const text = await res.text();
  assertStringIncludes(text, "Access the Gateway");
});

Deno.test("API - POST /api/v1/invoices should reject unauthorized requests", async () => {
  const res = await fetch(`${BASE_URL}/api/v1/invoices`, {
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
  const res = await fetch(`${BASE_URL}/api/v1/invoices`, {
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
  const payRes = await fetch(`${BASE_URL}/pay/${invoiceId}`);
  assertEquals(payRes.status, 200);
  const payHtml = await payRes.text();
  assertStringIncludes(payHtml, "Test Integration Merchant"); // Should dynamically display merchant name in header
  assertStringIncludes(payHtml, "Coffee Late"); // Should display purchase items details list
  assertStringIncludes(payHtml, "Donut Glaze");
  assertStringIncludes(payHtml, "081122334455"); // Should display customer phone number
  assertStringIncludes(payHtml, "QRIS by Gopay Merchant"); // Should show the Gopay Merchant label

  // 4. Verify polling status endpoint returns correct status details
  const statusRes = await fetch(`${BASE_URL}/api/v1/invoices/${invoiceId}/status`);
  assertEquals(statusRes.status, 200);
  const statusJson = await statusRes.json();
  assertEquals(statusJson.status, "PENDING");

  // Cleanup: delete the created test invoice and merchant
  await db.delete(invoices).where(eq(invoices.id, invoiceId));
  await db.delete(merchants).where(eq(merchants.id, merchantId));
});
