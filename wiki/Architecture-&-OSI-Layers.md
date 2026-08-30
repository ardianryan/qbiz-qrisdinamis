# Architecture & OSI Layer Compliance 🏗️

This document describes the high-level architecture of QBiz Gateway Hub, the transaction processing lifecycle, and its adherence to the **7-Layer OSI Networking Model**.

---

## 🏛️ High-Level System Architecture

```
                               ┌────────────────────────┐
                               │   Customer / POS App   │
                               └──────────┬─────────────┘
                                          │ 1. POST /api/v1/invoices
                                          ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        QBIZ GATEWAY HUB (Hono.js)                      │
│                                                                        │
│  ┌────────────────────┐   ┌──────────────────────┐   ┌──────────────┐  │
│  │ Dynamic QRIS Engine│   │  Multi-Tenant RBAC   │   │ Webhook &    │  │
│  │ (EMVCo + CRC16)    │   │  (Store Contexts)    │   │ Notif Queue  │  │
│  └────────────────────┘   └──────────────────────┘   └──────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Headless Puppeteer Scraper Fleet                 │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ 2. Mutation Polling / XHR Intercept
                                      ▼
                        ┌───────────────────────────┐
                        │ Merchant Portal (QRIS)    │
                        └───────────────────────────┘
```

---

## 🔄 End-to-End Payment Flow

1. **Invoice Creation**:
   The POS or billing system invokes `POST /api/v1/invoices` with `order_id`, `amount`, and `merchant_id`.
2. **Dynamic QR Generation**:
   QBiz parses the static EMVCo QRIS string of the merchant, injects the unique suffix (`amount + suffix`), re-computes the CRC-16 checksum, and saves the invoice in PostgreSQL.
3. **Customer Checkout**:
   The customer is presented with the dynamic QR code (via Hosted Checkout Page `/pay/:id` or raw QRIS string inside custom apps).
4. **Payment Interception**:
   The headless Puppeteer listener detects settlement from the merchant portal mutations in real time.
5. **Multi-Channel Dispatch**:
   QBiz triggers parallel notifications to Telegram, Discord, and WhatsApp, while delivering an HMAC-SHA256 signed webhook to the merchant POS backend.

---

## 🌐 OSI 7-Layer Model Mapping

| Layer | OSI Name | Function & Implementation in QBiz |
| :--- | :--- | :--- |
| **Layer 7** | **Application** | • HTTP REST endpoints (`/api/v1/invoices`, `/api/v1/merchants`).<br>• EMVCo QRIS protocol specification encoding & decoding.<br>• W3C Progressive Web App manifest & service worker offline caching.<br>• OpenAPI 3.1 & Scalar interactive API documentation. |
| **Layer 6** | **Presentation** | • Symmetric data encryption at rest (**AES-256-GCM** with 12-byte IV).<br>• Key derivation via **PBKDF2-SHA256** (100,000 rounds).<br>• JSON serialization & UTF-8 character encoding.<br>• QR Matrix bitmap rasterization. |
| **Layer 5** | **Session** | • Secure signed HTTP cookies (`HttpOnly`, `SameSite=Lax`, `Secure`).<br>• Configurable session timeouts (`sessionTimeoutMinutes`).<br>• Persistent Puppeteer browser session management with health check heartbeats. |
| **Layer 4** | **Transport** | • TCP port binding on `8000` (Web) and `5432` (PostgreSQL).<br>• End-to-end TLS/SSL termination via reverse proxies (Nginx / Caddy / Traefik).<br>• Graceful shutdown handling (`SIGINT`, `SIGTERM`) for connection draining. |
| **Layer 3** | **Network** | • **SSRF Defense Guard** (`isValidOutboundUrl`): Blocks AWS/GCP/Azure cloud metadata IPs (`169.254.169.254`), private RFC-1918 subnets, and non-HTTP protocols.<br>• Dual-stack IPv4 & IPv6 support. |
| **Layer 2** | **Data Link** | • Internal container network isolation via **Docker Bridge Network** (`bridge` driver). |
| **Layer 1** | **Physical** | • Compatible across all physical hardware, Bare-Metal Dedicated Servers, VPS (KVM/Xen), and Cloud VM instances. |
