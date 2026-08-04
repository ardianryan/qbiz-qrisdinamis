# ⚡ QBiz — Dynamic QRIS Gateway Hub

![Runtime](https://img.shields.io/badge/Runtime-Deno-blue?style=flat-square&logo=deno)
![Framework](https://img.shields.io/badge/Framework-Hono.js-e36002?style=flat-square&logo=hono)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)
![Automation](https://img.shields.io/badge/Automation-Puppeteer-0097a7?style=flat-square&logo=puppeteer)

**QBiz** is a modern, self-hosted dynamic QRIS payment gateway hub. It acts as an in-house middleware to connect GoBiz/GoFood merchant portals with custom Point-of-Sale (POS) systems, automates transaction synchronization via headless browser automation, and dispatches HMAC-SHA256 signed webhooks directly to your POS system without relying on third-party payment gateways.

> [!WARNING]
> **DISCLAIMER & WARRANTY LIMITATION (UNOFFICIAL API)**
> 
> This gateway hub is an **Unofficial API** that operates via browser automation scraping and XHR interception on merchant portals. Any risks of account suspension, access restriction on the GoBiz/GoFood portal, or other legal and financial implications arising from the use of this system are entirely the **user's own responsibility (as-is)**.
> 
> **COMPATIBILITY LIMITATION**: Currently, this payment gateway hub **only supports QRIS Gopay Merchant / GoFood Merchant**.

---

## 🚀 Fitur Unggulan

1. 💸 **Dynamic QRIS & Suffix Generation**
   * **EMVCo Parsing**: Parses static QRIS EMVCo payloads and serializes them with dynamic transaction indicators.
   * **Unique Suffixes**: Automatically appends minor unique codes (e.g., Rp 1 to Rp 999) to invoices to distinguish simultaneous payments of the same base amount.
   * **CRC-16 Re-computation**: Computes the CCITT checksum on-the-fly to compile valid dynamic QR codes.

2. 🔄 **GoBiz Real-time Interception**
   * **Puppeteer Worker**: Headless Chromium session intercepts transactions directly inside the GoBiz portal.
   * **WhatsApp OTP Integration**: Forwards OTP requests to the merchant's registered WhatsApp account for two-factor authentication.
   * **Auto Webhook Dispatch**: Triggers target merchant webhooks with HMAC-SHA256 signature verification payloads.

3. 👥 **Multi-Tenant & Role Management (RBAC)**
   * **Five System Roles**: Supports `SUPER_ADMIN`, `ADMIN`, `REGIONAL_ADMIN`, `MERCHANT`, and `MERCHANT_EMPLOYEE`.
   * **Database Isolation**: Scopes transaction histories, cashier directories, and invoice parameters according to tenant boundaries (merchant owners only see their own store).
   * **API Key Rotation**: Allows merchants to independently rotate API keys and modify webhook secrets from the dashboard.

4. 🔌 **Official Developer Integration**
   * **Client SDKs**: Built-in client libraries for [PHP](sdk/qbiz.php) and [Node.js](sdk/qbiz-node.js).
   * **Pre-fixed IDs**: Protects resources from scraping using unguessable prefixes (`usr_`, `mrc_`, `inv_`).

---

## 🛠️ Getting Started (Local Development)

### 1. Environmental Setup
Create a `.env` file in the root directory (automatically loaded by Deno using `--env`):
```env
PORT=8000
BASE_URL=http://localhost:8000
DATABASE_URL=postgres://user:password@localhost:5432/qrispaymti
COOKIE_SECRET=your_cookie_signing_secret
JWT_SECRET=your_jwt_secret
```

### 2. Push Schema to Database
Initialize your PostgreSQL database tables directly from Drizzle schema definitions:
```bash
deno run -A npm:drizzle-kit push --schema=db/schema.ts --dialect=postgresql --url=YOUR_DATABASE_URL
```

### 3. Compile Tailwind CSS Styles
Compile the utility classes:
```bash
deno task build:css
```

### 4. Run Server
Start the Hono dev server:
```bash
deno task dev
```
Open **`http://localhost:8000/`** in your browser.

---

## 📦 Production Deployment

* **One-Click Automated VPS Installer**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/install.sh -o install.sh
  chmod +x install.sh
  sudo ./install.sh
  ```
* **Docker Compose Deployment**:
  ```bash
  docker compose up -d --build
  ```
* **Portainer & aaPanel Deployment**: Detailed configurations for reverse proxy and SSL Let's Encrypt are available in the [aaPanel & Portainer Deployment Guide](PORTAINER_AAPANEL.md).

---

## 🔑 Default Seed Demo Accounts

On application startup, default accounts are seeded into the database for quick evaluation of access controls.

| Role Name | Demo Email | Demo Password | Default API Key / Webhook |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@qbiz.com` | `SuperQBiz2026` | `qbiz_api_key_live_2026_w8a2b3d9x7c` |
| **Admin Operations** | `admin@qbiz.com` | `AdminQBiz2026` | `qbiz_api_key_live_2026_admin` |
| **Regional Admin** | `regional@qbiz.com` | `RegionalQBiz2026` | `qbiz_api_key_live_2026_regional` |
| **Merchant Owner** | `merchant@qbiz.com` | `MerchantQBiz2026` | `qbiz_api_key_live_2026_merchant` |
| **Cashier / Employee** | `karyawan@qbiz.com` | `EmployeeQBiz2026` | `qbiz_api_key_live_2026_karyawan` |
