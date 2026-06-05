# Task: Implement 5 Features for Crypto Portfolio Tracker

## Agent: Main Developer
## Task ID: 5-features-implementation

## Summary

All 5 features have been successfully implemented:

### Feature 1: Rename "Analyse IA" to "CryptoSense AI"
- Changed all references in `page-content.tsx`:
  - BottomNav label: `'IA'` → `'CryptoSense'`
  - Sidebar label: `'Analyse IA'` → `'CryptoSense AI'`
  - AI Analysis header: `'Analyse IA'` → `'CryptoSense AI'`
  - Premium gate heading: `'Analyse IA — Premium'` → `'CryptoSense AI — Premium'`
  - Premium gate description updated
  - Plan comparison: `"Pas d'analyse IA"` → `"Pas de CryptoSense AI"`
  - Upgrade modal feature text updated
  - Error message updated
- Internal `View` type `'ai-analysis'` kept the same

### Feature 2: Add Token Search in AI Analysis View
- Replaced `<Select>` dropdown with a custom searchable combobox
- Added search input with magnifying glass icon
- Filters tokens by ticker or name as user types
- Shows filtered dropdown with token logo, ticker, name, and price
- Selected token shows as a compact display with clear (X) button
- Click outside closes dropdown
- Maintains all existing functionality (analysis, history, etc.)

### Feature 3: Explorer View
- Added new `View` type: `'explorer'`
- Added to BottomNav (label: "Explorer", icon: Search) and Sidebar (label: "Explorateur")
- Created `ExplorerView` component with two tabs:
  - **Tokens tab**: Grid of all tokens with ticker, name, price, active badge, and search functionality
  - **Exchanges tab**: Grid of all exchanges with name, logo, and active status
- Available to ALL users (no premium gate)
- Fetches from `/api/tokens`, `/api/exchanges`, `/api/prices`

### Feature 4: Profile Photo Upload
- ProfileView avatar: Clickable photo area with hover overlay (edit icon)
- File picker accepts images only (jpeg, png, gif, webp)
- New API route: `/api/user/upload-avatar` (POST, multipart/form-data)
  - Validates image type and 2MB size limit
  - Saves to `/home/z/my-project/upload/avatars/{userId}.{ext}`
  - Removes old avatar files with different extensions
  - Updates `user.image` in database
- Static file serving via Next.js rewrite + catch-all API route at `/api/upload/avatars/[...path]`
- Sidebar avatar: Shows uploaded photo or gradient circle with initial letter
- ProfileView avatar: Shows uploaded photo or gradient circle, with upload spinner

### Feature 5: Email Verification Before Access
- **Schema**: Added `emailVerified DateTime?` to User model in Prisma schema
- **Registration**: Now returns `{ requiresVerification: true, email }` instead of auto-signing in
  - Generates 6-digit verification code, stores in VerificationToken (expires 15 min)
  - Logs code to console (for production, would send email)
- **New API route**: `/api/auth/verify` (POST) - verifies code, sets emailVerified
- **New API route**: `/api/auth/resend-verification` (POST) - generates new code with 1-minute rate limit
- **Login changes**: If user's emailVerified is null, throws "EMAIL_NOT_VERIFIED" error
- **OAuth**: Auto-verifies email on account creation for Google/Apple users
- **Admin**: Auto-verified (set in seed route and existing admin updated)
- **Frontend**: 
  - After registration with verification, shows OTP-style input screen
  - After login attempt with unverified email, shows same verification screen
  - 6-digit code input with validation
  - Resend code button with 60-second cooldown
  - Auto-login after successful verification
  - Back to login button

## Files Modified
- `/home/z/my-project/src/app/page-content.tsx` - All frontend changes
- `/home/z/my-project/prisma/schema.prisma` - emailVerified field
- `/home/z/my-project/src/lib/auth.ts` - Email verification check in authorize, auto-verify OAuth
- `/home/z/my-project/src/app/api/auth/register/route.ts` - Verification flow on registration
- `/home/z/my-project/src/app/api/seed/route.ts` - Admin auto-verify
- `/home/z/my-project/next.config.ts` - Rewrites for /upload path

## Files Created
- `/home/z/my-project/src/app/api/auth/verify/route.ts`
- `/home/z/my-project/src/app/api/auth/resend-verification/route.ts`
- `/home/z/my-project/src/app/api/user/upload-avatar/route.ts`
- `/home/z/my-project/src/app/api/upload/avatars/[...path]/route.ts`
- `/home/z/my-project/upload/avatars/` (directory)

## Build Status
- Build passes successfully
- All API routes verified working
- Server running on port 3000
