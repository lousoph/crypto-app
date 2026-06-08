#!/bin/bash
# Watchdog for Next.js dev server
# Restarts the server if it crashes

PROJECT_DIR="/home/z/my-project"
LOG_FILE="/tmp/nextdev.log"
PID_FILE="/tmp/nextdev.pid"

cd "$PROJECT_DIR"

while true; do
  # Check if a process is already running
  if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
      # Process is still running, wait and check again
      sleep 30
      continue
    fi
  fi

  echo "[$(date)] Starting Next.js dev server..." >> "$LOG_FILE"

  # Clean up old .next cache to prevent stale chunks
  rm -rf .next/cache 2>/dev/null

  # Start dev server
  NODE_OPTIONS="--max-old-space-size=384" npx next dev -H 0.0.0.0 -p 3000 >> "$LOG_FILE" 2>&1 &
  NEW_PID=$!
  echo "$NEW_PID" > "$PID_FILE"
  echo "[$(date)] Started with PID $NEW_PID" >> "$LOG_FILE"

  # Wait for process to exit
  wait "$NEW_PID" 2>/dev/null
  EXIT_CODE=$?

  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 10s..." >> "$LOG_FILE"
  rm -f "$PID_FILE"
  sleep 10
done
