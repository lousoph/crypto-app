#!/bin/bash
cd /home/z/my-project
export NODE_ENV=production
export NODE_OPTIONS='--max-old-space-size=128'

while true; do
  node -e "
    const { createServer } = require('http');
    const next = require('next');
    const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
    const handle = app.getRequestHandler();
    app.prepare().then(() => {
      const server = createServer(handle);
      server.listen(3000, '0.0.0.0', () => console.log('READY'));
    }).catch(e => { console.error('ERR:', e.message); process.exit(1); });
  " 2>&1
  echo "[$(date)] Restarting in 1s..."
  sleep 1
done
