#!/bin/bash
cd /home/z/my-project
echo "[$(date)] Keep-alive script started" >> /tmp/keep-alive.log

while true; do
  if ! ss -tlnp | grep -q ':3000 '; then
    echo "[$(date)] Starting production server..." >> /tmp/keep-alive.log
    # Run next start directly (not via npx) to avoid wrapper process issues
    node node_modules/.bin/next start -p 3000 >> /tmp/next.log 2>&1 &
    SERVER_PID=$!
    echo "[$(date)] Launched PID $SERVER_PID" >> /tmp/keep-alive.log
    # Wait for it to come up
    for i in $(seq 1 20); do
      sleep 1
      if ss -tlnp | grep -q ':3000 '; then
        echo "[$(date)] Server is up (PID $SERVER_PID)" >> /tmp/keep-alive.log
        break
      fi
    done
    if ! ss -tlnp | grep -q ':3000 '; then
      echo "[$(date)] WARNING: Server failed to start after 20s" >> /tmp/keep-alive.log
    fi
  fi
  sleep 2
done
