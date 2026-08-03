# QBiz Multi-QRIS Gateway Hub

> [!WARNING]
> **Active Development Notice**: This project is currently under active development and is **not considered stable**. APIs, schemas, and automation workers may change without notice. Use in production at your own risk.

An in-house, dynamic QRIS payment middleware hub built to connect GoBiz merchant portals with custom Point-of-Sale (POS) systems, automate bank mutations, and dispatch HMAC-signed webhooks without third-party payment gateways.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Hono.js on Deno Runtime
- **Frontend SSR**: React JSX (`@hono/react-renderer`)
- **Styling**: Tailwind CSS (fully responsive, dark/light mode auto-preference with no-flicker script)
- **Database**: PostgreSQL with Drizzle ORM
- **Automation Worker**: Puppeteer (Chromium browser automation & XHR network interception)
- **A11y Standard**: WCAG AA compliant (tap targets, contrast checkpoints, keyboard focus outlines, layout landmarks)

---

## 🚀 Getting Started

### 1. Environmental Setup
Create a `.env` file in the root directory (automatically loaded by Deno using `--env`):
```env
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<dbname>
WEBHOOK_SECRET=your_webhook_signing_secret_key
PORT=8000
```

### 2. Push Schema to Database
Initialize your PostgreSQL database tables (merchants, users, invoices, mutations) directly from Drizzle schema definitions:
```bash
deno run -A npm:drizzle-kit push --schema=db/schema.ts --dialect=postgresql --url=YOUR_DATABASE_URL
```

### 3. Compile Tailwind CSS Styles
Compile the utility classes and watch/compile in development:
```bash
# One-time build
deno task build:css

# Watch for edits
deno task watch:css
```

### 4. Run Server
Start Hono server in development mode (includes file watch auto-reload and env loading):
```bash
deno task dev
```
Open **`http://localhost:8000/`** in your browser.

---

## 🔑 Default Seed Demo Accounts

On application startup, a default set of users are seeded into the database for quick evaluation of access controls.

| Role Name | Demo Email | Demo Password | Scope / Page Visibility |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@qbiz.com` | `SuperQBiz2026` | Full access to Merchants, Transactions, and Developer Hub. |
| **Admin Operations** | `admin@qbiz.com` | `AdminQBiz2026` | Full management, add merchants, OTP whatsapp synchronization. |
| **Regional Admin** | `regional@qbiz.com` | `RegionalQBiz2026` | Restricted views; only manages merchants assigned to them. |
| **Merchant Owner** | `merchant@qbiz.com` | `MerchantQBiz2026` | Transactions view only; restricted to their single merchant store. |
| **Cashier / Employee** | `karyawan@qbiz.com` | `EmployeeQBiz2026` | View-only transactions log. Settings and actions are hidden. |

---

## 🛡️ Role-Based Access Control (RBAC) Policies

- **Merchants Manager (`/merchants`)**: Restricted to `SUPER_ADMIN`, `ADMIN`, and `REGIONAL_ADMIN`.
  - Regional Admins only see card tiles of stores they are explicitly assigned to.
- **Developer & API Hub (`/developer`)**: Restricted to `SUPER_ADMIN` and `ADMIN`.
- **User & Role Directory (`/users`)**: Restricted to `SUPER_ADMIN` and `ADMIN`. Allows creating, listing, and deleting users, assigning roles, and mapping users to merchant stores.
- **Live Transaction Monitor (`/transactions`)**: Accessible by all roles.
  - Merchants & Employees are restricted to transaction rows of their own store.
  - Regional Admins are restricted to transaction rows of stores they manage.
  - Admins and Super Admins see all logs.
