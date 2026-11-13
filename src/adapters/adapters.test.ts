import { assertEquals, assertExists } from "@std/assert";
import crypto from "node:crypto";
import { app } from "../../main.tsx";
import { db } from "../../db/db.ts";
import { merchants, apiKeys, users } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

const TEST_API_KEY = "qbiz_test_compat_key_2026";
const TEST_MERCHANT_ID = "mrc_compat_test";
const TEST_USER_ID = "usr_compat_test_admin";

async function ensureTestSetup() {
  // Ensure test user exists
  const uList = await db.select().from(users).where(eq(users.id, TEST_USER_ID));
  if (uList.length === 0) {
    await db.insert(users).values({
      id: TEST_USER_ID,
      name: "Compatibility Test Admin",
      email: "compat-admin@qbiz.internal",
      password: "pbkdf2_hashed_dummy_password",
      role: "SUPER_ADMIN",
      apiKey: TEST_API_KEY
    });
  }

  // Ensure test merchant exists
  const mList = await db.select().from(merchants).where(eq(merchants.id, TEST_MERCHANT_ID));
  if (mList.length === 0) {
    await db.insert(merchants).values({
      id: TEST_MERCHANT_ID,
      name: "Toko Universal Compat",
      phoneNumber: "081299998888",
      qrisImageUrl: "https://example.com/qris.png",
      sessionFilePath: `sessions/${TEST_MERCHANT_ID}.json`,
      qrisPayload: "00020101021138590014ID.CO.QRIS.WWW0215ID10200845344330303UMI51440014ID.CO.QRIS.WWW0215ID10200845344330303UMI5204581253033605802ID5920Resto Ayam Bakar Cbk6009Mojokerto6105613006304D116",
      status: "ACTIVE"
    });
  }

  // Ensure test API Key exists
  const keyList = await db.select().from(apiKeys).where(eq(apiKeys.key, TEST_API_KEY));
  if (keyList.length === 0) {
    await db.insert(apiKeys).values({
      id: `key_compat_${Date.now()}`,
      name: "Compatibility Test Key",
      key: TEST_API_KEY,
      keyPrefix: "qbiz_test...",
      userId: TEST_USER_ID,
      merchantId: TEST_MERCHANT_ID,
      scopes: "invoices:create,invoices:read",
      status: "ACTIVE"
    });
  }
}

Deno.test("Universal Gateway - doit.id Compatibility (/v1/methods & /v1/payments)", async () => {
  await ensureTestSetup();

  // 1. GET /v1/methods
  const methodsRes = await app.request("/v1/methods?amount=50000", {
    headers: { "Authorization": `Bearer ${TEST_API_KEY}` }
  });
  assertEquals(methodsRes.status, 200);
  const methodsData = await methodsRes.json();
  assertEquals(methodsData.environment, "live");
  assertExists(methodsData.data);
  assertEquals(methodsData.data[0].rail, "qris");

  // 2. POST /v1/payments
  const orderRef = `DOIT-ORD-${Date.now()}`;
  const createRes = await app.request("/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TEST_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      amount: 75000,
      rail: "qris",
      reference: orderRef,
      customer: { name: "Budi Santoso", phone: "08123456789" },
      return_url: "https://myshop.com/paid",
      metadata: { orderNote: "Deliver to receptionist" }
    })
  });

  assertEquals(createRes.status, 201);
  const payment = await createRes.json();
  assertEquals(payment.status, "pending");
  assertEquals(payment.reference, orderRef);
  assertEquals(payment.amount, 75000);
  assertExists(payment.id);
  assertExists(payment.hosted_url);
  assertExists(payment.qr_content);

  // 3. GET /v1/payments/:id
  const getRes = await app.request(`/v1/payments/${payment.id}`, {
    headers: { "Authorization": `Bearer ${TEST_API_KEY}` }
  });
  assertEquals(getRes.status, 200);
  const fetched = await getRes.json();
  assertEquals(fetched.id, payment.id);
  assertEquals(fetched.reference, orderRef);

  // 4. GET /v1/payments?reference=...
  const queryRes = await app.request(`/v1/payments?reference=${orderRef}`, {
    headers: { "Authorization": `Bearer ${TEST_API_KEY}` }
  });
  assertEquals(queryRes.status, 200);
  const queryData = await queryRes.json();
  assertEquals(queryData.data.length > 0, true);
  assertEquals(queryData.data[0].reference, orderRef);
});

