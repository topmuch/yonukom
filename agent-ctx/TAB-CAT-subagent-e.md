# Task ID: TAB-CAT
# Agent: Subagent E

## Task summary
1. Verified Caisse tab is now a standalone top-level tab (was already added by Subagent D).
2. Added new "Clients" tab (top-level) and removed it from Settings — Settings now only has Profil + Audit + Déconnexion.
3. Fixed logo display on invoice PDF (max 180×80, onerror fallback).
4. Added a dynamic Category model (replacing the hardcoded "Plats/Boissons/..." lists) with API routes + updated UI.

## Files modified
- `src/components/layout/app-shell.tsx` — added `"customers"` to TabId + ALL_TABS (icon Users, gradient rose→pink, accent rose, color #F43F5E).
- `src/app/page.tsx`:
  - Added `<CustomersTab />` (renders `<CustomerList />` inside `ConnectivityBanner` wrapper) for `activeTab === "customers"`.
  - Removed "Clients" + "Caisse" + B2B Credit sections from `SettingsTab` — kept only "Profil" (BusinessProfileEditor) + "Audit" (AuditLogViewer) + "Déconnexion".
  - Updated HomeTab quickActions: "Clients" card now points to `tab: "customers"` (was `tab: "settings"`).
  - Updated HomeTab Caisse quick-action card to point to `tab: "caisse"` (was `tab: "settings"`).
- `src/app/api/invoices/[id]/pdf/route.ts` — updated `.logo` CSS to `max-width: 180px; max-height: 80px; height: auto` + `object-fit: contain` (was 56×56 cover). Added `onerror="this.style.display='none'"` on the logo `<img>` so broken image icons never show on the invoice. If logoUrl is null, the placeholder div with the business initial is shown.
- `prisma/schema.prisma`:
  - Added `categories Category[]` to `Business` model.
  - Added `categoryId String?` + `categoryRef Category? @relation(...)` to `Product` (kept the existing `category String?` for backward compatibility). The relation field is named `categoryRef` to avoid a Prisma name collision with the existing `category String?` column.
  - Added new `Category` model (id, businessId, name, color?, sortOrder, isActive, products[], @@index([businessId]), @@unique([businessId, name])).
- `src/app/api/products/route.ts` (POST) — accepts new `categoryId` field.
- `src/app/api/products/[id]/route.ts` (PUT) — accepts new `categoryId` field in allowedFields.
- `src/components/products/product-card.tsx` — added `categoryId?: string | null` to `ProductCardData` interface.
- `src/components/products/product-form.tsx`:
  - Removed hardcoded `CATEGORIES = ["Plats", "Boissons", ...]` list.
  - Added `useEffect` to fetch `/api/categories?businessId=xxx` when dialog opens.
  - Category Select now lists dynamic categories with optional color dot.
  - Added "+ Nouvelle" link next to the "Catégorie" label that opens a sub-Dialog with name input + 8-preset color picker.
  - POST `/api/categories` creates inline; on success the new category is added to the local list and auto-selected.
  - On submit, both `categoryId` (FK, preferred) and `category` (text, retro-compat) are sent to the API.
- `src/components/products/products-tab.tsx`:
  - Removed hardcoded `CATEGORIES` list.
  - Fetches `/api/categories?businessId=xxx` in parallel with products.
  - Category chips are now dynamic — each chip uses the category's color (if defined) when active, and shows a small color dot when inactive.
  - Added "Autres" chip for products with neither categoryId nor category text (visible only if count > 0).
  - Added orphan category chips (text-based, retro-compat for products created before Category existed).
  - Sends `categoryId` in POST/PUT product requests.
  - Product card badge resolves cat label from categoryId (preferred) → category text fallback, and uses the category color for the dot/border.
- `src/components/pos/pos-screen.tsx`:
  - Removed hardcoded `categoryLabels` map (Plats, Boissons, etc.).
  - Added `fetchCategories` + `categories` state.
  - Category chips now built dynamically from `categories` + orphan text categories (retro-compat).
  - Each chip uses the category's color if defined (style override).
  - Passes `categories` prop to `<ProductGrid />` so it can resolve categoryId → name for filtering.
- `src/components/pos/product-grid.tsx`:
  - Added `categoryId?: string | null` to `ProductItem` interface.
  - Added optional `categories?: CategoryItem[]` prop.
  - Updated filter logic: handles `"all"`, `"<categoryId>"` (matches by categoryId OR by category text matching the category name), and `"orphan:Name"` (text-only match).

## Files created
- `src/app/api/categories/route.ts` — GET (list by businessId) + POST (create with name + optional color + sortOrder). Validates businessId (400), business existence (404), name non-empty (400), color hex format (400). P2002 → 409 "Une catégorie nommée « X » existe déjà.".
- `src/app/api/categories/[id]/route.ts` — PATCH (update name/color/sortOrder/isActive, with businessId ownership check) + DELETE (sets products.categoryId to NULL first, then deletes the category).

## Build verification
- `cd /home/z/my-project/yonukom && npx prisma generate` → ✓ Generated Prisma Client (v6.19.2)
- `cd /home/z/my-project/yonukom && npx prisma db push` → ✓ Database in sync
- `cd /home/z/my-project/yonukom && npx next build` → ✓ Compiled successfully in 18.6s (62/62 static pages generated).
- New routes registered: `/api/categories`, `/api/categories/[id]`.
- `bun run lint` → 8 pre-existing errors (set-state-in-effect in page.tsx/business-logo.ts/theme-toggle.ts/superadmin-dashboard.tsx + no-require-imports in use-auth-store.ts) — **0 new errors introduced** by my changes. Only warnings are unused eslint-disable directives on `<img>` tags (preserved from previous agents' code).

## Notes for next agent
- The relation field is named `categoryRef` (not `category`) in the Product model because Prisma doesn't allow two fields with the same name. The `categoryId` FK is the source of truth; the legacy `category String?` text column is kept for backward compatibility but should be considered deprecated.
- The ProductForm now sends both `categoryId` and `category` (the latter = the category NAME) so the API can save both. This ensures existing POS filtering logic that matches by `category` text continues to work for older products.
- When a Category is deleted, products referencing it get `categoryId = NULL` (they don't get deleted). The legacy `category` text field (if it was set) remains intact, so the product keeps its category label.
- The SettingsTab is now minimal: only "Profil" + "Audit" + "Déconnexion" buttons. The "Clients" section is now its own top-level tab (CustomersTab → CustomerList). The "Caisse" section was already moved to a top-level tab by Subagent D; I removed the duplicate from Settings.
- The invoice PDF logo now properly handles both data URLs (base64) and regular URLs, with `onerror` fallback to hide broken images and `max-width: 180px; max-height: 80px` for proper aspect ratio.
