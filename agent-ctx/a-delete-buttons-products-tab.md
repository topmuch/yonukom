# Task A — Delete Buttons + Products Tab

**Agent:** Subagent A
**Date:** Session A
**Scope:** Add delete buttons to 4 existing UI components (order-history, customer-list, invoice-list, pipeline-quotes) using AlertDialog confirmation + add a dedicated Products tab to the sidebar.

## What was done

### API additions (DELETE handlers)

1. **`/api/orders/[id]/route.ts`** — added `DELETE`
   - Validates `?businessId=xxx` (400 if missing)
   - Returns 404 if order not found, 403 if businessId mismatch
   - Transactional cascade: deletes `orderItems` + `payments`, nulls out `invoices.orderId`, nulls out `stockMovement.orderId` (string field, no FK), nulls out `commission.orderId` (preserve audit trail), then deletes the `order`.

2. **`/api/customers/[id]/route.ts`** — added `DELETE`
   - Validates `?businessId=xxx` (400 if missing)
   - Returns 404 if customer not found, 403 if businessId mismatch
   - **409 if customer has outstanding (non-cancelled) orders** — body `{ error, code: "HAS_OUTSTANDING_ORDERS", count }`
   - Otherwise: transactional cascade — nulls out `invoices.customerId`, deletes any cancelled orders (with their items/payments/commission references), nulls stockMovement.orderId, then deletes the customer.

3. **`/api/quotes/[id]/route.ts`** — added `DELETE`
   - Validates `?businessId=xxx` (400 if missing)
   - Verifies the order is a B2B quote (status in draft/quote_validated/delivery_note/invoiced/cancelled)
   - Returns 404/403 as appropriate
   - For `quote_validated` status, releases reserved stock (decrement `reservedQuantity` + create `reservation_release` StockMovement) before deletion
   - Cascade: delete orderItems + payments, null invoices.orderId, null stockMovement.orderId, null commission.orderId, delete order.

4. **`/api/products/[id]/route.ts`** — added `businessId` validation to existing `DELETE`
   - Existing handler required `?userRole=patron|gerant` (kept)
   - Added `?businessId=xxx` validation (400 if missing, 403 if mismatch)
   - Soft delete (sets `isActive = false`)

### UI changes (4 components)

All four use the shadcn/ui **AlertDialog** component (`@/components/ui/alert-dialog`) with the standardized confirmation copy "Supprimer cette commande/client/facture/devis ? Cette action est irréversible." and a red destructive action button. After successful deletion, the list refreshes (state update + toast.success). On error, a toast.error is shown. Each delete button has a `Loader2` spinner during the in-flight request.

1. **`order-history.tsx`** — Trash2 button added in both the desktop table Actions cell and the mobile card footer. Uses `useAuthStore` for `businessId`. DELETE → `/api/orders/[id]?businessId=xxx`.

2. **`customer-list.tsx`** — Trash2 button on each customer row (alongside CustomerCard). Uses `useAuthStore` for `businessId`. DELETE → `/api/customers/[id]?businessId=xxx`. **Optimistic removal** + restore-on-409 — friendly toast shows "Impossible de supprimer ce client : N commande(s) en cours y sont rattachées…". 404 (mock customers not in DB) is treated as success since the row was already optimistically removed.

3. **`invoice-list.tsx`** — Refactored the existing `confirm()`-based delete to use AlertDialog. Reuses the existing `deletingId` state. DELETE → `/api/invoices/[id]?businessId=xxx`.

4. **`pipeline-kanban.tsx`** — Added a "Supprimer ce devis" button at the bottom of the QuoteDetailPanel (the dialog shown when a user clicks a quote). DELETE → `/api/quotes/[id]?businessId=xxx`. On success: closes the detail dialog, removes the quote from local state, toast.success. Passes `deleting` prop to the panel to disable the button during request.

### Products Tab (Task 2)

1. **Created `src/components/products/products-tab.tsx`**
   - Header with "Produits" title + "Nouveau produit" button (opens `ProductForm` dialog)
   - Search input (by name or SKU) with clear button
   - Category filter chips ("Tous" + categories derived from the actual product list, with counts)
   - Responsive product grid (2 / 3 / 4 cols): image (or Package placeholder), category badge, stock dot indicator, name, SKU, sale price (FCFA), stock badge with color coding:
     - `quantity === 0` → red "Rupture"
     - `quantity < 5` → red
     - `quantity < 10` → amber
     - `quantity ≥ 10` → emerald
   - Each card has Edit + Delete buttons (Delete only visible if `user.role` is patron/gerant per existing API permission)
   - Empty state: "Aucun produit. Cliquez sur 'Nouveau produit' pour ajouter votre premier article."
   - AlertDialog confirmation for delete
   - Save flow: POST for create, PUT for update (existing `/api/products` and `/api/products/[id]` routes)
   - After every save/delete, refreshes state + toast feedback

2. **Updated `src/components/layout/app-shell.tsx`**
   - Added `"products"` to the `TabId` union type
   - Imported `Boxes` icon from lucide-react
   - Added new entry to `ALL_TABS` between `stock` and `orders`:
     - id: "products", label: "Produits", icon: `Boxes`
     - gradient: "from-purple-500 to-indigo-500"
     - accent: "bg-purple-500"
     - color: "#A855F7"

3. **Updated `src/app/page.tsx`**
   - Imported `ProductsTab` from `@/components/products/products-tab`
   - Added `{activeTab === "products" && <ProductsTab />}` immediately after the `stock` tab render condition

## Build verification

`npx next build` succeeds:
```
✓ Compiled successfully in 18.3s
✓ Generating static pages using 1 worker (61/61) in 450.6ms
```

## Notes / decisions

- **Mock customers** (from `/api/ecom-customers`) won't be in the real DB → DELETE returns 404. The customer-list treats 404 as success (row already optimistically removed). 409 (real outstanding orders) properly restores the row + shows friendly error.
- **Cascades**: all DELETE handlers preserve audit-trail data — invoices, stockMovements, commissions have their orderId/customerId nulled out (rather than deleted) where the relation is nullable. OrderItems and Payments are deleted outright since they have no independent audit value.
- **Stock reservation release**: the quotes DELETE handler releases reserved stock for `quote_validated` quotes (creating a `reservation_release` StockMovement with reason "Devis supprimé"). For `delivery_note`/`invoiced`/`cancelled` statuses, stock was already physically removed or released — no reversal needed.
- The Products tab's delete button is only rendered for `patron` and `gerant` roles (mirroring the existing role check in `/api/products/[id]` DELETE).
