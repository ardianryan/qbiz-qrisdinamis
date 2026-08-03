# QBiz Dynamic QRIS Gateway Hub

An in-house, dynamic QRIS payment middleware hub built to connect GoBiz merchant portals with custom Point-of-Sale (POS) systems, automate bank mutations, and dispatch HMAC-signed webhooks without third-party payment gateways.

> [!WARNING]
> **DISCLAIMER & WARRANTY LIMITATION (UNOFFICIAL API)**
> 
> This application/gateway hub is an **Unofficial API** that operates via browser automation scraping and XHR interception on merchant portals. Any risks of account suspension, access restriction on the GoBiz/GoFood portal, or other legal and financial implications arising from the use of this system are entirely the **user's own responsibility (as-is)**.
> 
> **COMPATIBILITY LIMITATION**: Currently, this payment gateway hub **only supports QRIS Gopay Merchant / GoFood Merchant**.

---

## 🚀 Key Features

* **Real-time GoBiz Sync**: Scrapes and intercepts new transaction notifications directly from the GoBiz/GoFood Merchant Portal via Puppeteer.
* **Dynamic QRIS Generation**: Translates static QRIS EMVCo payloads into dynamic QR codes embedded with transaction-specific unique suffixes.
* **Pre-fixed secure IDs**: Utilizes secure prefixed string identifiers to block ID enumeration and data scraping.
* **Separation of Duties (RBAC)**: Supports 5 user roles (`SUPER_ADMIN`, `ADMIN`, `REGIONAL_ADMIN`, `MERCHANT`, `MERCHANT_EMPLOYEE`) with query-level data isolation.
* **Multi-Tenant Credentials**: Each merchant owner user maintains their own API Key, webhook target URL, and HMAC-SHA256 signing secret.

---

## 🛠️ Tech Stack & Architecture

* **Runtime & Framework**: [Deno](https://deno.com/) with [Hono.js](https://hono.dev/)
* **Frontend SSR**: React JSX (`@hono/react-renderer`)
* **Styling**: Tailwind CSS (fully responsive, dark/light mode preference)
* **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/)
* **Worker & Automation**: Puppeteer Chromium scraping & XHR intercept worker
* **Compliance**: WCAG AA accessibility, fintech security standards.

---

## 🔑 Integration & Reference Documentation

For detailed information on how to integrate QBiz into your POS system, refer to:
* **API Documentation**: [APIQBIZ.md](APIQBIZ.md)
* **Security & Audit Policy**: [SECURITY.md](SECURITY.md)

### Official Client SDKs
* **Node.js/JavaScript SDK**: [sdk/qbiz-node.js](sdk/qbiz-node.js)
* **PHP SDK**: [sdk/qbiz.php](sdk/qbiz.php)

---

## 📦 Deployment & Installation Methods

Choose one of the following deployment paths for your production server:

### Method 1: One-Click Automated VPS Installer (Debian/Ubuntu/CentOS)
For standard VPS setups, run our automated script to install Docker, Docker Compose, configure persistent volumes, and generate secure credentials:
```bash
curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/install.sh -o install.sh
chmod +x install.sh
sudo ./install.sh
```

---

### Method 2: Manual Docker Compose Deployment

#### 1. Configure `.env` File
Create a `.env` file in the project root:
```env
# --- Server Config ---
PORT=8000
COOKIE_SECRET=use_a_secure_random_hex_string_32_chars
JWT_SECRET=use_another_secure_random_hex_string_32_chars

# --- PostgreSQL Database Config ---
DB_USER=ardianryan
DB_PASSWORD=your_secure_db_password
DB_NAME=qrispaymti
DATABASE_URL=postgres://ardianryan:your_secure_db_password@db:5432/qrispaymti
```

#### 2. Persistent Directories
Ensure directories for WhatsApp session states and uploaded assets/logos are created:
```bash
mkdir -p sessions static/uploads
chmod -R 775 sessions static/uploads
```

#### 3. Spin Up Stack
Start the containers in detached mode:
```bash
docker compose up -d --build
```
Your application will be accessible at `http://YOUR_SERVER_IP:8000`.

---

### Method 3: Portainer (Stack / Docker Compose)

