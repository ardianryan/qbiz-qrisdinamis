# 🛠️ BACKEND ARCHITECTURE & SYSTEM PLAN
**Project:** QBiz Multi-QRIS Payment Gateway Engine  
**Stack:** Hono.js (Deno Runtime) + Puppeteer + PostgreSQL/Drizzle ORM

---

## 1. ARCHITECTURAL OVERVIEW

The system operates as an **In-House Dynamic QRIS Payment Middleware**. It bridges external Point-of-Sale (POS) systems with GoBiz Merchant Web Portals without relying on paid third-party payment gateways like Midtrans.

```
+-------------------+             +---------------------------------------+
|  External POS     |  HTTP REST  |             HONO.JS SERVER            |
|  / Client System  | ----------> |                                       |
|                   |             |  [ API Router ]  [ Postgres Database ]|
+-------------------+             |         |                 ^           |
^                       |         v                 |           |
| Webhook Callback      |  [ Listener Service ] ----+           |
+---------------------- |         |                             |
                        +---------|-----------------------------+
                                  | Headless Browser (Session Auth)
                                  v
                        +---------------------------------------+
                        | GoBiz Merchant Web Portal             |
                        | (portal.gofoodmerchant.co.id)         |
                        +---------------------------------------+
```

---

## 2. DATABASE SCHEMA (Drizzle ORM / PostgreSQL)

Using Drizzle ORM mapping to a local/remote PostgreSQL instance (`qrispaymti` database) with credentials:
- Username: `ardianryan`
- Password: `M0jokerto1`

```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// 1. Merchant Accounts Table
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  qrisImageUrl: text('qris_image_url').notNull(),
  sessionFilePath: text('session_file_path').notNull(),
  status: text('status').$type<'ACTIVE' | 'NEEDS_OTP' | 'DISCONNECTED'>().default('NEEDS_OTP').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Invoices / Charges Table
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }),
  orderId: text('order_id').notNull(),
  baseAmount: integer('base_amount').notNull(),
  uniqueCode: integer('unique_code').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').$type<'PENDING' | 'PAID' | 'EXPIRED'>().default('PENDING').notNull(),
  callbackUrl: text('callback_url'),
  expiredAt: timestamp('expired_at', { withTimezone: true }).notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 3. Incoming Mutations Log
export const mutations = pgTable('mutations', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').references(() => merchants.id, { onDelete: 'set null' }),
  rawAmount: integer('raw_amount').notNull(),
  transactionTime: text('transaction_time').notNull(),
  isMatched: boolean('is_matched').default(false).notNull(),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

---

## 3. PUPPETEER LISTENER WORKER ARCHITECTURE

The background listener operates independently alongside the Hono server.

### 3.1 Network Interception Strategy

Rather than parsing HTML/DOM trees (which frequently break on UI updates), Puppeteer intercepts internal XHR/Fetch API responses sent by the GoBiz web application:

```typescript
// worker/puppeteer-listener.ts
import puppeteer from 'puppeteer';

export async function startMerchantListener(merchant: any) {
  // Launch Chromium using Deno's Puppeteer interface
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();

  // Load existing cookies/session if file exists
  try {
    const sessionData = await Deno.readTextFile(merchant.sessionFilePath);
    const cookies = JSON.parse(sessionData);
    await page.setCookie(...cookies);
  } catch (err) {
    console.log(`[Worker ${merchant.id}] No session file found or error loading session.`);
  }

  // Network Interception for Mutation Feed
  page.on('response', async (response) => {
    if (response.url().includes('/v1/transactions') && response.status() === 200) {
      try {
        const payload = await response.json();
        await processIncomingMutations(merchant.id, payload.data);
      } catch (e) {
        // Handle non-json payloads gracefully
      }
    }
  });

  await page.goto('https://portal.gofoodmerchant.co.id/', { waitUntil: 'networkidle2' });

  // Session Expiration Handling
  if (page.url().includes('/login')) {
    await updateMerchantStatus(merchant.id, 'NEEDS_OTP');
    await browser.close();
    return;
  }

  // Polling loop: Refresh page every 12 seconds to trigger internal XHR
  setInterval(async () => {
    try {
      await page.reload({ waitUntil: 'networkidle2' });
    } catch (err) {
      console.error(`[Worker ${merchant.id}] Refresh error:`, err);
    }
  }, 12000);
}
```

---

## 4. UNIQUE CODE GENERATOR ALGORITHM

To differentiate payments made via the static QRIS image, the system calculates a unique 3-digit suffix (001 - 999):

1. **Request:** Client requests invoice for Rp 50.000 on Merchant X.
2. **Lookup Active Invoices:** Query DB for `PENDING` invoices on Merchant X with base amount `50000`.
3. **Calculate Suffix:** Find the smallest available integer `N` (1..999) that is NOT currently allocated to a pending invoice of the same base amount.
4. **Result:** Total payable amount becomes `50000 + N` (e.g., `Rp 50.001`).
5. **Expiration Worker:** Every 60 seconds, expire invoices where `expiredAt < NOW()`, freeing up unique codes for reuse.

---

## 5. WEBHOOK DISPATCH & RETRY LOGIC

When `processIncomingMutations` finds an invoice matching `totalAmount` where `status === 'PENDING'`:

1. Update invoice status to `PAID` and set `paidAt = NOW()`.
2. Trigger HTTP POST request to `invoice.callbackUrl`:
```json
{
  "event": "payment.success",
  "invoice_id": "inv_10923840",
  "order_id": "ORDER-001",
  "amount_paid": 50123,
  "paid_at": "2026-08-03T10:28:15Z",
  "signature": "hmac_sha256_hash"
}
```
3. If the destination returns non-2xx HTTP code, retry up to 3 times with exponential backoff (5s, 15s, 45s).

---

## 6. REST API ENDPOINTS SPECIFICATION

* `POST /api/v1/invoices` - Create dynamic charge
* `GET /api/v1/invoices/:id` - Fetch invoice status (Polling)
* `GET /api/v1/merchants` - List connected QRIS accounts
* `POST /api/v1/merchants/:id/otp/request` - Trigger GoBiz WhatsApp OTP
* `POST /api/v1/merchants/:id/otp/verify` - Submit OTP & save session JSON
