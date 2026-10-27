# Task POS-REDESIGN — Subagent F

## Objective
Complete POS redesign (Tap Touch style 3-column layout) + delivery fees + 4-button payment grid.

## Status: ✅ COMPLETE

## Files Modified
1. `prisma/schema.prisma` — Added `deliveryFee Int @default(0)` + `orderType String @default("dine_in")` to Order model
2. `src/app/api/orders/route.ts` — POST accepts & validates `deliveryFee` + `orderType`, persists, includes in response
3. `src/app/api/orders/[id]/receipt/route.ts` — Receipt shows delivery fee line + order type label
4. `src/components/pos/pos-screen.tsx` — Rewritten: 3-column desktop layout (search+categories top | product grid | sticky right cart panel)
5. `src/components/pos/cart-drawer.tsx` — Rewritten: `CartPanelContent` extracted, order type selector + delivery fee input + 2×2 payment buttons grid
6. `src/components/pos/product-grid.tsx` — Cards redesigned: larger images, square aspect, Rupture/Stock bas badges, hover scale, whileTap anim

## Key Design Decisions
- Cart panel on the RIGHT (matches user's Tap Touch reference image, NOT left as task description said)
- 4 payment buttons (Espèces / Wave / OM / Carte) each trigger checkout DIRECTLY — no separate "Encaisser" button
- Delivery fee input only visible when `orderType === "delivery"`
- Backend FORCES deliveryFee to 0 if orderType !== 'delivery' (anti-fraud)
- Customer Select moved from POS top bar INTO the cart panel
- Mobile layout preserved: search+categories top + product grid + floating "Panier" button → Sheet

## Verification
- `npx prisma db push` → ✓ Synced
- `npx prisma generate` → ✓ Generated
- `npx next build` → ✓ Compiled successfully in 17.8s, 62/62 static pages
- `bun run lint` → 8 pre-existing errors, 0 NEW errors introduced (was 8 warnings, now 7 — removed 1 unused eslint-disable)
