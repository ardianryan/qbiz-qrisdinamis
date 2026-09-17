#!/usr/bin/env bash
COMMUNITY_SCRIPTS_URL="https://raw.githubusercontent.com/ardianryan/qbiz-qrisdinamis/main/proxmox"
source <(curl -fsSL https://raw.githubusercontent.com/community-scripts/core/main/core/build.func)
# Copyright (c) 2024-2026 QBiz Contributors
# License: MIT | https://github.com/ardianryan/qbiz-qrisdinamis/blob/main/LICENSE
# Source: https://github.com/ardianryan/qbiz-qrisdinamis

# App Default Values
APP="QBiz"
var_tags="payment;qris;pos;gateway"
var_cpu="2"
var_ram="2048"
var_disk="10"
var_os="debian"
var_version="12"
var_unprivileged="1"

# App Custom Settings
header_info "$APP"
variables
color
catch_errors

function update_script() {
    header_info
    check_container_resources
    if [[ ! -d /opt/qbiz ]]; then
        msg_error "No ${APP} Installation Found!"
        exit 1
    fi
    msg_info "Updating $APP"
    systemctl stop qbiz
    cd /opt/qbiz || exit 1
    git pull
    deno cache main.tsx
    systemctl start qbiz
    msg_ok "Updated $APP"
    exit
}

start
build_container
description

msg_ok "Completed Successfully!\n"
echo -e "${CREATING}${GN}${APP} setup has been successfully initialized!${CL}"
echo -e "${INFO}${YW} Access it using the following URL:${CL}"
echo -e "${TAB}${GATEWAY}${BGN}http://${IP}:8000${CL}\n"
