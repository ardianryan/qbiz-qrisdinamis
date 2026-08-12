# QBiz Security Policy & Financial Compliance Standards (SECURITY.md)

This document defines the security standards, data protection architecture, security audits, and compliance guidelines for government and financial regulations implemented within the QBiz Dynamic QRIS payment router middleware.

---

## 1. Security Audit Summary

| Security Area | Current Defense Mechanism | Compliance Status |
| :--- | :--- | :--- |
| **API Authentication** | Dynamic per-user Bearer API Key with DB verification mapping | **PASSED (Fintech Grade)** |
| **Transaction Integrity** | Webhook verification using HMAC-SHA256 signature payloads | **PASSED (Fintech Grade)** |
| **ID Enumeration Prevention** | Random string transaction IDs (Prefixed Secure IDs) | **PASSED (Fintech Grade)** |
| **Access Control (RBAC)** | Strict data isolation (Multi-Tenancy) at the ORM query level | **PASSED (Fintech Grade)** |
| **Session Data Protection** | Isolated Puppeteer browser session files per Merchant | **PASSED (Fintech Grade)** |
| **Injection & XSS Protection** | Parameterized queries via ORM and React-based escaping | **PASSED (Fintech Grade)** |

---

## 2. Security Architecture & Implementation Details

### A. API Authentication & Key Management
* **Per-User API Keys**: API keys are generated dynamically (`qbiz_api_key_live_2026_[16_char_hex]`) providing $16^{16}$ possible combinations to prevent brute-force attacks.
* **Scope Isolation**: API keys are mapped directly to authorized user accounts in the database. External client systems cannot retrieve or generate invoices for other tenants.
* **Key Rotation**: Users can rotate their API keys at any time via the Developer Hub dashboard to minimize the window of credential exposure.

### B. Webhook Verification & Anti-Spoofing
* **HMAC-SHA256 Signatures**: Each outgoing webhook is signed with the user's custom cryptographic secret key (`webhook_secret`):
  $$\text{Signature} = \text{HMAC-SHA256}(\text{JSON Payload}, \text{webhook\_secret})$$
* **Signature Header**: The computed signature is dispatched in the `X-QBiz-Signature` header. Client servers must compute and match this signature to verify payload integrity and origin before processing payments.
* **Network Reliability**: Dispatches feature a 10-second timeout with an exponential backoff retry mechanism (retrying up to 3 times: 5s, 15s, 45s offsets) to guarantee delivery under unstable network conditions.

### C. Role-Based Access Control (RBAC & Multi-Tenancy)
The system enforces separation of duties across five distinct roles:
* **SUPER_ADMIN**: Full platform dashboard controls, operations monitoring, user management, and security log management.
* **ADMIN**: Daily merchant operations manager, OTP review, and global transaction monitors.
* **REGIONAL_ADMIN**: Access restricted strictly to merchants mapped to their region via junction table parameters.
* **MERCHANT**: Store owner accounts isolated to their own metrics, cashier lists, and invoices (`merchantId`).
* **MERCHANT_EMPLOYEE**: Cashier role restricted to creating dynamic checkout invoices and viewing matching transactions without developer settings.

### D. Headless Integration Security (Puppeteer Sessions)
* **No Password Storage**: QBiz does not store QRIS Food Merchant portal account passwords in the database. Authentication relies on one-time OTP tokens dispatched directly to the merchant's registered WhatsApp line.
* **Session Cookie Isolation**: Headless session files are stored in individual encrypted files inside the `sessions/` directory, excluded from public web assets.
* **Automatic Disconnection**: If a headless session fails, terminates, or expires, the status is immediately flagged as `DISCONNECTED` or `NEEDS_OTP` to prevent unauthorized execution.

### E. Fraud Validation & Collision Prevention
* **Unique Nominal Suffixes**: Invoice nominal totals are modified by minor unique digit increments. If multiple pending invoices share the same base amount, the system dynamically calculates the next available suffix.
* **Auto-Expiration**: Invoices are restricted to a **5-minute** validity window. Once expired, the unique suffix is released back to the pool, preventing double-spend exploits.

---

## 3. Compliance Checklist (Government & Financial Regulations)

### [x] Transport Layer Security (TLS)
* **Requirements**: Enforce TLS 1.2 or TLS 1.3 across all communication channels (REST APIs, Webhooks, and User Interfaces).
* **Status**: PASSED. Configured at the Load Balancer / Reverse Proxy layer (Nginx/Cloudflare) before forwarding requests to the Hono backend server.

### [x] Data Encryption at Rest
* **Requirements**: Encrypt sensitive Puppeteer session files on disk using symmetric encryption algorithms.
* **Status**: PASSED. All Puppeteer session files in the `sessions/` folder are encrypted using AES-256-GCM, with keys derived dynamically from the environment secret via PBKDF2 (100,000 iterations and a static salt).

### [x] Security Trail Logs (Audit Logs)
* **Requirements**: Log sensitive administrative operations (key regeneration, webhook adjustments, record deletions) detailing origin IP, timestamps, and operator identity.
* **Status**: PASSED. System logger output is piped directly to stdout, allowing easy integration with local system services (journald) or remote security information managers (SIEM).

### [x] Secure Error Handling
* **Requirements**: Prevent internal system details (system paths, SQL structures, stack traces) from leaking to client responses.
* **Status**: PASSED. All API and web errors are intercepted and wrapped into user-friendly messages (`c.json({ error: "Friendly message" })`) while detail logs are kept within internal console scopes.

---

## 4. Vulnerability Disclosure Policy

If you discover a security vulnerability within QBiz, please **do not** file a public GitHub issue. Instead, report it directly to our security team via email at **inisaya@ardianryan.com** to allow us to address and patch the issue securely (*Responsible Disclosure*).
