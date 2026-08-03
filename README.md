# QBiz Dynamic QRIS Gateway Hub

An in-house, dynamic QRIS payment middleware hub built to connect GoBiz merchant portals with custom Point-of-Sale (POS) systems, automate bank mutations, and dispatch HMAC-signed webhooks without third-party payment gateways.

---

## 🚀 Key Features

* **Real-time GoBiz Sync**: Scrapes and intercepts new transaction notifications directly from the GoBiz/GoFood Merchant Portal via Puppeteer.
* **Dynamic QRIS Generation**: Translates static QRIS EMVCo payloads into dynamic QR codes embedded with transaction-specific unique suffixes.
* **Pre-fixed secure IDs**: Utilizes secure prefixed string identifiers to block ID enumeration and data scraping.
* **Separation of Duties (RBAC)**: Supports 5 user roles (`SUPER_ADMIN`, `ADMIN`, `REGIONAL_ADMIN`, `MERCHANT`, `MERCHANT_EMPLOYEE`) with query-level data isolation.
* **Multi-Tenant Credentials**: Each merchant owner user maintains their own API Key, webhook target URL, and HMAC-SHA256 signing secret.

---

## 🛠️ Tech Stack & Architecture

* **Runtime & Framework**: [Deno](https://deno.com/) with [Hono.js](https://hono.dev/)
* **Frontend SSR**: React JSX (`@hono/react-renderer`)
* **Styling**: Tailwind CSS (fully responsive, dark/light mode preference)
* **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
* **Worker & Automation**: Puppeteer Chromium scraping & XHR intercept worker
* **Compliance**: WCAG AA accessiblity, fintech security standards.

---

## 🔑 Integration & Reference Documentation

For detailed information on how to integrate QBiz into your POS system, refer to:
* **API Documentation**: [APIQBIZ.md](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/APIQBIZ.md)
* **Security & Audit Policy**: [SECURITY.md](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/SECURITY.md)

### Official Client SDKs
* **Node.js/JavaScript SDK**: [sdk/qbiz-node.js](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz-node.js)
* **PHP SDK**: [sdk/qbiz.php](https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/sdk/qbiz.php)

---

## 🚀 Getting Started

### 1. Environmental Setup
Create a `.env` file in the root directory (automatically loaded by Deno using `--env`):
```env
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<dbname>
WEBHOOK_SECRET=your_global_webhook_signing_secret_key
PORT=8000
BASE_URL=http://localhost:8000
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

## 🔑 Default Seed Demo Accounts

On application startup, a default set of users are seeded into the database for quick evaluation of access controls.

| Role Name | Demo Email | Demo Password | Default API Key / Webhook |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@qbiz.com` | `SuperQBiz2026` | `qbiz_api_key_live_2026_w8a2b3d9x7c` |
| **Admin Operations** | `admin@qbiz.com` | `AdminQBiz2026` | `qbiz_api_key_live_2026_admin` |
| **Regional Admin** | `regional@qbiz.com` | `RegionalQBiz2026` | `qbiz_api_key_live_2026_regional` |
| **Merchant Owner** | `merchant@qbiz.com` | `MerchantQBiz2026` | `qbiz_api_key_live_2026_merchant` |
| **Cashier / Employee** | `karyawan@qbiz.com` | `EmployeeQBiz2026` | `qbiz_api_key_live_2026_karyawan` |
