# Task 2b - Mobile/Tablet Layout Fix & Prédict AI Rewrite

## Summary
Fixed mobile/tablet layout deformation and completely rewrote the Prédict AI section for responsive design and theme awareness.

## Changes Made

### 1. Main Layout (CryptoApp - line ~5796)
- Added `overflow-x-hidden` to root container to prevent horizontal scroll
- Added `min-w-0` to `<main>` to prevent flexbox squishing
- Added explicit `w-full` to `max-w-7xl` container

### 2. Sidebar Component (line ~1185-1212)
- Mobile sidebar width: `w-64 sm:w-72` (was `w-72` - too wide on small phones)
- Mobile hamburger z-index: `z-30` (was `z-50` - above content, below sidebar overlay)
- Mobile hamburger position: `top-3 left-3` (was `top-4 left-4`)
- Mobile sidebar z-index: `z-50` (was `z-40` - now above overlay)
- Desktop sidebar: added `shrink-0` to prevent flex shrinking

### 3. AIAnalysisView Complete Rewrite (line ~5070-5695)

**signalIcon Fix:**
- Replaced broken `w-${size} h-${size}` dynamic classes (Tailwind JIT can't generate these)
- Now uses explicit hardcoded classes: `w-8 h-8` for signal card icons

**Theme-Aware Styling:**
- Added `const ts = useThemeStyles()` hook usage
- Replaced hardcoded `rgba(255,255,255,...)` with `ts.isDark` conditionals
- Fixed news impact text: `rgba(255,255,255,0.55)` → `text-foreground/55` (visible in light mode)
- Fixed sentiment gauge background: `rgba(255,255,255,0.05)` → `var(--muted)` (visible in light mode)
- Gradient lines use `ts.authGradientLine` or conditional `ts.isDark` colors
- Button styling uses `ts.primaryGradient` and `ts.primaryBtnShadow`
- Chart tooltip uses `ts.chartTooltipBg/Border/Shadow`
- Loading animation uses `ts.accentBg` and conditional orbit border colors

**Mobile-First Responsive Design:**
- All text sizes: `text-[10px] sm:text-xs`, `text-lg sm:text-2xl`, etc.
- All spacing: `p-3 sm:p-5`, `gap-3 sm:gap-4`, etc.
- Chart height: `h-[200px] sm:h-[300px]`
- Border radius: `rounded-xl sm:rounded-2xl`
- Technical/Sentiment grid: `grid-cols-1 lg:grid-cols-2` (was `sm:grid-cols-2`)
- Key Factors/Risks grid: `grid-cols-1 lg:grid-cols-2` (was `sm:grid-cols-2`)
- Fear & Greed gauge: `w-20 h-20 sm:w-24 sm:h-24` with flex-col on mobile, flex-row on desktop
- Empty state feature cards: `grid grid-cols-2 sm:flex` with background pills
- Token selector: `h-11 sm:h-12`, `gap-2 sm:gap-3`
- History button: icon-only on mobile, text+icon on desktop

**New Features:**
- Added "Re-analyser" button in signal card results
- Better confidence bar with percentage label inside the bar
- More engaging empty state with background pills for feature indicators
- `fgColor()` and `fgBadgeClass()` helper functions for cleaner Fear & Greed logic

**Bug Fixes:**
- Removed unused `signalIconSmall` function
- French accented characters properly encoded
- `overflow-hidden` on root div to prevent horizontal scroll

## Files Modified
- `/home/z/my-project/src/app/page-content.tsx`

## Lint Status
All pre-existing lint errors (set-state-in-effect). No new errors introduced.
