# FAQ & Troubleshooting 🛠️

Solutions to frequently encountered issues when deploying and maintaining QBiz Gateway Hub.

---

## ❓ Frequently Asked Questions

### 1. Why does Chromium/Puppeteer crash with Out-Of-Memory (OOM)?
* **Cause**: Headless Chromium requires sufficient memory to run browser instances. On 1 GB RAM VPS servers, concurrent browser processes may exceed physical memory.
* **Fix**: Enable virtual Swap memory on your host server (at least 1 GB - 2 GB):
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

### 2. How do I backup the database?
* Run `pg_dump` from inside the Docker database container:
  ```bash
  docker exec qbiz-qris-db pg_dump -U qbiz_user qrispaymti > qbiz_backup_$(date +%F).sql
  ```

### 3. How do I update to the latest release?
* Pull the new image and recreate containers:
  ```bash
  docker compose pull
  docker compose up -d
  ```

### 4. Why are dynamic QR codes scanning as static in mobile banking apps?
* Ensure that the **Static QRIS EMVCo payload** registered in `/merchants` is an official EMVCo format string (starts with `00020101...`). QBiz will automatically parse Tag 54 (Transaction Amount) and recompute the CRC-16 checksum.
