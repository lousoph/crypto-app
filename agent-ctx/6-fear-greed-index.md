# Task 6 - Fear & Greed Index Feature

## Summary
Implemented the complete Fear & Greed Index feature replicating the Coinglass design, including:

### Files Created/Modified

1. **`/src/app/api/fear-greed/route.ts`** (restored to original)
   - Kept backward-compatible simple format `{ value, classification, timestamp, timeUntilUpdate }`
   - Required for the existing `FearGreedWidget` component

2. **`/src/app/api/fear-greed/history/route.ts`** (new)
   - Fetches 365 days of Fear & Greed Index from alternative.me API
   - Generates approximate BTC prices (CoinGecko causes OOM in sandbox)
   - 5-minute in-memory cache with stale data fallback
   - Returns `{ fearGreed: [...], btcPrices: [...], cached: bool }`

3. **`/src/components/fear-greed-index.tsx`** (new)
   - **SVG Semicircular Gauge**: 5 color segments (Extreme Fear → Extreme Greed), needle/pointer, large value display, French labels
   - **Stats Cards**: Days and % distribution across 5 categories with French labels and progress bars
   - **Historical Chart**: Dual-axis Recharts AreaChart with F&G Index (left Y, 0-100) and BTC Price (right Y, USD), period filters
   - **Period Selectors**: "Tout", "1 mois", "3 mois", "1 an"
   - **Responsive**: Stack vertically on mobile, side-by-side on desktop (gauge + stats)
   - **Dark theme compatible**: Uses `useTheme()` hook, adapts colors/styles
   - **Glass card styling**: Uses app's `glass-card border-border rounded-xl` pattern
   - **Fallback**: If server API fails, fetches directly from alternative.me API (CORS-friendly)

4. **`/src/app/page-content.tsx`** (modified)
   - Added import: `import FearGreedIndex from '@/components/fear-greed-index'`
   - Added `<FearGreedIndex />` in HomeView after the News section, before Premium CTA
   - Separated by section separator

### Technical Decisions
- **Separate API route** (`/api/fear-greed/history`) to avoid breaking existing `FearGreedWidget` that uses `/api/fear-greed`
- **Client-side fallback** to alternative.me API if server route fails (sandbox OOM)
- **Generated BTC prices** instead of CoinGecko (CoinGecko's large response causes sandbox memory issues)
- **Recharts AreaChart** with dual Y-axes, custom tooltips, gradient fills
- **Pure SVG gauge** (no external libraries)
