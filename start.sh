#!/bin/bash
# Start the Next.js server and keep it alive
cd /home/z/my-project

export NODE_ENV=production
export NODE_OPTIONS='--max-old-space-size=512'

while true; do
  node server.mjs </dev/null &>>/tmp/server.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 2s..." >> /tmp/server.log
  sleep 2
done
