# aaPanel & Portainer Advanced Deployment Guide

This guide describes how to deploy the QBiz Gateway Hub in containerized host managers.

---

## 1. Portainer (Stack / Docker Compose)

To deploy using the **Portainer Web UI**:
1. Log into your Portainer dashboard.
2. Select your environment, then go to **Stacks** > **Add Stack**.
3. Name your stack (e.g., `qbiz-gateway`).
4. Paste the following Compose configuration into the web editor:

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
      - DATABASE_URL=postgres://${DB_USER:-ardianryan}:${DB_PASSWORD:-your_secure_db_password}@db:5432/${DB_NAME:-qrispaymti}
      - COOKIE_SECRET=${COOKIE_SECRET:-qbiz_cookie_signing_secret_key_2026}
      - JWT_SECRET=${JWT_SECRET:-qbiz_jwt_secret_key_2026}
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - /opt/qbiz/sessions:/app/sessions
      - /opt/qbiz/uploads:/app/static/uploads

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
5. Click **Deploy the stack**.

---

## 2. aaPanel (Reverse Proxy & SSL Auto-Manage)

aaPanel manages websites, certificates, and proxy configurations.

### Step 1: Install Docker Manager
1. In aaPanel, go to **App Store** on the left menu.
2. Search for **Docker Manager** and click **Install**.

### Step 2: Run Stack via SSH
1. Upload the project folder to `/www/wwwroot/qbiz-qris`.
2. Connect to your VPS via SSH and run:
   ```bash
   cd /www/wwwroot/qbiz-qris
   docker compose up -d --build
   ```

### Step 3: Add Site & Setup Reverse Proxy
1. In aaPanel, go to **Website** > **Add Site**.
2. Enter your domain (e.g., `qris.yourdomain.com`). Set *Database* to **Do not create**.
3. Go to the site settings > **SSL** tab > Apply for **Let's Encrypt** SSL and toggle **Force HTTPS**.
4. Go to **Reverse Proxy** tab > **Add Reverse Proxy**:
   - **Proxy Name**: `qbiz-proxy`
   - **Target URL**: `http://127.0.0.1:8000`
   - **Sent Domain**: `$host`
5. Click **Submit**.
