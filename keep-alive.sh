#!/bin/bash
while true; do
  echo "[$(date)] Starting server..."
  npx next start -p 3000 2>&1
  echo "[$(date)] Server died, restarting in 2s..."
  sleep 2
done
