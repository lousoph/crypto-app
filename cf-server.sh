#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export NODE_OPTIONS='--max-old-space-size=512'

while true; do
  echo "[$(date)] Starting CryptoFolio..."
  node node_modules/.bin/next start -p 3000 -H 0.0.0.0 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited ($EXIT_CODE). Restarting in 2s..."
  sleep 2
done
