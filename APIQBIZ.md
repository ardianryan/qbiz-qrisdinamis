# QBiz Developer API & Integration Reference Guide

This document is the official developer reference guide for the QBiz Dynamic QRIS middleware. It is designed to be easily read by developers, IDEs, and AI coding assistants (such as Cursor, GitHub Copilot, or Gemini).

---

## 1. Overview & Authentication

QBiz secures RESTful API endpoints using standard **HTTP Bearer Tokens**. Each user account has a unique API Key that can be generated and rotated in the **Developer Hub** dashboard.

* **Header Format**:
  ```http
  Authorization: Bearer <YOUR_API_KEY>
  Content-Type: application/json
  ```
* **Base URL**: Loaded from the `BASE_URL` environment variable (defaults to `http://localhost:8000`).

---

## 2. API Endpoints Reference

### A. Create Dynamic QRIS Payment (Invoice)
Generates a dynamic QRIS payment with a unique numeric suffix to match bank mutations automatically.

* **Method**: `POST`
* **Path**: `/api/v1/invoices`
* **Headers**:
  * `Authorization: Bearer qbiz_api_key_live_...`
  * `Content-Type: application/json`
* **Request Body (JSON)**:
  | Field | Type | Required | Description |
  | :--- | :--- | :--- | :--- |
  | `amount` | `integer` | Yes | Base nominal charge amount (e.g. `50000` for Rp 50,000). |
  | `order_id` | `string` | Yes | Unique order reference ID from your POS/client system. |
  | `merchant_id` | `string` | Optional | Target merchant ID (defaults to `mrc_toko_1`). Must be associated with your API Key account. |
  | `callback_url` | `string` | Optional | Custom webhook target URL (backend API POST destination) for this invoice. |
  | `redirect_url` | `string` | Optional | Custom redirect URL (frontend browser destination) to return the customer to after checkout success. |
  | `customer_name` | `string` | Optional | Full name of the paying customer (displayed on secure checkout page). |
  | `customer_email` | `string` | Optional | Email address of the paying customer (displayed on secure checkout page). |
  | `customer_phone` | `string` | Optional | Mobile phone number of the paying customer (displayed on secure checkout page). |
  | `items` | `array` | Optional | List of purchase items. Format: `[{"name": string, "quantity": integer, "price": integer}]`. |

* **Request Example**:
  ```json
  {
    "amount": 98000,
    "order_id": "ORD-178592301",
    "merchant_id": "mrc_toko_1",
    "callback_url": "https://mypos.com/api/webhooks/qris",
    "redirect_url": "https://mypos.com/checkout/success",
    "customer_name": "adianadia",
    "customer_phone": "085155030300",
    "customer_email": "adianr94@gmail.com",
    "items": [
      {
        "name": "[Exclusive - 1 Month] - Exclusive - 1 Month",
        "quantity": 1,
        "price": 98000
      }
    ]
  }
  ```

* **Response Example (JSON - HTTP 200 OK)**:
  ```json
  {
    "success": true,
    "invoice": {
      "id": "inv_1785738263024_587",
      "order_id": "ORD-178592301",
      "base_amount": 10000,
      "unique_code": 2,
      "total_amount": 10002,
      "status": "PENDING",
      "qris_payload": "00020101021138590014...",
      "checkout_url": "http://localhost:8000/pay/inv_1785738263024_587",
      "redirect_url": "https://mypos.com/checkout/success"
    }
  }
  ```

> [!IMPORTANT]
> **How to Handle Unique Codes (`total_amount` vs `base_amount`)**:
> 1. **Display `total_amount` to the Customer**: When creating an invoice, QBiz dynamically appends a unique 3-digit suffix (e.g. `2`) to the requested base amount to prevent payment collisions. **You MUST display the `total_amount` (e.g., Rp 10,002) in your client application** and clearly instruct the customer to pay the exact amount. Do NOT display the `base_amount` (e.g., Rp 10,000) to the buyer.
> 2. **Pre-configured QRIS Payload**: The returned `qris_payload` string is already pre-configured with the exact `total_amount` inside the EMVCo structure. If the customer scans the QR code directly, their e-wallet app will automatically load the correct `total_amount` (e.g., Rp 10,002) without manual input.
> 3. **Collision Prevention**: QBiz guarantees that no two pending invoices for the same merchant will ever share the exact same `total_amount`. This ensures that when a bank/e-wallet mutation is intercepted, it maps to exactly one pending transaction, avoiding double matching or collision errors.

---

