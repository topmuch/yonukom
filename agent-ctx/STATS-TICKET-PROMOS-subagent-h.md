# Subagent H — Work Record

**Task ID**: STATS-TICKET-PROMOS
**Task**: Statistics tab + Ticket redesign + Promos + Closure book

## Summary of changes

### Schema
- Added `promoId String?` to `Order` model (Prisma schema)
- Ran `npx prisma db push` — DB now in sync

### New API routes
- `src/app/api/stats/route.ts` — GET ?businessId + period=today|week|month → KPIs (CA, orders, avg, payment breakdown, top 5 products, daily revenue)
- `src/app/api/promos/route.ts` — GET list / active + POST create (auto-deactivates prior active promo in transaction)
- `src/app/api/promos/[id]/route.ts` — PATCH (update / deactivate) + DELETE (with ownership check)
- `src/app/api/cash-sessions/[id]/closure-book/route.ts` — GET returns A4-printable HTML closure book

### Modified API routes
- `src/app/api/orders/route.ts` — POST accepts `promoId`, validates ownership + active state, computes `promoDiscount` (3 cases), persists `promoId` + `finalTotalAmount = total - promoDiscount`
- `src/app/api/orders/[id]/receipt/route.ts` — Full rewrite: 80mm thermal, ALL black text, prices BOLD+larger (14px), TOTAL 18px bold, no customer info, QR code (api.qrserver.com with Business.qrCodeUrl), ticketFooterMessage line, promo line if discount > 0, auto-print
- `src/app/api/business/profile/route.ts` — Added `qrCodeUrl` + `ticketFooterMessage` to GET select + PUT body + response

### New UI components
- `src/components/stats/stats-dashboard.tsx` — Stats tab with 3 sub-tabs (Journalier/Hebdo/Mensuel) + KPI cards + recharts BarChart + payment breakdown + Top 5 products
- `src/components/settings/ticket-customization.tsx` — 3 cards: QR URL + footer message + promo du jour management

### Modified UI components
- `src/components/layout/app-shell.tsx` — Added `"stats"` to TabId union + ALL_TABS (icon BarChart3, color #6366F1) + Gestion section filter
- `src/app/page.tsx` — Imported StatsDashboard + TicketCustomization + Ticket icon; added `{activeTab === "stats" && ...}`; added "ticket" section button + render in SettingsTab
- `src/components/pos/cart-drawer.tsx` — Added `activePromo` state + fetch effect; `promoDiscount` memo (global/amount/product cases); `finalTotal` shown everywhere (cart total, Wave dialog, WhatsApp message, payload); promo line in totals section (emerald, Tag icon); `promoId` sent in POST body
- `src/components/cash/cash-session-manager.tsx` — After close success, opens `/api/cash-sessions/[id]/closure-book` in new tab; toast message updated

## Build verification
- `npx prisma db push` → ✓ DB in sync, Prisma Client generated
- `npx next build` → ✓ Compiled successfully in 20.1s, all 4 new routes registered
- `bun run lint` → 8 errors + 7 warnings (same baseline as Subagents A–G, all pre-existing in `theme-toggle.tsx`, `business-logo.ts`, `superadmin-dashboard.tsx`, `use-auth-store.ts`, `page.tsx` lines 130/139/662/825 — none in my new files)
