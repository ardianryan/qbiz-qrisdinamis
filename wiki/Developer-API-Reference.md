# Developer & REST API Reference 💻

The QBiz Gateway Hub exposes RESTful endpoints for invoice generation, payment status queries, merchant store discovery, and webhook management.

---

## 🔑 Authentication
Include your Bearer API Key in the `Authorization` HTTP header:
```http
Authorization: Bearer qbiz_api_key_live_...
```

---

## 1. Create Dynamic QRIS Invoice
* **Endpoint**: `POST /api/v1/invoices`
* **Required Scope**: `invoices:create`

### Request Body:
```json
{
  "order_id": "ORDER-100239",
  "amount": 50000,
  "merchant_id": "mrc_toko_cabang_1",
  "customer_name": "John Doe",
  "customer_phone": "081234567890",
  "customer_email": "john@example.com",
  "callback_url": "https://yourpos.com/api/webhooks/qris"
}
```

### Response (`201 Created`):
```json
{
  "success": true,
  "invoice": {
    "id": "inv_12023942",
    "order_id": "ORDER-100239",
    "base_amount": 50000,
    "unique_code": 123,
    "total_amount": 50123,
    "status": "PENDING",
    "qris_payload": "00020101021226590014...",
    "checkout_url": "https://qris.yourdomain.com/pay/inv_12023942",
    "expires_at": "2026-08-30T16:05:00.000Z"
  }
}
```

---

## 2. Check Invoice Status
* **Endpoint**: `GET /api/v1/invoices/:id`
* **Required Scope**: `invoices:read`

### Response (`200 OK`):
```json
{
  "success": true,
  "invoice": {
    "id": "inv_12023942",
    "order_id": "ORDER-100239",
    "total_amount": 50123,
    "status": "PAID",
    "paid_at": "2026-08-30T15:52:10.000Z",
    "settlement_ref": "REF-9920194"
  }
}
```

---

## 3. List Accessible Merchants
* **Endpoint**: `GET /api/v1/merchants`
* **Required Scope**: `merchants:read`

---

## ⚡ Outbound Webhooks & HMAC Verification

When a payment succeeds, QBiz dispatches a POST request to your registered webhook URL:

### HTTP Headers:
```http
Content-Type: application/json
X-QBiz-Signature: sha256_hex_signature
X-QBiz-Timestamp: 1788078000
```

### Webhook Payload:
```json
{
  "event": "payment.success",
  "timestamp": "2026-08-30T15:52:10.000Z",
  "data": {
    "id": "inv_12023942",
    "order_id": "ORDER-100239",
    "merchant_id": "mrc_toko_cabang_1",
    "base_amount": 50000,
    "unique_code": 123,
    "total_amount": 50123,
    "status": "PAID",
    "paid_at": "2026-08-30T15:52:10.000Z",
    "customer_name": "John Doe"
  }
}
```

### Verifying Signatures in Node.js / TypeScript:
```typescript
import crypto from 'crypto';

function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const expected = hmac.update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```
