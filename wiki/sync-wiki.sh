#!/usr/bin/env bash

# Script to sync local wiki/ Markdown pages to GitHub Wiki repository
# Repository: https://github.com/ardianryan/qbiz-qrisdinamis.wiki.git

set -e

WIKI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DIR="$(mktemp -d)"
WIKI_REPO_URL="https://github.com/ardianryan/qbiz-qrisdinamis.wiki.git"

echo "=== Syncing QBiz Gateway Hub GitHub Wiki ==="
echo "Local source: $WIKI_DIR"
echo "Target repo:  $WIKI_REPO_URL"

# Clone wiki repository
if git clone "$WIKI_REPO_URL" "$TEMP_DIR" 2>/dev/null; then
  echo "[✔] Cloned GitHub Wiki repository."
else
  echo "[i] Wiki repository not initialized yet. Initializing new git repo..."
  cd "$TEMP_DIR"
  git init
  git remote add origin "$WIKI_REPO_URL"
fi

# Copy all markdown files (excluding sync-wiki.sh)
cd "$TEMP_DIR"
cp "$WIKI_DIR"/*.md "$TEMP_DIR/"

git add .
if git diff --staged --quiet; then
  echo "[✔] GitHub Wiki is already up to date. No changes to push."
else
  git commit -m "docs(wiki): update documentation and guides"
  git push -u origin master || git push -u origin main
  echo "[✔] Successfully pushed Wiki documentation to GitHub Wiki!"
fi

rm -rf "$TEMP_DIR"
