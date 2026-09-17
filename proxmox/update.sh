#!/usr/bin/env bash

# Copyright (c) 2024-2026 QBiz Contributors
# License: MIT
# Source: https://github.com/ardianryan/qbiz-qrisdinamis
# Proxmox VE LXC Update Helper for QBiz Gateway Hub

set -e

# Color definitions
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
RD=$(echo "\033[01;31m")
GN=$(echo "\033[1;92m")
CL=$(echo "\033[m")

APP_DIR="/opt/qbiz"

# Ensure script is running as root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RD}Error: This script must be run as root.${CL}"
    exit 1
fi

if [ ! -d "$APP_DIR" ]; then
    echo -e "${RD}Error: No QBiz installation found at ${APP_DIR}.${CL}"
    exit 1
fi

echo -e "${BL}=== QBiz Gateway Hub - Update Manager ===${CL}\n"

cd "$APP_DIR"

# Get current version and commit hash
CURRENT_VER=$(grep '"version"' package.json 2>/dev/null | head -n1 | cut -d '"' -f 4 || echo "unknown")
CURRENT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "Checking for latest updates from GitHub..."
git fetch --tags origin main >/dev/null 2>&1

REMOTE_HASH=$(git rev-parse --short origin/main 2>/dev/null || echo "unknown")
LATEST_TAG=$(git describe --tags "$(git rev-list --tags --max-count=1)" 2>/dev/null || echo "")

echo -e "  Current Installed Version : ${YW}v${CURRENT_VER}${CL} (${CURRENT_HASH})"
if [ -n "$LATEST_TAG" ]; then
    echo -e "  Latest GitHub Release     : ${GN}${LATEST_TAG}${CL} (${REMOTE_HASH})"
else
    echo -e "  Latest GitHub Commit      : ${GN}${REMOTE_HASH}${CL}"
fi
echo ""

# Check if already up to date
AUTO_CONFIRM=false
for arg in "$@"; do
    if [ "$arg" == "-y" ] || [ "$arg" == "--yes" ]; then
        AUTO_CONFIRM=true
    fi
done

if [ "$CURRENT_HASH" == "$REMOTE_HASH" ]; then
    echo -e "${GN}✓ Your QBiz installation is already up to date!${CL}"
    if [ "$AUTO_CONFIRM" = false ]; then
        read -r -p "Do you want to force rebuild dependencies and restart? [y/N]: " FORCE_CHOICE
        case "$FORCE_CHOICE" in
            [yY][eE][sS]|[yY])
                echo -e "\nProceeding with force refresh..."
                ;;
            *)
                echo -e "Exiting without changes."
                exit 0
                ;;
        esac
    else
        echo -e "Auto-confirm mode enabled. Refreshing..."
    fi
else
    echo -e "${YW}⚡ A new update is available!${CL}"
    if [ "$AUTO_CONFIRM" = false ]; then
        read -r -p "Do you want to proceed with the update now? [y/N]: " USER_CHOICE
        case "$USER_CHOICE" in
            [yY][eE][sS]|[yY])
                echo -e "\nStarting update process..."
                ;;
            *)
                echo -e "Update cancelled by user."
                exit 0
                ;;
        esac
    fi
fi

# Step 1: Stop Service
echo -e "\n[1/4] Stopping QBiz service..."
systemctl stop qbiz

# Step 2: Pull Latest Source Code
echo -e "[2/4] Fetching and pulling latest code..."
git pull origin main

NEW_VER=$(grep '"version"' package.json 2>/dev/null | head -n1 | cut -d '"' -f 4 || echo "unknown")
NEW_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Step 3: Pre-cache Deno Dependencies
echo -e "[3/4] Pre-caching Deno dependencies..."
if command -v deno >/dev/null 2>&1; then
    deno cache main.tsx
else
    echo -e "${RD}Warning: Deno runtime binary not found in PATH.${CL}"
fi

# Step 4: Restart Service
echo -e "[4/4] Restarting QBiz service..."
systemctl start qbiz

# Health verification
sleep 2
if systemctl is-active --quiet qbiz; then
    echo -e "\n${GN}✓ Update successful!${CL}"
    echo -e "QBiz Gateway Hub is running on version ${GN}v${NEW_VER}${CL} (${NEW_HASH}).\n"
else
    echo -e "\n${RD}⚠ Warning: Service failed to start automatically.${CL}"
    echo -e "Please check the logs using: ${YW}journalctl -u qbiz -n 50 --no-pager${CL}\n"
    exit 1
fi