### B. View Secure Checkout Page (Redirect Method)
QBiz-hosted checkout page displaying the dynamic QRIS code alongside a **5-minute** transaction expiry countdown.

* **Method**: `GET`
* **Path**: `/pay/:id`
* **Params**: `:id` = Invoice ID (e.g. `inv_1785738263024_587`)
* **Behavior**:
  * Returns a responsive, mobile-friendly HTML interface.
  * Polls transaction status automatically. If payment is detected in GoBiz, redirects to the success screen instantly.

---

## 3. Webhooks & Callbacks

Once the payment is completed, QBiz dispatches an HTTP `POST` webhook to your configured webhook endpoint.

### A. Webhook Request Payload
* **Method**: `POST`
* **Headers**:
  * `Content-Type: application/json`
  * `X-QBiz-Signature`: HMAC-SHA256 signature to verify request authenticity.
  * `Referer`: `http://localhost:8000` (or your configured `BASE_URL`).
  * `Origin`: `http://localhost:8000`.
* **JSON Body**:
  ```json
  {
    "event": "payment.success",
    "invoice_id": "inv_1785738263024_587",
    "order_id": "ORD-178592301",
    "amount_paid": 10002,
    "paid_at": "2026-08-03T17:04:13.000Z"
  }
  ```

### B. Signature Verification (Security Best Practice)
To prevent webhook spoofing, verify the `X-QBiz-Signature` header using the **HMAC-SHA256** algorithm with your `webhook_secret`.

1. Grab the raw request body string.
2. Hash the raw body using your user-level `webhook_secret` with HMAC-SHA256.
3. Encode the hash as a hexadecimal string.
4. Compare it securely with the value of the `X-QBiz-Signature` header.

---

## 4. Official client SDKs

All official SDK clients are hosted in the git repository:

### A. Node.js / JavaScript SDK
Use the Node.js client file [`sdk/qbiz-node.js`](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz-node.js) inside your backend script:

```javascript
import QBiz from './sdk/qbiz-node.js';

const qbiz = new QBiz({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'http://localhost:8000' // optional
});

// 1. Create a payment invoice
try {
  const result = await qbiz.createInvoice({
    amount: 15000,
    orderId: 'ORDER-9921',
    merchantId: 'mrc_toko_1'
  });
  console.log("QRIS Payload:", result.invoice.qris_payload);
  console.log("Checkout URL:", result.invoice.checkout_url);
} catch (err) {
  console.error("Failed creating invoice:", err.message);
}

// 2. Verify incoming webhook signature in your express/hono controller
const isVerified = qbiz.verifyWebhook(
  rawRequestBodyString,
  req.headers['x-qbiz-signature'],
  'YOUR_WEBHOOK_SECRET'
);
if (isVerified) {
  // Signature is valid. Update your POS order status to PAID safely.
}
```

### B. PHP SDK
Use the PHP client library [`sdk/qbiz.php`](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.php) in your Laravel, CodeIgniter, or native PHP project:

```php
require_once __DIR__ . '/sdk/qbiz.php';

$qbiz = new QBiz('YOUR_API_KEY', 'http://localhost:8000');

// 1. Create QRIS invoice
$response = $qbiz->createInvoice(25000, 'ORDER-PHP-1002', 'mrc_toko_1');
if ($response && isset($response['invoice'])) {
    $qrisPayload = $response['invoice']['qris_payload'];
    $checkoutUrl = $response['invoice']['checkout_url'];
}

// 2. Verify webhook signature
$rawBody = file_get_contents('php://input');
$headers = getallheaders();
$signature = isset($headers['X-QBiz-Signature']) ? $headers['X-QBiz-Signature'] : '';

$isVerified = $qbiz->verifyWebhook($rawBody, $signature, 'YOUR_WEBHOOK_SECRET');
if ($isVerified) {
    // Signature verified. Process success status.
    http_response_code(200);
    echo json_encode(["status" => "ok"]);
} else {
    http_response_code(400);
    echo "Invalid Signature";
}
```

---

## 5. AI Instructions (System Prompt Guide)
*Copy this instruction block into your AI tool (Cursor/Gemini/Copilot) context to build client integration:*

```text
AI assistant: I am using the QBiz QRIS middleware system documented in APIQBIZ.md.
Please generate integration code to:
1. Trigger payment invoices upon customer selection of QRIS at checkout.
2. Setup a secure Webhook endpoint verifying the X-QBiz-Signature using HMAC-SHA256 and the local user webhook secret.
Rely on the SDK and API reference patterns shown in https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/APIQBIZ.md.
```
