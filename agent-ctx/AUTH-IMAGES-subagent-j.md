# Task: AUTH-IMAGES — Subagent J

## Summary

Implemented JWT-based stateless authentication (backward-compatible, opt-in per route) and replaced base64 image storage in the DB with on-disk file storage served via a dynamic Next.js route.

## What was done

### Task 1: JWT Authentication
- Installed `jsonwebtoken@9.0.3` + `@types/jsonwebtoken@9.0.10`.
- Created `src/lib/auth.ts` with `signToken`, `verifyToken`, `getTokenFromRequest` + `JwtPayload` interface. Secret = `process.env.JWT_SECRET` (dev fallback provided), 7-day expiry.
- Created `src/lib/auth-middleware.ts` with `withAuth(handler)` HOF that verifies Bearer token, returns 401 in French on missing/invalid.
- Updated `src/app/api/auth/login/route.ts` to issue a JWT after successful bcrypt verification — response now includes `token`.
- Updated `src/stores/use-auth-store.ts`: added `token: string | null`, `login(user, token?)` persists `yonukom_token` to localStorage, `logout()` clears it, hydration reads both `yonukom_user` + `yonukom_token`.
- Updated `src/components/auth/login-screen.tsx` to pass `data.token` into `login()`.
- Created `src/lib/api-client.ts` with `apiFetch(url, options)` that auto-injects `Authorization: Bearer <token>` on the client.

### Task 2: Image File Storage (replaces base64)
- Created `src/app/api/upload/route.ts` (`POST /api/upload`): accepts multipart form, validates image MIME + 2 MB max, saves to `{uploadsRoot}/{businessId}/{timestamp}-{random}-{name}.{ext}`, returns `{ url }`.
- Created `src/app/api/uploads/[...path]/route.ts` (`GET /api/uploads/{businessId}/{filename}`): streams file from disk with correct Content-Type + 1-year immutable cache. Double-layered path-traversal protection.
- Updated `src/components/products/product-form.tsx`: file selection now resizes → converts to File → POSTs to `/api/upload` → stores returned URL (NOT base64) in `form.imageUrl`. Removed duplicate `fileToResizedDataUrl` function that existed pre-edit.
- Created `src/scripts/migrate-base64-to-files.ts`: idempotent one-off script that decodes existing base64 `imageUrl`s to disk + updates DB rows to point to `/api/uploads/...`. Run with `bun run src/scripts/migrate-base64-to-files.ts`.
- Updated `next.config.ts` with a rewrite `/uploads/:path*` → `/api/uploads/:path*` (cleaner public URLs).
- Updated `Dockerfile` to `mkdir -p /app/uploads && chmod 777` at build time AND at container startup.
- Updated `.gitignore` for `/.uploads/` (dev-only local uploads dir).

## Verification
- `npx tsc --noEmit` → **0 errors**
- `npx next build` → **✓ Compiled successfully in 19.3s** (65 pages generated)
- `bun run lint` → 8 errors, ALL pre-existing (in `superadmin-dashboard.tsx`, `business-logo.ts`, and the original `require()` in `use-auth-store.ts` line 77 which was there BEFORE this task — I only added lines around it).

## Files
Created: `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/api-client.ts`, `src/app/api/upload/route.ts`, `src/app/api/uploads/[...path]/route.ts`, `src/scripts/migrate-base64-to-files.ts`
Modified: `src/app/api/auth/login/route.ts`, `src/stores/use-auth-store.ts`, `src/components/auth/login-screen.tsx`, `src/components/products/product-form.tsx`, `next.config.ts`, `Dockerfile`, `.gitignore`, `package.json`, `bun.lock`
