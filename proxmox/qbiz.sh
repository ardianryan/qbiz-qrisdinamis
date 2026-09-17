#!/usr/bin/env bash
# Copyright (c) 2024-2026 QBiz Contributors
# License: MIT
# Proxmox VE LXC Helper - QBiz Gateway Hub One-Liner Launcher
#
# Execute directly on your Proxmox VE Node Shell:
# bash -c "$(wget -qLO - https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"

export COMMUNITY_SCRIPTS_URL="https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox"
source <(curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/ct/qbiz.sh)
