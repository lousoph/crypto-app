#!/bin/bash
# Persistent server start script with auto-restart
cd /home/z/my-project
export NODE_ENV=production

while true; do
  echo "[$(date)] Starting Next.js server..." >> /tmp/server-start.log
  node node_modules/.bin/next start -p 3000 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /tmp/server-start.log
  sleep 2
done
