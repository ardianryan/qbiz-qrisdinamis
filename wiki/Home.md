# Welcome to the QBiz Gateway Hub Wiki ⚡

**QBiz** is a modern, self-hosted dynamic QRIS payment gateway hub designed as an in-house middleware for businesses, retail stores, and Point-of-Sale (POS) systems. It bridges static QRIS Food Merchant portals into dynamic, multi-tenant payment gateways with real-time settlement interception, multi-channel alerts, and signed webhook delivery without third-party fees.

---

## 🧭 Documentation Index & Sitemap

```
├── 📖 Overview & Architecture
│   ├── [Architecture & OSI Layers](Architecture-&-OSI-Layers)
│   └── [Security & Compliance Standards](Security-&-Compliance)
│
├── 🚀 Operations & Infrastructure
│   ├── [Comprehensive Deployment Guide](Deployment-Guide)
│   ├── [Merchant & Store Workspace Management](Merchant-&-Store-Management)
│   └── [Multi-Channel Notifications Setup](Notifications-Setup)
│
├── 💻 Developer Hub & SDKs
│   ├── [REST API & Webhook Reference](Developer-API-Reference)
│   └── [Multi-Language Client SDKs Guide](SDK-Integration-Guide)
│
└── 🛠️ Support & Maintenance
    └── [FAQ & Troubleshooting](FAQ-&-Troubleshooting)
```

---

## 🌟 Key Capabilities at a Glance

1. **💸 Dynamic QRIS & Unique Suffix Engine**
   - Parses EMVCo static QR payloads and injects dynamic invoice amounts with minor unique codes (`Rp 1 - Rp 999`) to prevent transaction collisions.
   - Computes CRC-16-CCITT checksum on-the-fly for scan compliance.

2. **🏪 Contextual Multi-Tenant Store Workspace**
   - Instant 1-click store switching in dashboard and API scopes.
   - Per-store transaction isolation, API keys, and notification routes.

3. **🔄 Headless Mutation Interception**
   - Background Chromium instance listening directly to merchant mutation feeds.
   - Relays 2-factor OTP verification requests straight to the store owner's WhatsApp line.

4. **⚡ Enterprise Multi-Webhooks per Store**
   - Dedicated HMAC-SHA256 signature verification (`X-QBiz-Signature`).
   - Granular event triggers (`payment.success`, `invoice.created`, `invoice.expired`).

5. **🔔 Multi-Channel Instant Alerts**
   - Instant confirmation dispatched to Telegram Bots, Discord Webhooks, and WhatsApp Multi-Device (GOWA API).

6. **🔌 Official SDKs Across 8 Languages**
   - Ready-to-use client libraries for Go, TypeScript, Node.js, Dart/Flutter, Java, PHP, Python, and Rust.

---

## 🚀 Quick Links
- **[Full Deployment Guide](Deployment-Guide)**: Deploy via Docker, Portainer, Coolify, Railway, aaPanel, or VPS script.
- **[REST API Docs](Developer-API-Reference)**: Endpoints, headers, payload examples, and webhook structures.
- **[Client SDKs](SDK-Integration-Guide)**: Download and integrate SDKs into your app.
