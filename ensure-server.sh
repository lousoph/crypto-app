#!/bin/bash
# Check if server is running, start it if not
if ! curl -s -o /dev/null -w "" -m 3 http://localhost:3000/ 2>/dev/null; then
  pkill -f "next start" 2>/dev/null
  pkill -f "next dev" 2>/dev/null
  sleep 1
  cd /home/z/my-project
  NODE_ENV=production NODE_OPTIONS='--max-old-space-size=128' nohup node -e "
    const { createServer } = require('http');
    const next = require('next');
    const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
    const handle = app.getRequestHandler();
    app.prepare().then(() => {
      createServer(handle).listen(3000, '0.0.0.0', () => console.log('READY'));
    }).catch(e => { console.error('ERR:', e.message); process.exit(1); });
  " > /tmp/cf-ensure.log 2>&1 &
  sleep 5
fi
