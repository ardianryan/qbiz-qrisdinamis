# 🔌 Panduan Koneksi Pembayaran QRIS (QBiz Native & Mode Kompatibilitas doit.id)

Panduan ini menjelaskan langkah demi langkah cara menghubungkan aplikasi, toko online, atau sistem kasir (POS) Anda ke **QBiz** untuk menerima pembayaran QRIS dinamis — baik menggunakan **API Native QBiz** maupun **Mode Kompatibilitas `doit.id`** (cukup ganti URL server tanpa ubah kode integrasi `doit.id` Anda!).

---

## 📋 1. Persiapan Awal di Dashboard QBiz

Sebelum mengirim request API pertama Anda, pastikan 3 hal ini sudah siap di Dashboard QBiz:

1. **Merchant & QRIS Statis Terhubung**
   - Masuk ke Dashboard QBiz (`/merchants`).
   - Tambahkan atau pilih merchant Anda, pastikan **QRIS Static String** sudah terisi dan status listener **🟢 Active** (atau aktifkan `SANDBOX_MODE=true` di `.env` jika masih tahap uji coba).
2. **Dapatkan API Key**
   - Buka menu **Developer (`/developer`)**.
   - Buat atau salin **API Key** untuk merchant Anda (misalnya `qbiz_live_...` atau `qbiz_test_...`).
   - Simpan kunci ini dengan aman di `.env` aplikasi Anda (jangan pernah taruh di frontend/browser).
3. **Siapkan Endpoint Webhook (Opsional tapi Disarankan)**
   - Siapkan URL publik di backend aplikasi Anda (misalnya `https://tokoanda.com/api/webhook/qris`) untuk menerima notifikasi otomatis saat pembeli selesai membayar.
   - Salin **Webhook Secret** dari dashboard untuk memverifikasi keaslian notifikasi yang masuk.

---

## 🔄 2. Bagaimana Alur Pembayarannya Bekerja?

```text
[Aplikasi / POS Anda]
   │  1. Request buat tagihan (API Native QBiz / API doit.id / Xendit / Duitku)
   ▼
[QBiz Gateway Server]
   │  2. Generate QRIS Dinamis (+ kode unik Rp 1–999) & link halaman bayar (/pay/inv_xxx)
   ▼
[Pembeli Scan QRIS & Bayar]
   │  3. Pembeli scan QR di GoPay / OVO / DANA / BCA / Mobile Banking
   ▼
[QBiz Worker]
   │  4. Deteksi mutasi masuk secara real-time -> ubah status jadi PAID
   ▼
[Webhook ke Aplikasi Anda]
   └─ 5. QBiz otomatis mengirim notifikasi PAID sesuai format API yang Anda pakai!
```

> [!TIP]
> **Smart Callback Router:** Jika Anda membuat tagihan lewat endpoint `doit.id`, QBiz otomatis membalas webhook dengan format `doit.id` (`payment.paid` + header `PayBridge-Signature`). Jika lewat API Native QBiz, QBiz membalas dengan format native QBiz (`X-QBiz-Signature`).

---

## ⚡ 3. Cara A: Koneksi Pakai API Native QBiz

Gunakan cara ini jika Anda membangun integrasi baru dari nol khusus untuk QBiz.

### Langkah 1: Buat Tagihan QRIS (`POST /api/v1/invoices`)

```bash
curl -X POST https://qbiz-server-anda.com/api/v1/invoices \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "mrc_xxx",
    "order_id": "INV-2026-001",
    "amount": 50000,
    "callback_url": "https://tokoanda.com/webhook/qris",
    "redirect_url": "https://tokoanda.com/terima-kasih"
  }'
```

**Contoh Respons:**
```json
{
  "id": "inv_9f8e7d6c5b4a3210",
  "order_id": "INV-2026-001",
  "base_amount": 50000,
  "unique_code": 12,
  "total_amount": 50012,
  "status": "PENDING",
  "qr_string": "00020101021226...",
  "payment_url": "https://qbiz-server-anda.com/pay/inv_9f8e7d6c5b4a3210"
}
```

- Tampilkan **`qr_string`** sebagai gambar QR di aplikasi Anda, **atau** cukup arahkan pembeli ke **`payment_url`** (halaman checkout siap pakai milik QBiz).
- Catat **`total_amount`** (`50012`) karena QBiz menambahkan kode unik agar transaksi dengan nominal sama tidak tertukar.

### Langkah 2: Cek Status Pembayaran (Opsional / Polling)

```bash
curl https://qbiz-server-anda.com/api/v1/invoices/inv_9f8e7d6c5b4a3210/status \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA"
```

### Langkah 3: Terima & Verifikasi Webhook Native QBiz

Saat pembayaran berhasil, QBiz mengirim `POST` JSON ke `callback_url` Anda dengan header:
- `X-QBiz-Signature`: HMAC-SHA256 hex dari `${timestamp}.${rawBody}` menggunakan `WEBHOOK_SECRET`
- `X-QBiz-Timestamp`: Unix timestamp pengiriman

Contoh verifikasi di **Node.js / Express**:
```js
import crypto from "node:crypto";

app.post("/webhook/qris", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-qbiz-signature"];
  const ts = req.headers["x-qbiz-timestamp"];
  const rawBody = req.body.toString("utf8");

  const expected = crypto
    .createHmac("sha256", process.env.QBIZ_WEBHOOK_SECRET)
    .update(`${ts}.${rawBody}`)
    .digest("hex");

  if (sig !== expected) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(rawBody);
  if (event.status === "PAID") {
    // Tandai pesanan lunas di database Anda
    console.log("Lunas:", event.order_id, event.total_amount);
  }

  res.status(200).send("OK");
});
```

