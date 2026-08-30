# Changelog

All notable changes to the **QBiz Gateway Hub** project will be documented in this file. The versioning scheme follows [Semantic Versioning (SemVer)](https://semver.org/).

## [1.1.0-beta] - 2026-08-30

### Added
- **Contextual Multi-Merchant Workspace Switcher**:
  - Global Top Navigation Store Switcher allowing users to seamlessly switch active merchant store workspaces (similar to social media account switchers and multi-store SaaS).
  - Contextual Scoping across all application views: Dashboard statistics, live transaction feeds, QRIS settings, and Developer API SDK snippets automatically scope to the selected store.
  - Store search filter and quick-access status badges (`Active Listener`, `OTP Syncing`, `Session Dead`).
  - Active workspace session persistence via signed secure cookies (`POST /api/v1/workspaces/switch`).
- **Multi-Channel Store Notifications (Telegram, Discord, WhatsApp GOWA)**:
  - **Telegram Bot Channel**: Real-time payment success delivery via Telegram Bot API (`/sendMessage`) to private chats or merchant staff groups.
  - **Discord Webhook Channel**: Rich Embed status cards with customizable color badges, total amount, order ID, and transaction breakdown.
  - **WhatsApp API (GOWA by Aldinokemal)**: Native integration with Go WhatsApp HTTP API gateway (`/send/message`) with support for No Auth, Bearer Token, and Basic Auth.
  - **Customizable Message Templates**: Support for dynamic template interpolation (`{merchant_name}`, `{order_id}`, `{amount_formatted}`, `{customer_name}`, `{paid_at}`).
  - **Interactive In-Dashboard Testing**: 1-click test button per channel with live feedback status banners.
  - **Asynchronous Non-Blocking Dispatch**: Background notification delivery using `Promise.allSettled` alongside POS webhooks.
- **Database Schema & Migrations**:
  - Added `merchant_notifications` table to persist per-store channel credentials with cascading cleanup on store deletion.
  - Generated and executed Drizzle migration `0002_serious_lady_bullseye.sql`.
- **Expanded Multi-Language Client SDKs**:
  - 🦫 **Go (Golang)** ([`sdk/qbiz.go`](file:///Users/ardianryan/Documents/qrispaymti/sdk/qbiz.go)): Idiomatic Go client with zero external dependencies (`net/http`, `crypto/hmac`).
  - 🔷 **TypeScript** ([`sdk/qbiz.ts`](file:///Users/ardianryan/Documents/qrispaymti/sdk/qbiz.ts)): Fully typed client with Web Crypto API and rich interfaces for Next.js, Nuxt, SvelteKit, NestJS, Bun, and Deno.
  - 🎯 **Dart / Flutter** ([`sdk/qbiz.dart`](file:///Users/ardianryan/Documents/qrispaymti/sdk/qbiz.dart)): Client for Flutter mobile POS and Android POS terminals.
  - ☕ **Java** ([`sdk/QBizClient.java`](file:///Users/ardianryan/Documents/qrispaymti/sdk/QBizClient.java)): Java 11+ `HttpClient` client with HMAC-SHA256 verification.
  - 💻 **Developer Hub Tabs**: Added tab switchers for Go, TypeScript, and PHP in the Developer Hub dashboard.

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
