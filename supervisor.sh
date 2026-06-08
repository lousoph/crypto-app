#!/bin/bash
cd /home/z/my-project
while true; do
  node serve-prod.js </dev/null >> /tmp/next-prod.log 2>&1
  echo "[$(date)] Server crashed, restarting..." >> /tmp/next-prod.log
  sleep 3
done
