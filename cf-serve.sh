#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export NODE_OPTIONS='--max-old-space-size=512'

while true; do
  node node_modules/.bin/next start -p 3000 -H 0.0.0.0 2>&1
  echo "[$(date)] Server exited, restarting in 2s..."
  sleep 2
done
