# Task ID: POS-fix — Agent: Subagent D

## Task Summary
POS photos + cash session + receipt printing — 5 sub-tasks:
1. Product images must appear in POS product grid
2. Block sales when cash session is closed (frontend + backend)
3. Print receipt button (browser print, no PDF lib)
4. Receipt must include customer info
5. Verify ProductForm image upload

## Files Modified

### `src/components/pos/product-grid.tsx`
- Changed image `loading="lazy"` → `loading="eager"` (POS needs fast display)
- Added `decoding="async"` to avoid main-thread blocking
- Added `aspect-square rounded-lg` to image and fallback div (matches spec)
- Reduced fallback `Package` icon from `w-10 h-10` to `w-8 h-8` (per spec)

### `src/components/pos/cart-drawer.tsx` (full rewrite)
New features:
- **Cash session check**: `cashSessionActive` state (default `false`), fetched on mount via `/api/cash-sessions?businessId=xxx` and re-checked on every drawer open. Reads `data.activeSession` to determine if a session is open.
- **Block checkout when closed**: If user clicks "Encaisser" with no active session → opens "Caisse fermée" Dialog with explanation + "Ouvrir la caisse" button that calls `onNavigateToCash` prop.
- **Visual disable**: "Encaisser" button becomes amber/coral, shows lock icon and "Caisse fermée" label + amber "Caisse fermée — ouverture requise" badge above the button.
- **403 handling**: If backend returns 403 (caisse fermée), sets `cashSessionActive=false` + opens dialog.
- **Success state**: After successful POST, `lastOrder` state holds `{id, orderNumber, totalAmount, paymentMethod}`. The drawer switches to a `SuccessPanel` showing order details + two buttons: "Imprimer le ticket" (opens `/api/orders/{id}/receipt` in new window) and "Nouvelle vente" (clears cart + lastOrder + closes drawer).
- **Payment method selector**: 4-button grid (Espèces/Wave/Orange/Carte) above the Total row. Default: cash. Sent as `paymentMethod` in POST body.
- **customerId fix**: Payload now sends `customerId: customer?.id ?? null` (was `?? "walk-in"`). The API resolves `null` → walk-in customer.
- New imports: `Dialog*`, `Lock`, `Landmark`, `Printer`, `Banknote`, `Smartphone`, `CreditCard`, `Wallet`, `useCallback`, `useEffect`.

### `src/components/pos/pos-screen.tsx`
- Added optional `onNavigateToCash?: () => void` prop to `PosScreen` component.
- Passes it down to `<CartDrawer onNavigateToCash={onNavigateToCash} />`.

### `src/components/layout/app-shell.tsx`
- Added `"caisse"` to `TabId` union type.
- Added new tab config `{ id: "caisse", label: "Caisse", icon: Landmark, gradient: "from-emerald-500 to-green-500", accent: "bg-emerald-500", color: "#10B981" }`.
- Added `Landmark` to lucide-react imports.

### `src/app/page.tsx`
- In `DashboardMain`, passes `onNavigateToCash={() => setActiveTab("caisse")}` to `<PosScreen />`.
- Renders `<CashSessionManager />` inside `PermissionGuard` when `activeTab === "caisse"`.

### `src/app/api/orders/route.ts`
- Added backend safety net: after validating businessId/items, queries `db.cashSession.findFirst({ where: { businessId, isActive: true, closedAt: null } })`. If none found → 403 with `{ error: 'Caisse fermée. Ouvrez une session de caisse avant d'encaisser.' }`.
- Accepts new `paymentMethod` field in body. Validates against `['cash', 'wave', 'orange_money', 'cb', 'cheque', 'virement']` (default `cash`).
- Order creation transaction now also creates a `Payment` record (`amount: totalAmount, method: resolvedPaymentMethod, receivedBy: createdBy`).
- Order now created with `paidAmount: totalAmount, remainingAmount: 0` (was `paidAmount: 0, remainingAmount: totalAmount`) — a completed counter sale is paid immediately.
- Response now includes `paymentMethod: resolvedPaymentMethod` so the frontend success state can display it without refetching.

