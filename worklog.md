# Project Health Check — Next.js 16

**Date:** Auto-generated  
**Project:** /home/z/my-project  
**Next.js Version:** 16.1.3 (Turbopack)

---

## 1. Build Results

**Status: ✅ BUILD SUCCEEDED**

```
▲ Next.js 16.1.3 (Turbopack)
✓ Compiled successfully in 4.3s
✓ Generating static pages (38/38) in 120.1ms
```

### Warnings (non-fatal, 4 total):

| # | Warning | File |
|---|---------|------|
| 1 | `Unsupported metadata viewport` — viewport should be a separate `export const viewport` | `layout.tsx` (`/`), `/_not-found`, `/payment/cancel`, `/payment/success` |
| 2 | `[next-auth][warn][NEXTAUTH_URL]` | Auth middleware (no `NEXTAUTH_URL` set in `.env`) |

### Impact: None — warnings only, will not crash the server.

---

## 2. Dev Server Startup

**Status: ✅ SERVER STARTS AND RESPONDS**

```
▲ Next.js 16.1.3 (Turbopack)
- Local:         http://localhost:3000
✓ Ready in 583ms
```

### Endpoint Tests:

| Endpoint | HTTP Status | Response |
|----------|-------------|----------|
| `GET /` | **200** | Valid HTML returned (see below) |
| `GET /api/auth/session` | **200** | `{}` (unauthenticated, correct) |

### First ~500 chars of HTML response from `/`:

```html
<!DOCTYPE html><html lang="fr"><head><meta charSet="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="/_next/static/chunks/..."/>
<link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/..."/>
<script src="/_next/static/chunks/node_modules_next_dist...
```

HTML is well-formed. The `'use client'` page uses a dynamic import with `ssr: false`, so the loading shell is server-rendered and the heavy CryptoApp loads client-side.

---

## 3. Code Review — Suspicious Patterns & Risks

### 🔶 Medium Concerns

| # | Pattern | File | Risk | Notes |
|---|---------|------|------|-------|
| 1 | **`page-content.tsx` is 3,175 lines / 171KB** | `src/app/page-content.tsx` | Memory / compile time | Single mega-component. Mitigated by `dynamic()` with `ssr: false` in `page.tsx`. Not a crash risk today but an architectural concern. |
| 2 | **Hardcoded NEXTAUTH_SECRET fallback** | `src/lib/auth.ts:166` | Security (prod only) | `secret: process.env.NEXTAUTH_SECRET \|\| "crypto-tracker-secret-key-2024"` — fine for dev, must be set in production. |
| 3 | **`NEXTAUTH_URL` not configured** | `.env` | Auth callbacks | Causes a warning; OAuth redirects may fail without it. Should be added to `.env`. |
| 4 | **`typescript.ignoreBuildErrors: true`** | `next.config.ts:6` | Hidden type errors | Type errors are silently ignored during build. Not a runtime crash risk but masks bugs. |
| 5 | **`reactStrictMode: false`** | `next.config.ts:8` | Subtle bugs | Disabling strict mode hides effects-related bugs (double-render in dev). |

### 🟢 Low / No Concern

| # | Pattern | File | Notes |
|---|---------|------|-------|
| 1 | Viewport in metadata export | `layout.tsx:24-29` | Next.js 16 deprecation warning. Move to `export const viewport = {...}`. Won't crash. |
| 2 | External token logo URLs | `page-content.tsx:136-139` | Uses CDN URLs for token images; has proper `onError` fallback to gradient. Safe. |
| 3 | `NEXT_PUBLIC_HAS_GOOGLE/APPLE` env checks | `page-content.tsx:276-277` | Guarded with `!!process.env...`, gracefully handles missing vars. Safe. |
| 4 | Rewrites `/upload/:path*` → `/api/upload/:path*` | `next.config.ts:15-21` | Standard rewrite pattern. No issues. |
| 5 | Database at SQLite file path | `.env` | `DATABASE_URL=file:/home/z/my-project/db/custom.db` — SQLite file, no external DB dependency. Works fine for dev. |

---

## 4. Environment Configuration Gap

The `.env` file contains only:
```
DATABASE_URL=file:/home/z/my-project/db/custom.db
```

**Missing but non-critical for dev:**
- `NEXTAUTH_URL` (causes warning)
- `NEXTAUTH_SECRET` (falls back to hardcoded value)
- `NEXT_PUBLIC_HAS_GOOGLE` / `NEXT_PUBLIC_HAS_APPLE` (OAuth buttons hidden)
- PayPal credentials (PayPal routes gracefully handle empty values)

---

## 5. Summary

| Check | Result |
|-------|--------|
| Build | ✅ Pass (warnings only) |
| Dev server starts | ✅ Pass (ready in 583ms) |
| Homepage responds | ✅ 200 OK |
| API routes respond | ✅ 200 OK |
| Crash risk | ✅ **No crash-causing issues found** |
| Security (prod) | ⚠️ Hardcoded auth secret must be overridden |

**Overall: The project is healthy. The dev server compiles and serves pages correctly. No code patterns that would cause crashes or sandbox inactivity were detected.** The viewport deprecation warnings and missing env vars are recommended fixes but do not affect stability.
