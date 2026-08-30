# Comprehensive Deployment Guide 🚀

QBiz Gateway Hub supports multiple deployment targets, ranging from 1-line automated VPS installers to self-hosted PaaS solutions and cloud platforms.

---

## ⚡ 1. One-Line Automated VPS Installer (Fastest)

For fresh Ubuntu, Debian, CentOS, AlmaLinux, or Rocky Linux servers:

```bash
curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/install.sh | sudo bash
```

The installer automatically installs Docker & Docker Compose, provisions persistent storage directories, generates cryptographically random `.env` secrets, pulls the official image, and starts the container stack.

---

## 🐳 2. Docker & Docker Compose

### Prebuilt Docker Hub Image
```bash
git clone https://github.com/ardianryan/qbiz-qrisdinamis.git
cd qbiz-qrisdinamis
cp .env.example .env
# Edit .env with your secrets and database configuration
docker compose up -d
```

### Build From Source
```bash
docker compose up -d --build
```

---

## 🚢 3. Portainer (Docker Stacks)

1. Open Portainer > **Stacks** > **Add Stack**.
2. Set stack name to `qbiz-gateway`.
3. Paste the Compose configuration:

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
4. Click **Deploy the stack**.

---

## 🌐 4. Coolify / Dokploy / CapRover (Self-Hosted PaaS)

1. In Coolify, click **+ New Resource** > **Docker Compose**.
2. Select **Raw Compose** or link repository `ardianryan/qbiz-qrisdinamis`.
3. Configure your custom domain (e.g., `https://qris.yourdomain.com`). Coolify will automatically configure Traefik reverse proxy and Let's Encrypt SSL.
4. Click **Deploy**.

---

## ☁️ 5. Railway & Render (Cloud PaaS)

* **Railway**: Click the [Deploy on Railway](https://railway.com/new/template?template=https://github.com/ardianryan/qbiz-qrisdinamis) button. Railway will read `railway.json`, build the Dockerfile, and connect the PostgreSQL plugin.
* **Render**: Click the [Deploy to Render](https://render.com/deploy?repo=https://github.com/ardianryan/qbiz-qrisdinamis) button. Render will deploy the web service and PostgreSQL database defined in `render.yaml`.

---

## 🎛️ 6. aaPanel (Nginx Reverse Proxy + SSL Auto-Manage)

1. Install **Docker Manager** from the aaPanel App Store.
2. Clone repository and run `docker compose up -d` in `/www/wwwroot/qbiz-qrisdinamis`.
3. In aaPanel, create a Website for your domain, enable **Let's Encrypt SSL** with **Force HTTPS**, and add a **Reverse Proxy** pointing to `http://127.0.0.1:8000`.

---

## 💻 7. Direct VPS Bare-Metal (Non-Docker)

1. Install Deno & Chromium:
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   sudo mv ~/.deno/bin/deno /usr/local/bin/
   sudo apt-get install -y chromium postgresql postgresql-contrib
   ```
2. Setup systemd service `/etc/systemd/system/qbiz.service`:
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
3. Enable and start:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now qbiz
   ```
