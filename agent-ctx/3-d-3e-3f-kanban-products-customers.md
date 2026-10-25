# Task 3-d-3e-3f — Kanban + Products + Customers + Stock Agent

## Task Summary
Create Order Kanban board, Product management, Customer management, and Stock dashboard components for YonuKom.

## Work Completed

### Mock API Routes (3 files)
- `/api/ecom-orders/route.ts` — 7 mock orders (3 to_pay, 2 to_ship, 2 shipped) with GET (filter by status) and PUT (update status)
- `/api/ecom-customers/route.ts` — 6 mock Sénégalais customers with GET (search by name/phone) and POST (create)
- `/api/ecom-products/route.ts` — 25 products with full fields (sku, purchasePrice, reservedQuantity, etc.) with GET, POST, PUT

### Order Components (3 files)
- `order-kanban.tsx` — 3-column Kanban (À Payer / À Livrer / Livré), responsive grid, ScrollArea, AnimatePresence, empty state
- `order-card.tsx` — Order number, customer, FCFA total, time ago, payment badge, WhatsApp button, status transition buttons, color-coded left border
- `order-detail-dialog.tsx` — Full order details dialog with items, totals, payments, WhatsApp link, delivery address, status actions

### Product Components (3 files)
- `product-list.tsx` — Search, category filter tabs, 2/3-col grid, add button, loading skeleton, empty state
- `product-card.tsx` — Name, FCFA price, stock color coding (red/amber/green), category badge, SKU
- `product-form.tsx` — Dialog form for create/edit with all product fields

### Customer Components (3 files)
- `customer-list.tsx` — Search by name/phone, quick add, customer rows with badges
- `customer-card.tsx` — Avatar initial, name, phone link, payment/B2B badges, orders count
- `customer-form.tsx` — Quick add (name + phone) + full edit (payment method, B2B)

### Stock Components (2 files)
- `stock-dashboard.tsx` — Summary cards, stock issue filtering, B2B reservation awareness, loss declaration, view switcher
- `loss-dialog.tsx` — Declare loss dialog (quantity + reason)

### Integration
- Updated `page.tsx` — Stock tab → StockDashboard, Orders tab → OrderKanban, Settings tab → CustomerList, Home tab → 4 quick actions

## Key Decisions
- Used `key` prop on form dialogs to force remount (avoids useEffect setState lint error)
- No drag-and-drop on mobile — action buttons on each card instead
- Stock dashboard has dual view: dashboard (summary + issues) and product list (full CRUD)
- Customer management is in Settings tab (fast access for merchants)
