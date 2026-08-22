#!/usr/bin/env bash

# QBiz QRIS Dinamis - One-Click Docker installer for VPS
# Works on Debian, Ubuntu, CentOS, AlmaLinux, Rocky Linux.

set -e

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# --- Banner ---
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}        QBIZ QRIS DINAMIS - VPS EASY INSTALLER      ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo -e "This script will check/install Docker, configure your environment,"
echo -e "and spin up the QBiz QRIS stack (app + database) automatically.\n"

# --- Root Check ---
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Error: Please run this script as root (sudo).${NC}"
  exit 1
fi

# --- 1. Detect Package Manager & OS ---
if [ -f /etc/debian_version ]; then
  OS="debian"
  PKG_MANAGER="apt-get"
elif [ -f /etc/redhat-release ]; then
  OS="redhat"
  PKG_MANAGER="yum"
else
  echo -e "${YELLOW}Warning: OS not explicitly recognized. Attempting general install...${NC}"
  OS="unknown"
  PKG_MANAGER="apt-get"
fi

# --- Helper: Check command exists ---
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# --- 2. Install Docker ---
if command_exists docker; then
  echo -e "${GREEN}[✔] Docker is already installed.${NC}"
else
  echo -e "${YELLOW}[i] Installing Docker...${NC}"
  if [ "$OS" = "debian" ]; then
    $PKG_MANAGER update -y
    $PKG_MANAGER install -y curl ca-certificates gnupg lsb-release
  fi
  
  # Official Docker installation script
  curl -fsSL https://get.docker.com | sh
  
  # Start and enable Docker
  systemctl start docker
  systemctl enable docker
  echo -e "${GREEN}[✔] Docker installed and started successfully.${NC}"
fi

# --- 3. Install Docker Compose ---
if docker compose version >/dev/null 2>&1; then
  echo -e "${GREEN}[✔] Docker Compose (v2 CLI plugin) is already installed.${NC}"
  COMPOSE_CMD="docker compose"
elif command_exists docker-compose; then
  echo -e "${GREEN}[✔] Docker Compose (v1 legacy binary) is already installed.${NC}"
  COMPOSE_CMD="docker-compose"
else
  echo -e "${YELLOW}[i] Installing Docker Compose plugin...${NC}"
  if [ "$OS" = "debian" ]; then
    $PKG_MANAGER update -y
    $PKG_MANAGER install -y docker-compose-plugin
    COMPOSE_CMD="docker compose"
  else
    # Fallback legacy binary download
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    COMPOSE_CMD="docker-compose"
  fi
  echo -e "${GREEN}[✔] Docker Compose installed successfully.${NC}"
fi

# --- 4. Setup Directories & Permissions ---
echo -e "${BLUE}[i] Configuring persistent directories...${NC}"
mkdir -p sessions static/uploads
chmod -R 775 sessions static/uploads
echo -e "${GREEN}[✔] Directories configured.${NC}"

# --- 5. Generate .env File ---
if [ -f .env ]; then
  echo -e "${GREEN}[✔] .env file already exists. Skipping creation.${NC}"
else
  echo -e "${YELLOW}[i] Generating .env configuration...${NC}"
  
  # Generate secure random keys
  COOKIE_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "qbiz_cookie_secret_$(date +%s)")
  JWT_SECRET=$(openssl rand -hex 16 2>/dev/null || echo "qbiz_jwt_secret_$(date +%s)")
  DB_PASSWORD=$(openssl rand -hex 12 2>/dev/null || echo "QBizPassw0rd2026")
  
  cat <<EOF > .env
# --- Server Config ---
PORT=8000
COOKIE_SECRET=$COOKIE_SECRET
JWT_SECRET=$JWT_SECRET

# --- PostgreSQL Database Config ---
DB_USER=qbiz_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=qrispaymti
DATABASE_URL=postgres://qbiz_user:$DB_PASSWORD@db:5432/qrispaymti
EOF
  echo -e "${GREEN}[✔] .env file generated with secure credentials.${NC}"
fi

# --- 6. Build and Spin Up Containers ---
echo -e "\n"
read -p "Do you want to start the QBiz QRIS Docker stack now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}[i] Initializing Docker containers...${NC}"
  $COMPOSE_CMD up -d --build
  
  echo -e "\n${GREEN}====================================================${NC}"
  echo -e "${GREEN}   QBIZ QRIS DINAMIS STACK DEPLOYED SUCCESSFULLY!  ${NC}"
  echo -e "${GREEN}====================================================${NC}"
  echo -e "Web service is running on: ${YELLOW}http://localhost:8000${NC}"
  echo -e "Postgres database exposed on port: ${YELLOW}5432${NC}"
  echo -e "\nUseful Commands:"
  echo -e " - View logs:        ${BLUE}$COMPOSE_CMD logs -f${NC}"
  echo -e " - Stop containers:  ${BLUE}$COMPOSE_CMD down${NC}"
  echo -e " - Start containers: ${BLUE}$COMPOSE_CMD up -d${NC}"
  echo -e "====================================================\n"
else
  echo -e "\n${YELLOW}[i] Installer finished. You can start the stack manually later using:${NC}"
  echo -e "    ${BLUE}$COMPOSE_CMD up -d --build${NC}\n"
fi
