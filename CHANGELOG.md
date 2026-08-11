# Changelog

All notable changes to the **QBiz Gateway Hub** project will be documented in this file. The versioning scheme follows [Semantic Versioning (SemVer)](https://semver.org/).

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
- **GoBiz Interceptor Workers**: Headless Puppeteer Chromium worker for real-time GoBiz transaction scraping, XHR interception, and session authentication.
- **WhatsApp OTP Integration**: Direct OTP forwarding to merchant's registered WhatsApp line for secure portal authentication.
- **HMAC Webhook Dispatcher**: Signature validation payloads (HMAC-SHA256) sent immediately to POS clients upon payment detection.
- **Admin Dashboard Console**: Multi-tenant RBAC panel supporting Super Admin, Operations Admin, Regional Admin, Merchant Owner, and cashier/employee scopes.
- **Interactive Scalar API Docs**: Beautiful interactive developer documentation served at `/docs` backed by an OpenAPI 3.0 specification (`static/openapi.json`).
- **LLM Indexing Support**: Created root specifications `llms.txt` and `llms-full.txt` alongside meta link declarations for AI agent discovery.
- **Geographic & SEO Target Metadata**: Integrated Indonesia regional GEO meta codes and search engine indexing boundaries via `robots.txt` and meta indexing tags.
- **Session File Encryption (AES-256-GCM)**: Implemented cryptographic encryption-at-rest for Puppeteer session cookie files using Web Crypto PBKDF2 key derivation (100k iterations) and AES-256-GCM symmetric encryption.
- **Containerized Deployments**: Provided docker config files (`Dockerfile`, `docker-compose.yml`) and one-click shell auto-installers (`install.sh`).
- **Deno Testing Suite**: Unified unit/integration test suites matching EMVCo calculations and Honos routing API validations.