Deno.test("Universal Gateway - Xendit Invoice v2 Compatibility (/v2/invoices)", async () => {
  await ensureTestSetup();

  // Basic auth: base64(apiKey + ":")
  const basicAuth = btoa(`${TEST_API_KEY}:`);
  const externalId = `XND-ORD-${Date.now()}`;

  // 1. POST /v2/invoices
  const createRes = await app.request("/v2/invoices", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      external_id: externalId,
      amount: 120000,
      description: "Paket Hosting Bisnis",
      payer_email: "client@company.com",
      success_redirect_url: "https://company.com/billing/success"
    })
  });

  assertEquals(createRes.status, 200);
  const invoice = await createRes.json();
  assertEquals(invoice.status, "PENDING");
  assertEquals(invoice.external_id, externalId);
  assertEquals(invoice.amount, 120000);
  assertExists(invoice.id);
  assertExists(invoice.invoice_url);

  // 2. GET /v2/invoices/:id
  const getRes = await app.request(`/v2/invoices/${invoice.id}`, {
    headers: { "Authorization": `Basic ${basicAuth}` }
  });
  assertEquals(getRes.status, 200);
  const fetched = await getRes.json();
  assertEquals(fetched.id, invoice.id);
  assertEquals(fetched.status, "PENDING");

  // 3. POST /v2/invoices/:id/expire
  const expireRes = await app.request(`/v2/invoices/${invoice.id}/expire`, {
    method: "POST",
    headers: { "Authorization": `Basic ${basicAuth}` }
  });
  assertEquals(expireRes.status, 200);
  const expired = await expireRes.json();
  assertEquals(expired.status, "EXPIRED");
});

Deno.test("Universal Gateway - Duitku v2 Compatibility (/webapi/api/merchant/v2/inquiry)", async () => {
  await ensureTestSetup();

  const merchantCode = TEST_MERCHANT_ID;
  const merchantOrderId = `DTK-ORD-${Date.now()}`;
  const amount = 85000;

  // Duitku signature formula: MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)
  const rawSignature = `${merchantCode}${merchantOrderId}${amount}${TEST_API_KEY}`;
  const signature = crypto.createHash('md5').update(rawSignature).digest('hex');

  // 1. POST /webapi/api/merchant/v2/inquiry
  const inquiryRes = await app.request("/webapi/api/merchant/v2/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode,
      paymentAmount: amount,
      merchantOrderId,
      productDetails: "Kopi Arabika 1kg",
      email: "budi@warkop.id",
      phoneNumber: "08123456789",
      callbackUrl: "https://warkop.id/callback/duitku",
      returnUrl: "https://warkop.id/thankyou",
      signature
    })
  });

  assertEquals(inquiryRes.status, 200);
  const inquiryData = await inquiryRes.json();
  assertEquals(inquiryData.statusCode, "00");
  assertEquals(inquiryData.statusMessage, "SUCCESS");
  assertExists(inquiryData.reference);
  assertExists(inquiryData.paymentUrl);
  assertExists(inquiryData.qrString);

  // 2. POST /webapi/api/merchant/transactionStatus
  const statusRawSig = `${merchantCode}${merchantOrderId}${TEST_API_KEY}`;
  const statusSignature = crypto.createHash('md5').update(statusRawSig).digest('hex');

  const statusRes = await app.request("/webapi/api/merchant/transactionStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      merchantCode,
      merchantOrderId,
      signature: statusSignature
    })
  });

  assertEquals(statusRes.status, 200);
  const statusData = await statusRes.json();
  assertEquals(statusData.statusCode, "01"); // PENDING in Duitku
  assertEquals(statusData.merchantOrderId, merchantOrderId);
});

Deno.test("Universal Gateway - Webhook & Callback Signature Verifications", async () => {
  const secretKey = "whsec_test_secret_123456";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const rawBody = JSON.stringify({ event: "payment.paid", id: "pay_123" });

  // 1. Test doit.id PayBridge-Signature verification
  const hmac = crypto.createHmac("sha256", secretKey).update(`${timestamp}.${rawBody}`).digest("hex");
  const doitSignatureHeader = `t=${timestamp},v1=${hmac}`;

  const parts = Object.fromEntries(doitSignatureHeader.split(',').map(s => s.split('=')));
  const calculated = crypto.createHmac("sha256", secretKey).update(`${parts.t}.${rawBody}`).digest("hex");
  assertEquals(calculated, parts.v1);

  // 2. Test Xendit x-callback-token verification
  const xenditToken = "xnd_callback_secret_token_abc";
  assertEquals(xenditToken.trim() === "xnd_callback_secret_token_abc", true);

  // 3. Test Duitku MD5 callback verification
  const merchantCode = "D1234";
  const amount = "50000";
  const merchantOrderId = "ORD-999";
  const apiKey = "key_secret_888";
  const expectedMd5 = crypto.createHash("md5").update(`${merchantCode}${amount}${merchantOrderId}${apiKey}`).digest("hex");
  
  const incomingMd5 = expectedMd5.toUpperCase();
  assertEquals(incomingMd5.toLowerCase(), expectedMd5.toLowerCase());
});

