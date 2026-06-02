---
Task ID: 1
Agent: Main
Task: Fix client-side exception, add Fear & Greed Index, add buy/sell signals, persist view on refresh

Work Log:
- Investigated client-side exception - build was successful, no compile errors found
- Added FearGreedWidget component with SVG gauge, classification labels in French, buy/sell signal panel, 30-day area chart history
- Added TokenSignals component showing per-token ACHAT/VENTE/HOLD signals based on PRU vs current price
- Both widgets placed in grid layout on Dashboard view after Live Price Ticker
- Added localStorage persistence for currentView so page stays on same tab after refresh
- Fixed unused variable `roi` in TokenSignals
- Used useEffect for localStorage to avoid SSR hydration mismatch
- Added new lucide-react icons: Gauge, ShoppingCart, Tag, ArrowUpCircle, ArrowDownCircle
- Added recharts imports: AreaChart, Area, ReferenceLine
- Fixed package.json build/start scripts (removed standalone references)
- Build passes successfully, server responds 200 on first request

Stage Summary:
- Fear & Greed Index widget: Live gauge with SVG, 30-day history chart, buy/sell signal based on index value
- Token Signals: Per-token analysis comparing current price to PRU with ACHAT/VENTE/HOLD recommendations
- View persistence: localStorage saves and restores currentView across page refreshes
- Server environment: Kubernetes kills background processes, but preview system handles this