### `src/app/api/orders/[id]/receipt/route.ts` (NEW)
- GET route returning an HTML page with `Content-Type: text/html; charset=utf-8`.
- Loads the order with `orderItems.product`, `payments`, `customer` includes.
- Loads the business (name, address, city, phone, email, logoUrl) and the cashier (User.name) in parallel.
- Renders an 80mm thermal-receipt-style HTML page with:
  - Inline CSS for print (`@page { size: 80mm auto }`, monospace font, dashed separators)
  - Business header: logo (if `logoUrl`), name, address, phone, email
  - Date + time, ticket number (`orderNumber` or last 8 chars of id), cashier name
  - Customer block: "Client: {name}" + "Tél: {phone}" (skips phone if walk-in "N/A")
  - Items table: name (bold), then `x{qty} | unit price | line total` row
  - Subtotal + TOTAL
  - Payment method label (Espèces/Wave/Orange Money/...) + montant reçu
  - Footer "Merci de votre visite !" + "YonuKom — Gestion de vente"
  - Auto-print script `window.onload = () => setTimeout(window.print, 250)` (delay lets logo load)
  - Manual "Imprimer" button (`.no-print` class hidden during print)
- HTML escaping for safety (`escapeHtml` helper).
- 404 fallback: HTML page "Commande introuvable".
- 500 fallback: HTML page "Erreur".

## Task 5 Verification (ProductForm image upload)
- Read `src/components/products/product-form.tsx` and `src/app/api/products/route.ts` POST.
- **Confirmed working**:
  - `ProductForm` has a hidden `<input type="file">` with `accept="image/jpeg,image/png,image/webp"`.
  - `handleFileChange` reads the file via `FileReader.readAsDataURL`, optionally downsizes via canvas (max 800px, quality 0.8, WEBP preferred) → produces base64 data URL.
  - The data URL is stored in `imageUrl` state, included in `onSave()` payload.
  - POST `/api/products` accepts `imageUrl` in body and saves it as `Product.imageUrl`.
- No changes needed — the existing flow works end-to-end.

## Architecture Decisions

### Why add a new "caisse" tab vs. routing to Settings?
The task spec explicitly says "Allez dans l'onglet 'Caisse' pour ouvrir la caisse" — implying a top-level Caisse tab. The existing `CashSessionManager` was buried in Settings → "cash" section. Adding a top-level "caisse" tab gives merchants one-tap access from POS to open the cash register. The Settings→Caisse section is preserved (no breaking change).

### Why create a Payment record on order creation?
The existing code created orders with `paidAmount: 0, remainingAmount: totalAmount` — even though the sale was just encaissée at the counter. This was a logical bug: completed POS sales are paid immediately. Creating a Payment record:
- Marks the order as paid (`paidAmount = totalAmount, remainingAmount = 0`)
- Enables the receipt to show the payment method (Task 3 requirement)
- Properly feeds the cash session's `theoreticalTotal` (sum of payments) — fixing a downstream UX bug where the cash close dialog always showed 0 as theoretical total.

### Why include paymentMethod in the API response?
The frontend success panel needs to display "Paiement: Espèces" without an extra GET request. Including `paymentMethod` in the POST response avoids a round-trip and matches the optimistic UX of the POS.

### Why `customerId: customer?.id ?? null` instead of `?? "walk-in"`?
The API already special-cases `'walk-in'` (creates a default customer named "Client comptoir"). Sending `null` is more idiomatic — the API falls into the same branch (`!customerId || customerId === 'walk-in' || customerId.trim() === ''`). This avoids sending the magic string from the client.

## Build Verification
- `npx next build` → ✓ Compiled successfully in 18.2s, 61/61 static pages generated.
- New route registered: `├ ƒ /api/orders/[id]/receipt`.
- `bun run lint` → no new errors introduced. Pre-existing warnings (set-state-in-effect on `theme-toggle.tsx`, `business-logo.ts`, `page.tsx`, `use-auth-store.ts`) are unchanged. Unused eslint-disable warnings on `no-img-element` are pre-existing and apply to the existing product-card/product-form/products-tab patterns.

## UX Flow Summary

1. User opens POS, adds products to cart, opens cart drawer.
2. Cart drawer shows items + payment method selector + total.
3. If cash session is open → user clicks "Encaisser" → POST /api/orders.
   - Backend validates cash session (403 if closed) + creates order + Payment record.
   - Frontend stores `lastOrder`, switches to SuccessPanel.
   - User clicks "Imprimer le ticket" → opens `/api/orders/{id}/receipt` in new tab → browser print dialog auto-opens.
   - User clicks "Nouvelle vente" → cart cleared, drawer closed, ready for next sale.
4. If cash session is closed → "Encaisser" button shows amber/lock icon + "Caisse fermée" badge. Clicking opens "Caisse fermée" dialog → "Ouvrir la caisse" switches to the Caisse tab.
