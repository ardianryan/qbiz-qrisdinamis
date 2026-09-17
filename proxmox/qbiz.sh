#!/usr/bin/env bash
# Copyright (c) 2024-2026 QBiz Contributors
# License: MIT
# QBiz Gateway Hub - Automated Proxmox LXC Installer
# Source: https://github.com/ardianryan/qbiz-qrisdinamis
#
# Execute directly on your Proxmox VE Node Shell:
# bash -c "$(wget -qLO - https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/qbiz.sh)"

export COMMUNITY_SCRIPTS_URL="https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox"
source <(curl -fsSL https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox/ct/qbiz.sh)
