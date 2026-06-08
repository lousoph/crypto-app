const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT = '/home/z/my-project';
process.chdir(PROJECT);

// Load .env file into process.env
const envPath = path.join(PROJECT, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
  console.log('[ENV] Loaded .env file (' + lines.filter(l => l.trim() && !l.trim().startsWith('#')).length + ' vars)');
}

process.env.NODE_ENV = 'production';

// Persistent TCP keep-alive ping to prevent the process from being killed
setInterval(() => {
  const net = require('net');
  const sock = net.createConnection(3000, '127.0.0.1', () => {
    sock.destroy();
  });
  sock.on('error', () => {});
}, 30000);

async function start() {
  const next = require('next');
  const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = createServer((req, res) => {
    handle(req, res);
  });

  // Keep-alive on server too
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 60000;

  server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
  });

  await new Promise((resolve) => {
    server.listen(3000, '0.0.0.0', () => {
      console.log('Server ready on 0.0.0.0:3000');
      console.log('[PAYPAL] Client ID:', process.env.PAYPAL_CLIENT_ID ? process.env.PAYPAL_CLIENT_ID.substring(0, 10) + '...' : 'NOT SET');
      console.log('[PAYPAL] API Base:', process.env.PAYPAL_API_BASE || 'NOT SET');
      resolve();
    });
  });

  // Write PID file for process management
  fs.writeFileSync('/tmp/next-server.pid', process.pid.toString());
  console.log('[PID] ' + process.pid);

  // Prevent garbage collection with periodic activity
  const keepRunning = () => {
    // Touch a temp file to keep FS active
    try { fs.writeFileSync('/tmp/next-alive', Date.now().toString()); } catch {}
  };
  setInterval(keepRunning, 15000);
}

start().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});

// Handle signals gracefully
process.on('SIGTERM', () => {
  console.log('[SHUTDOWN] SIGTERM received');
  try { fs.unlinkSync('/tmp/next-server.pid'); } catch {}
  process.exit(0);
});
process.on('SIGINT', () => {
  console.log('[SHUTDOWN] SIGINT received');
  try { fs.unlinkSync('/tmp/next-server.pid'); } catch {}
  process.exit(0);
});
