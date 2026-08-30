# Merchant & Store Workspace Management 🏪

QBiz is built with multi-tenant workspace architecture, allowing you to manage multiple business branches, merchant franchises, or separate business entities in a single deployment.

---

## 🏬 Contextual Workspace Switcher

The top navigation bar features a contextual **Store Switcher**:
* **Real-Time Health Status**:
  - `🟢 Active Listener`: Headless scraper is authenticated and actively listening for mutations.
  - `🟡 OTP Syncing`: Waiting for 2FA OTP submission from WhatsApp.
  - `🔴 Session Dead`: Session expired or credentials invalid; re-authentication required.
* **Contextual Scoping**:
  Switching active store scopes your dashboard metrics, live transaction feeds, cashier users, and Developer Hub snippets without leaving the page.

---

## 🔄 Headless Mutation Scraper Setup

QBiz uses a headless Puppeteer browser fleet to monitor transactions from the merchant portal.

### Setup Steps:
1. Navigate to **Merchants** (`/merchants`).
2. Click **+ Add Merchant Store**.
3. Fill in the store name and static QRIS EMVCo string payload.
4. Enter the merchant portal login credentials (phone number or email).
5. Click **Connect & Start Listener**.
6. The system triggers a 2FA OTP challenge. Enter the OTP code sent to the merchant's registered WhatsApp line to complete the pairing.
7. The session cookie is encrypted on disk (`sessions/`) using AES-256-GCM and persists across container restarts.

---

## 👥 Cashier & Employee RBAC

You can invite cashiers and branch managers under **User Directory** (`/users`):
* Assign the role `MERCHANT_EMPLOYEE` and bind the user to a specific branch store.
* When logged in, employees are strictly restricted to the **Live Transaction Monitor** (`/transactions`) and cannot modify API keys, webhooks, or global system settings.