---

## 🌐 4. Cara B: Koneksi Pakai Mode Kompatibilitas `doit.id`

Gunakan cara ini jika aplikasi/plugin Anda **sudah memakai format API `doit.id`** (atau plugin WooCommerce/Odoo/ERPNext dari `doit.id`). **Anda tidak perlu mengubah struktur kode Anda** — cukup arahkan Base URL ke server QBiz Anda!

| Komponen | Sebelumnya (`doit.id`) | Pakai QBiz |
| :--- | :--- | :--- |
| **Base URL** | `https://pay.doit.id` | `https://qbiz-server-anda.com` |
| **API Key** | `pb_live_xxx` / `pb_test_xxx` | API Key dari Dashboard QBiz |
| **Endpoint** | `/v1/payments`, `/v1/methods` | **Sama persis!** (`/v1/payments`, `/v1/methods`) |

### Langkah 1: Cek Metode Aktif (`GET /v1/methods`)

```bash
curl "https://qbiz-server-anda.com/v1/methods?amount=150000" \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA"
```

### Langkah 2: Buat Pembayaran (`POST /v1/payments`)

```bash
curl -X POST https://qbiz-server-anda.com/v1/payments \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: inv-001" \
  -d '{
    "amount": 150000,
    "rail": "qris",
    "reference": "INV/001",
    "return_url": "https://tokoanda.com/invoice/001",
    "metadata": {
      "callback_url": "https://tokoanda.com/webhook/doit",
      "customer_name": "Budi"
    }
  }'
```

**Contoh Respons (`201 Created`):**
```json
{
  "id": "pay_9f8e7d6c5b4a3210",
  "status": "pending",
  "amount": 150000,
  "rail": "qris",
  "reference": "INV/001",
  "qr_content": "00020101021226...",
  "va_number": null,
  "va_bank": null,
  "hosted_url": "https://qbiz-server-anda.com/pay/inv_9f8e7d6c5b4a3210",
  "return_url": "https://tokoanda.com/invoice/001",
  "provider": "qbiz",
  "provider_ref": "inv_9f8e7d6c5b4a3210",
  "fee_amount": 0,
  "fee_payer": "merchant",
  "total_amount": 150045,
  "expires_at": "2026-11-13T11:30:00.000Z",
  "paid_at": null,
  "metadata": { "callback_url": "https://tokoanda.com/webhook/doit", "customer_name": "Budi" },
  "created_at": "2026-11-13T10:30:00.000Z"
}
```

### Langkah 3: Cek Detail Pembayaran (`GET /v1/payments/:id`)

```bash
curl https://qbiz-server-anda.com/v1/payments/pay_9f8e7d6c5b4a3210 \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA"
```

### Langkah 4: Terima Webhook Format `doit.id`

Ketika pembayaran lunas, QBiz otomatis mendeteksi bahwa invoice dibuat via adapter `doit` dan mengirim payload JSON event `payment.paid`:

```json
{
  "event": "payment.paid",
  "data": {
    "id": "pay_9f8e7d6c5b4a3210",
    "status": "paid",
    "amount": 150000,
    "rail": "qris",
    "reference": "INV/001",
    "total_amount": 150045,
    "paid_at": "2026-11-13T10:32:15.000Z"
  }
}
```

Header yang dikirim adalah **`PayBridge-Signature`** (format `t=<unix_timestamp>,v1=<hmac_sha256_hex>` dari `<timestamp>.<rawBody>` menggunakan `WEBHOOK_SECRET`).

Contoh verifikasi di **Node.js**:
```js
import crypto from "node:crypto";

function verifyDoitSignature(rawBody, signatureHeader, webhookSecret) {
  const parts = Object.fromEntries(
    String(signatureHeader).split(",").map((kv) => kv.split("="))
  );
  if (!parts.t || !parts.v1) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected));
}
```

---

## 🔀 5. Mode Kompatibilitas Lainnya (Xendit & Duitku)

Selain `doit.id`, QBiz juga mendukung drop-in replacement untuk:

1. **Xendit Invoice API v2**
   - `POST /v2/invoices` (Auth: Basic Auth `API_KEY:` atau `Bearer API_KEY`)
   - `GET /v2/invoices/:id` & `POST /v2/invoices/:id/expire`
   - Webhook otomatis memakai header `x-callback-token`.
2. **Duitku v2**
   - `POST /webapi/api/merchant/v2/inquiry` (Signature: `MD5(merchantCode + merchantOrderId + paymentAmount + apiKey)`)
   - `POST /webapi/api/merchant/transactionStatus`
   - Webhook otomatis dikirim dalam format `application/x-www-form-urlencoded` dengan `resultCode=00` dan MD5 `signature`.

---

## 🧪 6. Cara Uji Coba (Sandbox) Tanpa Transfer Uang Asli

1. Set `SANDBOX_MODE=true` di `.env` server QBiz (atau buat invoice lewat API).
2. Jalankan endpoint simulasi pelunasan untuk langsung menguji perubahan status & pengiriman webhook ke server Anda:

```bash
curl -X POST https://qbiz-server-anda.com/api/v1/sandbox/simulate-payment \
  -H "Authorization: Bearer API_KEY_QBIZ_ANDA" \
  -H "Content-Type: application/json" \
  -d '{ "invoice_id": "inv_9f8e7d6c5b4a3210" }'
```

Server QBiz akan langsung menandai invoice sebagai `PAID` dan menembak webhook ke `callback_url` Anda!
