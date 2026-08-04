# Changelog

All notable changes to the **QBiz Gateway Hub** project will be documented in this file. The versioning scheme follows [Semantic Versioning (SemVer)](https://semver.org/).

---

## [1.0.0] - 2026-08-04

### Added
- **Initial Release of QBiz Gateway Hub**
- **Dynamic QRIS Generation**: Implemented EMVCo parser, suffix calculator (+Rp 1 to +Rp 999), and CCITT CRC-16 re-calculator to enable dynamic QR code generation.
- **GoBiz Interceptor Workers**: Headless Puppeteer Chromium worker for real-time GoBiz transaction scraping, XHR interception, and session authentication.
- **WhatsApp OTP Integration**: Direct OTP forwarding to merchant's registered WhatsApp line for secure portal authentication.
- **HMAC Webhook Dispatcher**: Signature validation payloads (HMAC-SHA256) sent immediately to POS clients upon payment detection.
- **Admin Dashboard Console**: Multi-tenant RBAC panel supporting Super Admin, Operations Admin, Regional Admin, Merchant Owner, and cashier/employee scopes.
- **Interactive Scalar API Docs**: Beautiful interactive developer documentation served at `/docs` backed by an OpenAPI 3.0 specification (`static/openapi.json`).
- **LLM Indexing Support**: Created root specifications `llms.txt` and `llms-full.txt` alongside meta link declarations for AI agent discovery.
- **Geographic & SEO Target Metadata**: Integrated Indonesia regional GEO meta codes and search engine indexing boundaries via `robots.txt` and meta indexing tags.
- **Containerized Deployments**: Provided docker config files (`Dockerfile`, `docker-compose.yml`) and one-click shell auto-installers (`install.sh`).
- **Deno Testing Suite**: Unified unit/integration test suites matching EMVCo calculations and Honos routing API validations.
