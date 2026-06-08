#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=512" npx next start -H 0.0.0.0 -p 3000 2>/tmp/server.log
  echo "[$(date)] Server exited, restarting in 3s..."
  sleep 3
done
