#!/usr/bin/env bash
set -euo pipefail

# Build frontend and start backend
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR/frontend"
echo "Installing frontend dependencies (if needed)..."
npm ci --silent
echo "Building frontend..."
npm run build

echo "Starting backend..."
cd "$ROOT_DIR/backend"
node manager_menu.js
