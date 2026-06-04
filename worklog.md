---
Task ID: 1
Agent: Main Agent
Task: Fix site not working - diagnose and fix server crashes, resolve 502/403 errors

Work Log:
- Diagnosed server crash: Next.js production server was crashing after 2-3 requests due to memory issues with --max-old-space-size=2048
- Fixed by reducing memory limit to 1024MB and using PM2 process manager for auto-restart
- Successfully built the project (next build succeeds)
- Seeded database with admin user (unibus93@gmail.com) and all tokens/exchanges
- All API endpoints working locally: /, /api/health, /api/tokens, /api/prices, /api/fear-greed, /api/auth/csrf
- Caddy reverse proxy on port 81 correctly proxies to Next.js on port 3000
- External proxy (Alibaba Cloud FC) returns 403 Forbidden - infrastructure issue
- The FC_CUSTOM_LISTEN_PORT=81 confirms FC connects to port 81 (Caddy) which works locally
- The 403 FCCommonError is from the FC function itself, not from our application
- Deploy API at http://localhost:12600/deploy requires proper userid/chatid params

Stage Summary:
- Server is stable with PM2 (0 crashes, running continuously)
- All APIs respond correctly on localhost and through Caddy proxy
- External access blocked by Alibaba Cloud FC returning 403 (infrastructure issue)
- Database seeded with admin, premium, demo users and 42 tokens
- PM2 configured for auto-restart on crashes
- Key fix: --max-old-space-size=1024 instead of 2048 prevents OOM crashes
