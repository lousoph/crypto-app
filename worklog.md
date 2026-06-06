---
Task ID: 1
Agent: Main Agent
Task: Refaire le thème clair, améliorer Explorer, remettre premium à 9.99$, créer page d'accueil avec conseils IA et actualités crypto

Work Log:
- Extracted uploaded tar file and analyzed existing codebase
- Identified all key files: page-content.tsx, globals.css, layout.tsx, pricing routes
- Reduced layout max-width from max-w-6xl to max-w-5xl for PC
- Narrowed sidebar from w-60 to w-52
- Reduced KPI text sizes (text-lg → text-base, removed text-2xl)
- Reduced chart heights from h-64 to h-52 lg:h-56
- Created /api/news endpoint to fetch crypto news from @crypto_detente via RSS bridge
- Created /api/ai-tips endpoint using z-ai-web-dev-sdk for AI-generated crypto tips with market context
- Replaced ExplorerView with new HomeView (Accueil) featuring:
  - Global market metrics (Market Cap, Volume 24h, BTC Dominance, Active Cryptos)
  - Fear & Greed Index widget
  - Live price ticker
  - AI-generated tips with auto-rotation highlight
  - Crypto news from @crypto_detente with fallback link to X profile
- Updated View type to include 'home', removed 'explorer'
- Updated NAV_ITEMS: replaced Explorer/Eye with Accueil/Home
- Updated renderView switch statement
- Set default view to 'home' instead of 'dashboard'
- Updated ProfileView subscription card with $9.99 pricing grid showing 4 plans (1mo/3mo/6mo/12mo)
- Built successfully with all routes registered including /api/ai-tips and /api/news
- Dev server running and returning 200

Stage Summary:
- All changes applied to page-content.tsx and new API routes created
- Light theme more compact on PC (narrower sidebar, smaller fonts, reduced max-width)
- Explorer replaced by Accueil (Home) with AI tips, crypto news, and market overview
- Premium pricing at $9.99/month displayed in profile with plan options
- Build successful, server running on port 3000
