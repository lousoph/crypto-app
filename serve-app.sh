#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=512" npx next dev -H 0.0.0.0 -p 3000 --turbopack 2>/tmp/server.log &
  PID=$!
  echo $PID > /tmp/next-server.pid
  echo "Started dev server PID=$PID"
  wait $PID
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
