# QBiz Gateway Hub - Easy Deployment Guide

<p align="center">
  <a href="https://railway.com/new/template?template=https://github.com/ardianryan/qbiz-qrisdinamis"><img src="https://railway.com/button.svg" alt="Deploy on Railway" height="32" /></a>
  &nbsp;
  <a href="https://render.com/deploy?repo=https://github.com/ardianryan/qbiz-qrisdinamis"><img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="32" /></a>
  &nbsp;
  <a href="https://hub.docker.com/r/ardianryan/qbiz-qrisdinamis"><img src="https://img.shields.io/badge/Docker_Hub-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Hub Image" height="32" /></a>
</p>

This guide covers step-by-step instructions for deploying QBiz Gateway Hub across all popular infrastructure environments:
- [1. One-Line Automatic VPS Installer (Recommended for Clean VPS)](#1-one-line-automatic-vps-installer)
- [2. Docker & Docker Compose (Standard)](#2-docker--docker-compose)
- [3. Portainer (Docker Stacks)](#3-portainer-stacks)
- [4. Coolify / Dokploy / CapRover (Self-Hosted PaaS)](#4-coolify--dokploy--caprover)
- [5. Railway / Render (Cloud PaaS)](#5-railway--render)
- [6. aaPanel (Nginx Reverse Proxy + Let's Encrypt SSL)](#6-aapanel-deployment)
- [7. Direct VPS Bare-Metal (Non-Docker with PM2 / Systemd)](#7-direct-vps-bare-metal-installation)

---

## 1. One-Line Automatic VPS Installer

If you are setting up a fresh Ubuntu, Debian, CentOS, AlmaLinux, or Rocky Linux VPS, run this single command via SSH:

```bash
curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/install.sh | sudo bash
```

**What the script does automatically:**
1. Installs Docker & Docker Compose plugin if not already installed.
2. Creates persistent directories (`sessions/` and `static/uploads/`).
3. Generates a secure `.env` file with cryptographically random secrets and passwords.
4. Pulls the latest prebuilt Docker image (`ardianryan/qbiz-qrisdinamis:latest`) and spins up the web gateway and PostgreSQL database.

---

## 2. Docker & Docker Compose

### Option A: Using Prebuilt Docker Hub Image (Fastest, Low Memory Usage)
1. Clone the repository or download `docker-compose.yml`:
   ```bash
   git clone https://github.com/ardianryan/qbiz-qrisdinamis.git
   cd qbiz-qrisdinamis
   ```
2. Copy the environment file and customize passwords:
   ```bash
   cp .env.example .env
   ```
3. Start the stack:
   ```bash
   docker compose up -d
   ```
4. Access the dashboard at `http://YOUR_SERVER_IP:8000`.

### Option B: Build From Source
```bash
docker compose up -d --build
```

---

## 3. Portainer (Stacks)

1. Log into your **Portainer Web UI**.
2. Navigate to **Stacks** > **Add Stack**.
3. Name your stack `qbiz-gateway`.
4. Paste the following Compose configuration in the Web Editor:

```yaml
version: '3.8'

services:
  web:
    image: ardianryan/qbiz-qrisdinamis:latest
    container_name: qbiz-qris-app
    restart: always
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://qbiz_user:your_secure_password_2026@db:5432/qrispaymti
      - COOKIE_SECRET=random_cookie_secret_2026_hex_value
      - JWT_SECRET=random_jwt_secret_2026_hex_value
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - qbiz_sessions:/app/sessions
      - qbiz_uploads:/app/static/uploads

  db:
    image: postgres:15-alpine
    container_name: qbiz-qris-db
    restart: always
    environment:
      - POSTGRES_DB=qrispaymti
      - POSTGRES_USER=qbiz_user
      - POSTGRES_PASSWORD=your_secure_password_2026
    ports:
      - "5432:5432"
    volumes:
      - qbiz_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qbiz_user -d qrispaymti"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  qbiz_sessions:
  qbiz_uploads:
  qbiz_postgres_data:
```
5. Click **Deploy the stack**.

---

## 4. Coolify / Dokploy / CapRover

QBiz Gateway Hub works natively on self-hosted PaaS solutions.

### Deploying on Coolify:
1. In Coolify, click **+ New Resource** > **Docker Compose**.
2. Connect your GitHub repository `ardianryan/qbiz-qrisdinamis` or select **Raw Compose**.
3. Paste the contents of `docker-compose.yml`.
4. In the Coolify environment variables section, specify your domain (e.g. `https://qris.yourdomain.com`).
5. Coolify will automatically configure Traefik / Caddy reverse proxy and issue automatic SSL certificates.
6. Click **Deploy**.

---

## 5. Railway / Render

### Deploying on Railway:
1. Click **New Project** > **Deploy from GitHub repo** and select `ardianryan/qbiz-qrisdinamis`.
2. Add a **PostgreSQL** database service in the same project.
3. In the QBiz service settings, add the following environment variables:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (automatic Railway binding)
   - `COOKIE_SECRET`: Generate a random 32-character string.
   - `JWT_SECRET`: Generate a random 32-character string.
   - `PORT`: `8000`
4. Railway automatically detects `railway.json` and builds via Dockerfile with full Chromium headless support.
5. Generate a public domain under **Settings** > **Networking** > **Generate Domain**.

---

## 6. aaPanel Deployment

aaPanel is a popular VPS management panel. Here is how to run QBiz behind aaPanel's Nginx reverse proxy with automated Let's Encrypt SSL:

### Step 1: Install Docker Manager in aaPanel
1. In aaPanel dashboard, navigate to **App Store**.
2. Search for **Docker Manager** and click **Install**.

### Step 2: Deploy QBiz Container
1. SSH into your VPS and navigate to `/www/wwwroot`:
   ```bash
   cd /www/wwwroot
   git clone https://github.com/ardianryan/qbiz-qrisdinamis.git
   cd qbiz-qrisdinamis
   cp .env.example .env
   # Edit .env with your desired database password
   docker compose up -d
   ```

### Step 3: Configure Domain & SSL in aaPanel
1. In aaPanel, go to **Website** > **Add Site**.
2. Enter your domain name (e.g., `qris.yourdomain.com`).
3. Set *Database* to **Do not create** (as Postgres runs in Docker).
4. Open the created site settings:
   - Navigate to the **SSL** tab > select **Let's Encrypt** > check your domain and click **Apply**.
   - Enable **Force HTTPS**.
   - Navigate to the **Reverse Proxy** tab > click **Add Reverse Proxy**:
     - **Proxy Name**: `qbiz-backend`
     - **Target URL**: `http://127.0.0.1:8000`
     - **Sent Domain**: `$host`
5. Click **Submit**. Your QBiz Gateway is now online with HTTPS!

---

## 7. Direct VPS Bare-Metal Installation

If you prefer to run directly on the host without Docker:

### Prerequisites (Ubuntu / Debian):
```bash
# 1. Install Deno
curl -fsSL https://deno.land/install.sh | sh
sudo mv ~/.deno/bin/deno /usr/local/bin/

# 2. Install Chromium dependencies for headless scraper
sudo apt-get update
sudo apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-freefont-ttf libxss1 postgresql postgresql-contrib

# 3. Setup PostgreSQL Database
sudo -u postgres psql -c "CREATE USER qbiz_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "CREATE DATABASE qrispaymti OWNER qbiz_user;"
```

### Running with Systemd:
1. Clone project and configure `.env`:
   ```bash
   cd /opt
   git clone https://github.com/ardianryan/qbiz-qrisdinamis.git
   cd qbiz-qrisdinamis
   cp .env.example .env
   # Set DATABASE_URL=postgres://qbiz_user:your_secure_password@localhost:5432/qrispaymti
   # Set PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
   ```
2. Build CSS & Run initial migrations:
   ```bash
   deno task build:css
   deno task db:migrate
   ```
3. Create systemd service `/etc/systemd/system/qbiz.service`:
   ```ini
   [Unit]
   Description=QBiz Gateway Hub Service
   After=network.target postgresql.service

   [Service]
   Type=simple
   User=root
   WorkingDirectory=/opt/qbiz-qrisdinamis
   ExecStart=/usr/local/bin/deno run -A --env main.tsx
   Restart=always
   RestartSec=5
   Environment=PORT=8000

   [Install]
   WantedBy=multi-user.target
   ```
4. Enable and start service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now qbiz
   ```

---

## 🔒 Security Best Practices for Production

1. **Firewall**: Only expose ports `80` (HTTP), `443` (HTTPS), and your SSH port (`22`). Do not expose Postgres port `5432` to the public internet unless required.
2. **Secrets**: Change `COOKIE_SECRET` and `JWT_SECRET` in `.env` before public launch.
3. **Backups**: Periodically back up the PostgreSQL database (`docker exec qbiz-qris-db pg_dump -U qbiz_user qrispaymti > backup.sql`).
