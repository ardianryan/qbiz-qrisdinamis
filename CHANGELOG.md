# Changelog

All notable changes to the **QBiz Gateway Hub** project will be documented in this file. The versioning scheme follows [Semantic Versioning (SemVer)](https://semver.org/).

## [1.1.0] - 2026-08-30

### Added
- **Super Admin System Settings Hub (`/settings`)**:
  - **Dynamic Branding & Theme Engine**: Customize platform name, tagline, footer notice, and primary theme color with instant whole-portal UI reflection across buttons, active navigation, badges, tabs, and focus rings.
  - **Smart 1-Click Multi-Format Logo Converter**: Upload a single high-res logo and automatically generate browser favicons (32x32), Apple Touch icons (180x180), and PWA icons (192x192, 512x512 maskable) via client-side HTML5 Canvas.
  - **PWA & Mobile App Management**: W3C Web App Manifest generation (`/manifest.webmanifest`), offline service worker (`/sw.js`), and international installation prompt policies.
  - **Payment & QRIS Global Policies**: Configurable invoice expiry window, unique 3-digit code bounds, static QRIS fallback, minimum/maximum charge amounts, and webhook retry limits.
  - **GoBiz Scraper Fleet Controls**: Polling interval adjustments, auto-recovery toggles, and OTP sync alerting.
  - **Security & Access Controls**: Session TTL configuration, maintenance mode with customizable guest notices, and rate limiting thresholds.
  - **Notification Fallback Templates & Backup Diagnostics**: Global defaults for Telegram, WhatsApp, and Discord, along with 1-click in-memory cache flushing.

- **Enterprise Multi-Webhook Endpoints Management (`/developer`)**:
  - **Store-Scoped Webhook Subscriptions**: Register distinct webhook URLs per merchant store (or global `ALL` for Super Admin) to route transaction callbacks to specific branch servers, POS systems, or cloud pipelines.
  - **Granular Event Subscriptions**: Subscribe to specific event triggers (`payment.success`, `invoice.created`, `invoice.expired`).
  - **Dedicated HMAC-SHA256 Secret per Webhook**: Auto-generated 24-byte crypto secret keys for payload signature verification via `X-QBiz-Signature` header.
  - **Interactive Webhook Management UI**: Developer Hub modal to create, test with 1-click simulated payload, pause/activate, or delete webhook endpoints with live delivery status badges (`HTTP 200 OK • 2 mins ago`).
  - **Non-Blocking Parallel Dispatch**: Dispatches callbacks across all matching store and global subscriptions via `Promise.allSettled` while preserving `invoice.callbackUrl` per-transaction overrides and legacy user webhooks (100% Backward Compatible).

- **Enterprise Multi-API Keys & Granular RBAC Permissions (`/developer`)**:
  - **Multi-Store Workspace Scoping**: Bind API Keys directly to specific merchant stores or global scope. Third-party integrations automatically bind charges without needing `merchant_id` in request payloads.
  - **Granular Permissions (Scope Checkboxes)**: Per-key access control for `invoices:create` (WRITE), `invoices:read` (READ), `transactions:read` (READ), `merchants:read` (READ), and `webhooks:manage` (WRITE).
  - **Quick Scope Presets**: 1-click presets for *Select All*, *POS Terminal*, and *Read Only*.
  - **One-Time Secret Reveal Security**: Cryptographically secure 24-byte entropy token revealed only once upon creation, with masked preview (`qbiz_live_...4a9f`) in the dashboard.
  - **100% Backward Compatibility**: Existing legacy user keys continue to function uninterrupted with full fallback permissions.
  - **Real-Time Bot Integration Guides**: Interactive tabbed setup guides for Telegram Bot, Discord Webhooks, and WhatsApp GOWA with live template variables dictionary.

- **Mobile-First UX & Fluid SPA Transitions**:
  - **Native Bottom Navigation Bar**: Clean mobile app navigation bar for fast thumb reachability (`Dashboard`, `Merchants`, `Transactions`, `More`).
  - **Spring-Curve Sliding Bottom Sheet**: Fluid sliding sheet for extended menus, store switching, and account profile controls.
  - **SPA View Transitions**: Lightweight client-side navigation with animated top loading progress bar and anti-flicker theme switching.

- **Security & Data Integrity Hardening**:
  - **SSRF (Server-Side Request Forgery) Defense**: Comprehensive URL validation (`isValidOutboundUrl`) blocking cloud metadata endpoints (AWS, GCP, Azure, Alibaba, OpenStack), IPv4 link-local subnets, IPv6 link-local, and dangerous protocols across all webhook dispatches and test triggers.
  - **Multi-Tenant Cross-Store Boundary Enforcement**: Strict role-based authorization ensuring Merchant owners and Regional Admins cannot access, create, or revoke keys outside their assigned stores.
  - **Self-Healing Safe DDL Migrations**: Zero-data-loss database initialization (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`) ensuring container restarts and rebuilds never overwrite existing data.
  - **Docker Build Self-Containment**: Integrated Tailwind CSS build step into Dockerfile to guarantee reproducible, crash-free container builds.

- **Contextual Multi-Merchant Workspace Switcher**:
  - Global Store Switcher allowing users to seamlessly switch active merchant store workspaces.
  - Contextual Scoping across all application views: Dashboard statistics, live transaction feeds, QRIS settings, and Developer API SDK snippets automatically scope to the selected store.
  - Active workspace session persistence via signed secure cookies (`POST /api/v1/workspaces/switch`).

- **Multi-Channel Store Notifications (Telegram, Discord, WhatsApp GOWA)**:
  - Real-time payment success delivery via Telegram Bot API, Discord Webhook embeds, and WhatsApp GOWA HTTP API.
  - Per-channel test dispatch buttons and customizable message interpolation.

- **Expanded Multi-Language Client SDKs**:
  - 🦫 **Go (Golang)** ([`sdk/qbiz.go`](sdk/qbiz.go))
  - 🔷 **TypeScript** ([`sdk/qbiz.ts`](sdk/qbiz.ts))
  - 🎯 **Dart / Flutter** ([`sdk/qbiz.dart`](sdk/qbiz.dart))
  - ☕ **Java** ([`sdk/QBizClient.java`](sdk/QBizClient.java))

---

## [1.0.6] - 2026-08-26

### Security & Dependency Updates
- **Puppeteer 24.x Upgrade**: Upgraded `puppeteer` to `^24.2.1` to utilize modern Chrome DevTools Protocols (CDP/BiDi) and resolve legacy package deprecations.
- **Framework & Driver Upgrades**: Upgraded `hono` to `^4.7.2`, `postgres` client to `^3.4.5`, and `lucide-react` to `^0.475.0`.
- **Standard Library Modernization**: Migrated test suites to use `@std/assert` via JSR standard imports.
- **Sanitized CI Credentials**: Fully scrubbed all sensitive username references across Docker configs, deployment guides, and CI workflows into generic identifiers.

---

## [1.0.5] - 2026-08-22

### Added
- **Automated CI & Test Workflow**: Integrated GitHub Actions CI workflow (`.github/workflows/ci.yml`) to automatically validate TypeScript types and run all unit/integration tests on pushes and pull requests to `main`.
- **CodeQL SAST Security Analysis**: Added GitHub Actions CodeQL Security Analysis workflow (`.github/workflows/codeql.yml`) to run automated static application security testing and vulnerability scanning.
- **Status & Quality Badges**: Integrated live build, test, and CodeQL security status badges directly into the `README.md` header.

---

## [1.0.4] - 2026-08-20

### Security & Hardening
- **PBKDF2 Password Cryptography**: Upgraded password hashing and verification to PBKDF2 (100,000 iterations via Web Crypto API) with dynamic random per-account salts and automatic legacy upgrade on login.
- **HTTP Security Headers Middleware**: Added defense-in-depth protective headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`).
- **In-Memory Sliding-Window Rate Limiting**: Added rate limit protection on login (`POST /login`, 10 req/min), charge creation (`POST /api/v1/invoices`, 100 req/min), and status polling (`GET /api/v1/invoices/:id/status`, 120 req/min).
- **Payload Body Size Limiting**: Enforced a 1MB max payload size constraint to prevent buffer/memory exhaustion attacks.
- **Webhook Anti-Replay Timestamp**: Added `X-QBiz-Timestamp` header to all outgoing webhook callbacks to facilitate replay attack verification on client endpoints.
- **Zombie Process Prevention & Graceful Shutdown**: Registered `SIGINT`/`SIGTERM` process listeners to gracefully close all active headless Chromium browser instances on shutdown.
- **Session Volume Persistence**: Ensured Docker Compose and Portainer volumes properly persist encrypted session files across container rebuilds.

---

## [1.0.2] - 2026-08-11

### Added
- **API Sandbox Testing Mode**: Introduced custom sandbox flag `isSandbox` for invoices. Sandbox invoices display a simulator banner on the checkout page allowing developers to trigger mock payment successes and dispatch realistic webhook signatures without actual money transfers.
- **Headless Puppeteer Proxy Support**: Integrated dynamic SOCKS5/HTTP network proxy routing using the `PROXY_SERVER` environment variable, enabling secure traffic tunneling with optional username and password proxy authentication.
- **Drizzle Configuration**: Added root config `drizzle.config.ts` and automated migration runner `db/migrate.ts` to manage schema alterations professionally.

### Changed
- **Drizzle Migration Tasks**: Transitioned database initialization from raw schema pushes (`drizzle-kit push`) to tracked migrations run via `deno task db:migrate`.

---

## [1.0.1] - 2026-08-11

### Added
- **Multi-Language Client SDKs**: Added official clients for **Python** (`sdk/qbiz.py`, zero-dependency) and **Rust** (`sdk/qbiz.rs`, asynchronous client) with dynamic invoice generation, status checks, and HMAC webhook verification.
- **Docker Caching & Automation (CI/CD)**: Created GitHub Actions workflow (`docker-build-push.yml`) to automatically compile, cache (using `type=gha`), and push Docker images to Docker Hub and GHCR on commits to `main` and release tags.
- **Auto GitHub Releases**: Configured the release pipeline to auto-generate changelogs and publish official GitHub Release pages upon tag releases (`v*`).
- **Community Standards**: Added `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md` guides to establish community standards and project guidelines.
- **Docker Hub Metadata Sync**: Added automated Docker Hub overview description update step in GitHub Actions.

### Fixed
- **Docker Debian Base Fonts**: Fixed Debian font dependency errors in `Dockerfile` by removing the obsolete `fonts-kacst` package.
- **React Title Rendering**: Resolved mixed child warning within Checkout JSX pages by encapsulating the `<title>` string inside a single template literal.
- **Portainer Setup Optimization**: Replaced the boot-time entrypoint dependency compilation in `PORTAINER_AAPANEL.md` with the new optimized prebuilt Docker Hub image (`ardianryan/qbiz-qrisdinamis:latest`).
- **Unified Support Contact**: Transitioned security and developer contacts to personal email `inisaya@ardianryan.com` across all assets.

---

## [1.0.0] - 2026-08-04

### Added
- **Initial Release of QBiz Gateway Hub**
- **Dynamic QRIS Generation**: Implemented EMVCo parser, suffix calculator (+Rp 1 to +Rp 999), and CCITT CRC-16 re-calculator to enable dynamic QR code generation.
- **QRIS Food Merchant Interceptor Workers**: Headless Puppeteer Chromium worker for real-time QRIS Food Merchant transaction scraping, XHR interception, and session authentication.
- **WhatsApp OTP Integration**: Direct OTP forwarding to merchant's registered WhatsApp line for secure portal authentication.
- **HMAC Webhook Dispatcher**: Signature validation payloads (HMAC-SHA256) sent immediately to POS clients upon payment detection.
- **Admin Dashboard Console**: Multi-tenant RBAC panel supporting Super Admin, Operations Admin, Regional Admin, Merchant Owner, and cashier/employee scopes.
- **Interactive Scalar API Docs**: Beautiful interactive developer documentation served at `/docs` backed by an OpenAPI 3.0 specification (`static/openapi.json`).
- **LLM Indexing Support**: Created root specifications `llms.txt` and `llms-full.txt` alongside meta link declarations for AI agent discovery.
- **Geographic & SEO Target Metadata**: Integrated Indonesia regional GEO meta codes and search engine indexing boundaries via `robots.txt` and meta indexing tags.
- **Session File Encryption (AES-256-GCM)**: Implemented cryptographic encryption-at-rest for Puppeteer session cookie files using Web Crypto PBKDF2 key derivation (100k iterations) and AES-256-GCM symmetric encryption.
- **Containerized Deployments**: Provided docker config files (`Dockerfile`, `docker-compose.yml`) and one-click shell auto-installers (`install.sh`).
- **Deno Testing Suite**: Unified unit/integration test suites matching EMVCo calculations and Honos routing API validations.
