#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -s --max-time 3 -o /dev/null -w "" http://localhost:3000 2>/dev/null; then
    pkill -f "next" 2>/dev/null
    sleep 1
    npx next start -p 3000 > /tmp/next.log 2>&1 &
    sleep 3
  fi
  sleep 10
done