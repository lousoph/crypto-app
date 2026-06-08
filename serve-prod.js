const { createServer } = require('http');
const { execSync } = require('child_process');

const PROJECT = '/home/z/my-project';
process.chdir(PROJECT);

async function start() {
  const next = require('next');
  const app = next({ dev: false, hostname: '0.0.0.0', port: 3000 });
  const handle = app.getRequestHandler();
  await app.prepare();
  
  const server = createServer((req, res) => {
    handle(req, res);
  });
  
  server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
  });
  
  await new Promise((resolve) => {
    server.listen(3000, '0.0.0.0', () => {
      console.log('Server ready on 0.0.0.0:3000');
      resolve();
    });
  });
  
  // Keep alive
  setInterval(() => {}, 60000);
}

start().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
