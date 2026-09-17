# Proxmox VE LXC Installation Guide (Helper Script)

QBiz Gateway Hub provides an automated installation script for **Proxmox VE (PVE)** based on an unprivileged LXC Container running Debian 12 (Bookworm 64-bit). The scripts follow the architecture and conventions established by [Proxmox VE Community-Scripts](https://github.com/community-scripts/ProxmoxVE).

---

## ⚡ Quick Start (One-Liner)

Run the following command directly in your **Proxmox VE Node Shell** (not inside an existing VM or container):

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"
```

*Or using `curl`:*

```bash
bash -c "$(curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"
```

---

## 📋 LXC Container Specifications

The installer presents an interactive whiptail wizard (Default / Advanced Settings).

| Parameter | Default Value | Notes |
| :--- | :--- | :--- |
| **Container Type** | Unprivileged LXC | Secure and isolated namespace |
| **Operating System** | Debian 12 (Bookworm) | Clean stable base distribution |
| **CPU Cores** | 2 vCPU | Required for Puppeteer headless Chrome & Deno |
| **RAM** | 2048 MB (2 GB) | For Local DB (can be reduced to 1024 MB if using External DB / Supabase) |
| **Disk Storage** | 10 GB | Sufficient for OS, dependencies, and local data |
| **Service Port** | `8000` | HTTP Web Dashboard and Webhook API port |

---

## 🗄️ Database Backend Selection

During installation, the wizard prompts you to select your preferred database architecture:

1. **Local PostgreSQL (All-in-One)**:
   - Automatically installs PostgreSQL 15/16 inside the LXC container.
   - Automatically provisions a dedicated `qbiz` database and user with a secure random password.
   - Perfect for homelabs or standalone deployments without external infrastructure.

2. **External PostgreSQL (Supabase, Neon, Cloud, or Remote VM)**:
   - Completely skips local PostgreSQL installation, saving **500 MB to 1 GB of RAM** in Proxmox.
   - Prompts for your PostgreSQL Connection URI (e.g. Supabase pooler URL).
   - Allows leaving it blank to configure manually later in `/opt/qbiz/.env`.

---

## 🛠️ Automated Setup Steps

The helper script handles the entire lifecycle automatically:

1. **Database Provisioning**: Configures local PostgreSQL or binds to your remote connection URI based on your selection.
2. **Headless Chromium & Graphic Dependencies**: Installs Chromium and required system libraries (`libnss3`, `libatk`, `libcups2`, `libdrm2`, `libxkbcommon0`, fonts) for receipt generation and merchant portal scraping.
3. **Deno Runtime**: Downloads and provisions the latest stable Deno binary to `/usr/local/bin/deno`.
4. **QBiz Source Code**: Clones the repository to `/opt/qbiz`.
5. **Secure Cryptographic Secrets**: Generates 256-bit random hex values for `COOKIE_SECRET` and `JWT_SECRET` in `/opt/qbiz/.env`.
6. **Automatic Schema Migrations**: Runs `deno task db:migrate` to guarantee database schema readiness.
7. **Systemd Service**: Configures, enables, and starts `/etc/systemd/system/qbiz.service` to run continuously with auto-restart on failure or host reboot.
8. **In-Container Update Manager**: Symlinks `/usr/local/bin/update` to the interactive update utility.

---

## 🌐 Accessing the Dashboard

Once the installation finishes, the LXC container's assigned IP address will be displayed in your Proxmox terminal:

```text
http://<CONTAINER_IP>:8000
```

Open this address in any modern web browser to access the QBiz Gateway Hub management dashboard.

---

## 🔄 Updates & Maintenance

### Method 1: Inside the LXC Container Console (Recommended)
Simply open the LXC container console (or SSH into the container) and type:

```bash
update
```

The interactive updater will:
1. Fetch the latest release and commit hashes from GitHub.
2. Compare them against your currently installed version (`v1.2.1`).
3. Display a confirmation prompt with version details:
   ```text
   === QBiz Gateway Hub - Update Manager ===

   Checking for latest updates from GitHub...
     Current Installed Version : v1.2.1 (8ef786b)
     Latest GitHub Release     : v1.2.2 (abc1234)

   ⚡ A new update is available!
   Do you want to proceed with the update now? [y/N]:
   ```
4. Upon confirmation (`y`), it safely stops the service, pulls the latest code, refreshes Deno dependencies, restarts `qbiz.service`, and verifies service health.

### Method 2: Via Proxmox VE Node Shell
You can also re-run the helper script directly from your Proxmox VE host shell. It detects the existing container and invokes the automated upgrade sequence:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"
```

---

## 🔍 Service Management & Troubleshooting

Run these commands inside the LXC container:

- **Check Service Status**:
  ```bash
  systemctl status qbiz
  ```

- **Inspect Live Application Logs**:
  ```bash
  journalctl -u qbiz -f
  ```

- **Restart the Service**:
  ```bash
  systemctl restart qbiz
  ```

- **View or Edit Environment Variables**:
  ```bash
  nano /opt/qbiz/.env
  ```
