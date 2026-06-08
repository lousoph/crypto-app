#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

log_step_start() {
        local step_name="$1"
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting: $step_name"
        echo "=========================================="
        export STEP_START_TIME
        STEP_START_TIME=$(date +%s)
}

log_step_end() {
        local step_name="${1:-Unknown step}"
        local end_time
        end_time=$(date +%s)
        local duration=$((end_time - STEP_START_TIME))
        echo "=========================================="
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Completed: $step_name"
        echo "[LOG] Step: $step_name | Duration: ${duration}s"
        echo "=========================================="
        echo ""
}

cd "$PROJECT_DIR"

# Install dependencies
log_step_start "bun install"
echo "[BUN] Installing dependencies..."
bun install
log_step_end "bun install"

# Setup database
log_step_start "bun run db:push"
echo "[BUN] Setting up database..."
bun run db:push
log_step_end "bun run db:push"

# Build for production
log_step_start "Building for production"
echo "[BUN] Building Next.js..."
NODE_OPTIONS='--max-old-space-size=2048' bun run build
log_step_end "Building for production"

# Generate Prisma client
log_step_start "Prisma generate"
echo "[PRISMA] Generating client..."
bun run db:generate
log_step_end "Prisma generate"

# Load .env file into environment
log_step_start "Loading environment variables"
if [ -f "$PROJECT_DIR/.env" ]; then
  echo "[ENV] Loading .env file..."
  set -a
  while IFS='=' read -r key value; do
    # Skip empty lines and comments
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Remove surrounding quotes from value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    export "$key=$value"
  done < "$PROJECT_DIR/.env"
  set +a
  echo "[ENV] Environment variables loaded."
else
  echo "[ENV] No .env file found, skipping."
fi
log_step_end "Loading environment variables"

# Start production server in a restart loop
log_step_start "Starting Next.js production server"
echo "[SERVER] Starting production server on port 3000..."

(
  cd "$PROJECT_DIR"
  # Re-load .env in subshell for the server loop
  if [ -f "$PROJECT_DIR/.env" ]; then
    set -a
    while IFS='=' read -r key value; do
      [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
      value="${value%\"}"
      value="${value#\"}"
      value="${value%\'}"
      value="${value#\'}"
      export "$key=$value"
    done < "$PROJECT_DIR/.env"
    set +a
  fi
  while true; do
    NODE_ENV=production NODE_OPTIONS='--max-old-space-size=384' \
      node -e "
        const next = require('next');
        const http = require('http');
        process.on('uncaughtException', (e) => { console.error('UNCAUGHT:', e.message); process.exit(1); });
        process.on('unhandledRejection', (r) => { console.error('UNHANDLED:', r); process.exit(1); });
        async function start() {
          const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
          const handle = app.getRequestHandler();
          await app.prepare();
          const server = http.createServer(handle);
          await new Promise((resolve, reject) => {
            server.listen(3000, '0.0.0.0', () => { console.log('READY on 0.0.0.0:3000'); resolve(); });
            server.on('error', reject);
          });
          process.on('SIGTERM', () => { console.log('SIGTERM'); server.close(() => process.exit(0)); });
        }
        start().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
      " </dev/null &>>/tmp/next-prod.log
    echo "[$(date)] Server exited, restarting in 3s..." >> /tmp/next-prod.log
    sleep 3
  done
) </dev/null &>>/tmp/next-prod.log &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null || true
log_step_end "Starting Next.js production server"

echo "Production server started (PID: $SERVER_PID)"