To deploy using **Portainer Web UI**:
1. Log into Portainer, select your Local Environment, and go to **Stacks** > **Add Stack**.
2. Name your stack (e.g., `qbiz-qris-gateway`).
3. Paste the following DDL Compose configuration into the web editor:

```yaml
version: '3.8'

services:
  web:
    image: denoland/deno:debian
    container_name: qbiz-qris-app
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://${DB_USER:-ardianryan}:${DB_PASSWORD:-your_secure_db_password}@db:5432/${DB_NAME:-qrispaymti}
      - COOKIE_SECRET=${COOKIE_SECRET:-qbiz_cookie_signing_secret_key_2026}
      - JWT_SECRET=${JWT_SECRET:-qbiz_jwt_secret_key_2026}
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
      - PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    command: ["run", "-A", "--env", "main.tsx"]
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - /opt/qbiz/sessions:/app/sessions
      - /opt/qbiz/uploads:/app/static/uploads
    # Install chromium inside container automatically at startup
    entrypoint: >
      sh -c "apt-get update && apt-get install -y chromium fonts-freefont-ttf libxss1 --no-install-recommends && deno cache main.tsx && exec deno run -A --env main.tsx"

  db:
    image: postgres:15-alpine
    container_name: qbiz-qris-db
    restart: always
    environment:
      - POSTGRES_DB=${DB_NAME:-qrispaymti}
      - POSTGRES_USER=${DB_USER:-ardianryan}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-your_secure_db_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-ardianryan} -d ${DB_NAME:-qrispaymti}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```
4. Define Env variables under the **Environment Variables** section matching your secrets.
5. Click **Deploy the stack**.

---

### Method 4: aaPanel / Reverse Proxy VPS Deployment

**aaPanel** is a popular free host manager. Follow these steps to secure and reverse-proxy the QBiz application to port 80/443:

#### Step 1: Install Docker Manager
1. Log into your aaPanel dashboard.
2. Go to **App Store** on the left menu.
3. Search for **Docker Manager** and click **Install**.

#### Step 2: Configure Project & Docker Compose
1. Use aaPanel's **Files** manager to upload your project directory to `/www/wwwroot/qbiz-qris`.
2. Connect to your VPS via SSH and go to that directory:
   ```bash
   cd /www/wwwroot/qbiz-qris
   ```
3. Edit your `.env` settings and run:
   ```bash
   docker compose up -d --build
   ```

#### Step 3: Setup Website & Reverse Proxy in aaPanel
1. Go to **Website** > **Add Site** in aaPanel.
2. Enter your domain name (e.g., `qris.yourdomain.com`).
3. Under **Database**, select **Do not create** (since Postgres runs inside our Docker network).
4. Click **Submit**.

#### Step 4: Configure Let's Encrypt SSL
1. In the Website list, click the site domain or **SSL** next to it.
2. Select the **Let's Encrypt** tab.
3. Check your domain name, select file verification or DNS verification, and click **Apply**.
4. Enable **Force HTTPS** toggle.

#### Step 5: Setup Reverse Proxy
1. In the Site settings pop-up, click the **Reverse Proxy** tab on the left.
2. Click **Add Reverse Proxy**.
3. Fill in the parameters:
   * **Proxy Name**: `qbiz-proxy`
   * **Target URL**: `http://127.0.0.1:8000` (points to Hono app port)
   * **Sent Domain**: `$host`
4. Click **Submit**.

Your secure portal is now accessible at `https://qris.yourdomain.com` with fully managed Let's Encrypt SSL.

---

## 🔑 Default Seed Demo Accounts

On application startup, a default set of users are seeded into the database for quick evaluation of access controls.

| Role Name | Demo Email | Demo Password | Default API Key / Webhook |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@qbiz.com` | `SuperQBiz2026` | `qbiz_api_key_live_2026_w8a2b3d9x7c` |
| **Admin Operations** | `admin@qbiz.com` | `AdminQBiz2026` | `qbiz_api_key_live_2026_admin` |
| **Regional Admin** | `regional@qbiz.com` | `RegionalQBiz2026` | `qbiz_api_key_live_2026_regional` |
| **Merchant Owner** | `merchant@qbiz.com` | `MerchantQBiz2026` | `qbiz_api_key_live_2026_merchant` |
| **Cashier / Employee** | `karyawan@qbiz.com` | `EmployeeQBiz2026` | `qbiz_api_key_live_2026_karyawan` |
