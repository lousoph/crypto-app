---
Task ID: 1
Agent: Main
Task: Fix site not displaying + add more animations and effects

Work Log:
- Diagnosed that the Next.js production server was being killed by Kubernetes container
- PM2 process manager was installed and configured to keep the server alive
- The server now runs stably via PM2 (pm2 start "node node_modules/.bin/next start -p 3000" --name crypto-tracker)
- Added massive new CSS animations and effects to globals.css:
  - Neon glow pulse for text titles
  - Cinematic view entrance with blur transition
  - Spotlight card effect (light follows mouse)
  - Orbit/reverse orbit animations
  - Rainbow border animation for premium elements
  - Price flash up/down for live price updates
  - FAB button pulse ring animation
  - Card flip entrance animation
  - Gradient shimmer text animation
  - Morphing rotating border animation
  - Hover scale with glow effect
  - List stagger entrance animation
  - Dialog entrance animation
  - Floating badge animation
  - Ticker scroll animation
  - Premium card glow aura
  - Intensified ambient background
  - Enhanced particle glow
  - Progress bar animated gradient
  - Skeleton wave loading
  - Glow dot for orbiting particles
- Applied new animation classes throughout page.tsx:
  - gradient-shimmer-text on all page titles (Dashboard, Transactions, Profile, Admin)
  - neon-glow on sidebar CryptoFolio logo
  - breathe on sidebar wallet icon
  - floating-badge on user role badges
  - list-stagger on mobile token card lists
  - hover-scale-glow on token table rows and price ticker items
  - price-flash-up/down on live price changes
  - fab-pulse-ring on mobile FAB button
  - dialog-enter on transaction dialog
  - Increased particles from 25 to 40, size from 1-4 to 1-5
- Rebuilt project and restarted PM2
- Verified site is stable and accessible via both port 3000 and Caddy port 81

Stage Summary:
- Site is now live and stable via PM2 at https://ruducom.space-z.ai
- Significantly enhanced visual effects and animations throughout the app
- The immersive dark design with violet/cyan gradients is fully applied
- PM2 ensures the server stays alive even when Kubernetes would normally kill background processes
