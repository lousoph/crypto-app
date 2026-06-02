#!/bin/bash
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ':3000 '; then
    echo "[$(date)] Starting production server..." >> /tmp/keep-alive.log
    npx next start -p 3000 >> /tmp/next.log 2>&1 &
    SERVER_PID=$!
    sleep 5
    # Wait for it to come up
    for i in $(seq 1 10); do
      if ss -tlnp | grep -q ':3000 '; then
        echo "[$(date)] Server is up (PID $SERVER_PID)" >> /tmp/keep-alive.log
        break
      fi
      sleep 1
    done
  fi
  sleep 3
done
