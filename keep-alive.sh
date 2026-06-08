#!/bin/bash
# Self-sustaining server supervisor
# Uses file-based locking to prevent duplicate instances
LOCK_FILE="/tmp/next-server.lock"
PID_FILE="/tmp/next-server.pid"

acquire_lock() {
  if [ -f "$LOCK_FILE" ]; then
    OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      echo "Already running as PID $OLD_PID"
      exit 0
    fi
  fi
  echo $$ > "$LOCK_FILE"
}

release_lock() {
  rm -f "$LOCK_FILE" "$PID_FILE"
}

trap release_lock EXIT
acquire_lock

cd /home/z/my-project
while true; do
  node serve-prod.js </dev/null >> /tmp/next-prod.log 2>&1
  EC=$?
  echo "[$(date)] Exit code: $EC, restarting in 3s..." >> /tmp/next-prod.log
  sleep 3
done
