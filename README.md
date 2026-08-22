# ⚡ QBiz — Dynamic QRIS Gateway Hub (v1.0.5)

[![Test & CI](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/ci.yml/badge.svg)](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/codeql.yml/badge.svg)](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/codeql.yml)
[![Docker Build & Push](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/docker-build-push.yml/badge.svg)](https://github.com/ardianryan/qbiz-qrisdinamis/actions/workflows/docker-build-push.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)
![Runtime](https://img.shields.io/badge/Runtime-Deno-blue?style=flat-square&logo=deno)
![Framework](https://img.shields.io/badge/Framework-Hono.js-e36002?style=flat-square&logo=hono)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)
![Automation](https://img.shields.io/badge/Automation-Puppeteer-0097a7?style=flat-square&logo=puppeteer)

**QBiz** is a modern, self-hosted dynamic QRIS payment gateway hub. It acts as an in-house middleware to connect QRIS Food Merchant portals with custom Point-of-Sale (POS) systems, automates transaction synchronization via headless browser automation, and dispatches HMAC-SHA256 signed webhooks directly to your POS system without relying on third-party payment gateways.

> [!WARNING]
> **DISCLAIMER, RISK WARNING, & WARRANTY LIMITATION (UNOFFICIAL API)**
> 
> This gateway hub is an **Unofficial API** that operates via browser automation scraping and XHR interception on merchant portals, which may violate the portal provider's terms of service (e.g., automated scraping and bot activity bans).
> 
> **Use this software entirely at your own risk (DWYOR - Do With Your Own Risk).** Any risks of account suspension, access restriction on the merchant portal, or other legal and financial implications arising from the use of this system are entirely the **user's own responsibility (as-is)**. The developers assume no liability.
> 
> **COMPATIBILITY LIMITATION**: Currently, this payment gateway hub **only supports QRIS Food Merchant**.

---

## 🚀 Key Features

1. 💸 **Dynamic QRIS & Suffix Generation**
   * **EMVCo Parsing**: Parses static QRIS EMVCo payloads and serializes them with dynamic transaction indicators.
   * **Unique Suffixes**: Automatically appends minor unique codes (e.g., Rp 1 to Rp 999) to invoices to distinguish simultaneous payments of the same base amount.
   * **CRC-16 Re-computation**: Computes the CCITT checksum on-the-fly to compile valid dynamic QR codes.

2. 🔄 **QRIS Food Merchant Real-time Interception**
   * **Puppeteer Worker**: Headless Chromium session intercepts transactions directly inside the QRIS Food Merchant portal.
   * **WhatsApp OTP Integration**: Forwards OTP requests to the merchant's registered WhatsApp account for two-factor authentication.
   * **Auto Webhook Dispatch**: Triggers target merchant webhooks with HMAC-SHA256 signature verification payloads and `X-QBiz-Timestamp` anti-replay headers.
   * **Session Security at Rest**: Encrypts browser session cookie files on disk using AES-256-GCM symmetric encryption derived via PBKDF2 (100,000 iterations).

3. 🛡️ **Enterprise Security & Hardening**
   * **PBKDF2 Password Cryptography**: Passwords protected with PBKDF2-SHA256 (100,000 iterations) with dynamic unique salts.
   * **HTTP Security Headers**: Defense-in-depth headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`).
   * **Sliding-Window Rate Limiting**: Built-in in-memory rate limiting on login, charges API, and status check endpoints.
   * **Graceful Process Termination**: Catches `SIGINT`/`SIGTERM` to safely terminate headless browser processes and prevent zombie processes.

4. 👥 **Multi-Tenant & Role Management (RBAC)**
   * **Five System Roles**: Supports `SUPER_ADMIN`, `ADMIN`, `REGIONAL_ADMIN`, `MERCHANT`, and `MERCHANT_EMPLOYEE`.
   * **Database Isolation**: Scopes transaction histories, cashier directories, and invoice parameters according to tenant boundaries.
   * **API Key Rotation**: Allows merchants to independently rotate API keys and modify webhook secrets from the dashboard.

5. 🔌 **Official Developer Integration**
   * **Client SDKs**: Built-in client libraries for [PHP](sdk/qbiz.php), [Node.js](sdk/qbiz-node.js), [Python](sdk/qbiz.py), and [Rust](sdk/qbiz.rs).
   * **Pre-fixed IDs**: Protects resources from scraping using unguessable prefixes (`usr_`, `mrc_`, `inv_`).

---

## 📂 Codebase Architecture & Key Functions

Below is an overview of the key components and functions driving the gateway:

### 1. Dynamic QRIS Generation (`src/utils/qris.ts`)
- **`parseEMVCo(payload: string)`**: Parses raw static EMVCo string payload structures into structured tag key-value pairs.
- **`serializeEMVCo(tags: Record<string, string>)`**: Serializes modifications back into standard EMVCo string formatting.
- **`computeCRC16(data: string)`**: Calculates CCITT CRC-16 checksums on-the-fly to ensure generated QR codes are valid for mobile scanning apps.
- **`generateDynamicQRIS(staticPayload: string, amount: number, invoiceId: string)`**: Injects the target total amount, unique transaction suffix, and invoice identifiers directly into the dynamic QR payload.

### 2. Puppeteer Sync Workers (`worker/puppeteer-listener.ts`)
- **`startMerchantListener(merchantId: string)`**: Spawns a headless Chromium instance to authenticate with the QRIS Food Merchant portal, intercept mutation API feeds, and listen for incoming successful transactions.
- **`triggerMerchantOTP(merchantId: string)`**: Relays QRIS Food Merchant two-factor OTP challenges directly to the merchant owner via their registered WhatsApp line.

### 3. Middleware & Security Auth (`src/middleware/auth.ts` & `src/middleware/security.ts`)
- **`authMiddleware(c: any, next: any)`**: Inspects signed session cookies to protect dashboard pages while whitelisting public checkout routes, API endpoints, and crawler files.
- **`securityHeadersMiddleware(c: any, next: any)`**: Emits protective HTTP security headers across all incoming responses.
- **`createRateLimiter(options)`**: Sliding-window in-memory limiter to defend against brute-force and DoS attempts.
- **`requireRole(roles: string[])`**: Evaluates active user sessions to enforce Role-Based Access Control (RBAC).

### 4. Cryptographic Encryption at Rest (`src/utils/crypto.ts`)
- **`encryptSession(text: string)`**: Encrypts sensitive session files (JSON-serialized browser cookies) using symmetric AES-256-GCM encryption.
- **`decryptSession(encryptedBase64: string)`**: Decrypts the session file cipher text back to plain text, using a key derived dynamically via PBKDF2 (100,000 iterations & static salt) from the environment `COOKIE_SECRET` variable.

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

# Optional parameters for proxy and sandbox tuning
PROXY_SERVER=http://username:password@proxyhost:port # HTTP/HTTPS/SOCKS5 proxy server for Puppeteer
SANDBOX_MODE=false # Set to true to globally force all invoices into sandbox testing mode
```

### 2. Run Database Migrations
Run the migration script to automatically apply database schemas to your PostgreSQL server:
```bash
deno task db:migrate
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

### 🖥️ Recommended Deployment Specifications

Because QBiz utilizes **Puppeteer (headless Chromium)** in the background to sync transaction portals, the host server must have sufficient memory to prevent Chromium processes from being terminated by the operating system (Out-of-Memory / OOM crashes).

| Metric | Minimum Requirement (Base) | Recommended Specification |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU (shared core) | 2 vCPUs or higher |
| **RAM** | 1 GB RAM (requires swap enabled) | 2 GB RAM or higher |
| **Storage** | 10 GB SSD / NVMe | 20 GB SSD or higher |
| **Operating System** | Ubuntu 22.04 LTS / Debian 11+ | Ubuntu 24.04 LTS / Docker Host |
| **Swap Space** | 1 GB - 2 GB Swap (if RAM <= 1GB) | Not required if RAM >= 2GB |
| **Bandwidth** | 10 Mbps symmetric | 100 Mbps or higher |

> [!IMPORTANT]
> **Swap Allocation Warning**: If you deploy QBiz on a entry-level VPS with only 1 GB of RAM (such as DigitalOcean Basic or Linode Shared Nano), you **must** configure at least 1 GB of virtual swap space, otherwise Puppeteer will crash under load due to OOM limits.

* **One-Click Automated VPS Installer**:
  ```bash
  curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/install.sh -o install.sh
  chmod +x install.sh
  sudo ./install.sh
  ```
* **Official Prebuilt Docker Image**:
  Pull and run directly from Docker Hub or GitHub Packages:
  ```bash
  # Docker Hub
  docker pull ardianryan/qbiz-qrisdinamis:latest

  # GitHub Container Registry (GHCR)
  docker pull ghcr.io/ardianryan/qbiz-qrisdinamis:latest
  ```
  Run using `docker run` with your local environment configuration:
  ```bash
  docker run -d \
    --name qbiz-gateway \
    -p 8000:8000 \
    --env-file .env \
    -v $(pwd)/sessions:/app/sessions \
    ardianryan/qbiz-qrisdinamis:latest
  ```
* **Docker Compose Deployment**:
  Build and run multi-container setups locally:
  ```bash
  docker compose up -d --build
  ```
* **Portainer & aaPanel Deployment**: Detailed configurations for reverse proxy and SSL Let's Encrypt are available in the [aaPanel & Portainer Deployment Guide](PORTAINER_AAPANEL.md).

---

## 📖 API Documentation (Scalar UI)

Interactive Scalar API documentation is served directly at `/docs` (configured via OpenAPI 3.0 specification in `static/openapi.json`). You can use it to test endpoints, copy code playground snippets, or download configurations.

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

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
