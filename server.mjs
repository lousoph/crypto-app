// Daemonized Next.js production server
import { spawn } from 'child_process';
import { writeFileSync, appendFileSync, existsSync, readFileSync, unlinkSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PID_FILE = '/tmp/next-server.pid';
const LOG_FILE = '/tmp/server.log';

// Check if already running
if (existsSync(PID_FILE)) {
  try {
    const oldPid = parseInt(readFileSync(PID_FILE, 'utf8'));
    process.kill(oldPid, 0);
    console.log(`Server already running with PID ${oldPid}`);
    process.exit(0);
  } catch {
    try { unlinkSync(PID_FILE); } catch {}
  }
}

// Daemon mode: fork to background
if (!process.env.__DAEMON__) {
  const child = spawn(process.argv[0], process.argv.slice(1), {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, __DAEMON__: '1' },
    cwd: __dirname,
  });
  child.unref();
  setTimeout(() => {
    console.log(`Daemon PID: ${child.pid} | Log: ${LOG_FILE}`);
    process.exit(0);
  }, 1500);
} else {
  // We are the daemon child
  writeFileSync(PID_FILE, String(process.pid));

  function log(msg) {
    const ts = new Date().toISOString();
    appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
  }

  log(`Starting (PID: ${process.pid})`);

  async function startServer() {
    try {
      const { createServer } = await import('http');
      const next = (await import('next')).default;

      process.on('uncaughtException', (err) => log(`UNCAUGHT: ${err.message}`));
      process.on('unhandledRejection', (r) => log(`UNHANDLED: ${r}`));

      const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
      const handle = app.getRequestHandler();
      await app.prepare();
      const server = createServer(handle);

      await new Promise((resolve) => {
        server.listen(3000, '0.0.0.0', () => {
          log('READY on 0.0.0.0:3000');
          resolve();
        });
      });

      process.on('SIGTERM', () => {
        log('SIGTERM, shutting down...');
        server.close(() => process.exit(0));
      });
    } catch (err) {
      log(`ERROR: ${err.message}, restarting in 3s...`);
      await new Promise(r => setTimeout(r, 3000));
      startServer();
    }
  }

  startServer();
}
