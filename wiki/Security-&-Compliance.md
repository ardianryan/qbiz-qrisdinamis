# Security & Compliance Standards 🛡️

QBiz Gateway Hub follows **OWASP Top 10 (2021/2026)** principles, **NIST SP 800-63B** digital identity guidelines, and **PCI-DSS** security practices for handling payment-adjacent services.

---

## 🔒 Security Architecture Highlights

### 1. Cryptographic Safeguards
* **PBKDF2 Password Hashing**: Passwords are saved with dynamic unique salts and hashed using PBKDF2-SHA256 with 100,000 iterations.
* **AES-256-GCM Session Encryption**: Sensitive session cookie files stored in `sessions/` are encrypted at rest using AES-256-GCM with a dynamically generated 12-byte initialization vector (IV).
* **HMAC-SHA256 Webhook Signatures**: All outbound webhook payloads include the `X-QBiz-Signature` header computed using HMAC-SHA256 and a dedicated endpoint secret, along with `X-QBiz-Timestamp` to prevent replay attacks.
* **EMVCo CRC-16 Verification**: Real-time CRC-16-CCITT recomputation guarantees that dynamic QR codes conform strictly to national payment standards.

### 2. Access Control & Granular RBAC
QBiz enforces strict multi-tenant boundaries using Role-Based Access Control across 5 distinct system roles:
- **`SUPER_ADMIN`**: Full platform control, global merchant management, system settings, white-label theme configuration, and user creation.
- **`ADMIN`**: Multi-merchant management, API key issuance, transaction monitoring, and cashier directory controls.
- **`REGIONAL_ADMIN`**: Scoped management for specific geographical regions or assigned merchant subsets.
- **`MERCHANT`**: Store owner view, transaction history, notification configuration, and store-scoped developer settings.
- **`MERCHANT_EMPLOYEE`**: Cashier-only view restricted to the live transaction monitor.

### 3. Granular API Key Permission Scopes
API keys support per-store scoping and fine-grained capability checkboxes:
* `invoices:create` (WRITE)
* `invoices:read` (READ)
* `transactions:read` (READ)
* `merchants:read` (READ)
* `webhooks:manage` (WRITE)

### 4. Defense-in-Depth HTTP Security Headers
All HTTP responses automatically include protective browser security headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (HTTPS only)
```

### 5. Server-Side Request Forgery (SSRF) Guard
Outbound notification targets and webhook URLs are strictly validated by `isValidOutboundUrl()`:
* Blocks cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`, `168.63.129.16`, `100.100.100.200`).
* Blocks link-local IPv4 (`169.254.0.0/16`) and IPv6 (`fe80::`).
* Enforces standard `http:` and `https:` protocols only.

### 6. Rate Limiting & DoS Protection
Sliding-window in-memory rate limiters protect sensitive endpoints (`/login`, `/api/v1/invoices`, `/api/v1/merchants/:id/otp`) against brute-force attacks and abuse.
