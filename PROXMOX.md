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
| **RAM** | 2048 MB (2 GB) | Minimal memory for headless Chromium + PostgreSQL |
| **Disk Storage** | 10 GB | Sufficient for OS, PostgreSQL database, and cache |
| **Service Port** | `8000` | HTTP Web Dashboard and Webhook API port |

---

## 🛠️ Automated Setup Steps

The helper script handles the entire lifecycle automatically:

1. **PostgreSQL Server**: Installs and enables a dedicated local PostgreSQL database (`qbiz`) and user (`qbiz`) with a cryptographically secure random password.
2. **Headless Chromium & Graphic Dependencies**: Installs Chromium and required system libraries (`libnss3`, `libatk`, `libcups2`, `libdrm2`, `libxkbcommon0`, fonts) for receipt generation and merchant portal scraping.
3. **Deno Runtime**: Downloads and provisions the latest stable Deno binary to `/usr/local/bin/deno`.
4. **QBiz Source Code**: Clones the repository to `/opt/qbiz`.
5. **Secure Cryptographic Secrets**: Generates 256-bit random hex values for `COOKIE_SECRET` and `JWT_SECRET` in `/opt/qbiz/.env`.
6. **Systemd Service**: Configures, enables, and starts `/etc/systemd/system/qbiz.service` to run continuously with auto-restart on failure or host reboot.

---

## 🌐 Accessing the Dashboard

Once the installation finishes, the LXC container's assigned IP address will be displayed in your Proxmox terminal:

```text
http://<CONTAINER_IP>:8000
```

Open this address in any modern web browser to access the QBiz Gateway Hub management dashboard.

---

## 🔄 Updates & Maintenance

### Method 1: Via Proxmox VE Node Shell
Re-run the helper script on your Proxmox VE host shell. The script detects existing QBiz containers and offers an automatic update routine:

```bash
bash -c "$(wget -qLO - https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"
```

### Method 2: Inside the LXC Container Console
Open the LXC container console and execute:

```bash
systemctl stop qbiz
cd /opt/qbiz
git pull
deno cache main.tsx
systemctl start qbiz
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
