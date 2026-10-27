# Task ID: HIST-DEBT-CUST — Work Record
**Agent:** Subagent G

## Task Scope
1. Enhance Order History (print button + new POS statuses + filters + mark-as-paid)
2. Enhance Debts Dashboard (new Debt model + create/encaisser/details dialogs + dates)
3. Add customer address field (UI + form + API verification)

## Files Modified
- `prisma/schema.prisma` — added Debt model + relations on Business/Customer/Order
- `src/app/api/debts/route.ts` — rewritten: GET list + POST create
- `src/app/api/debts/[id]/route.ts` — NEW: GET/PATCH/DELETE
- `src/app/api/orders/[id]/route.ts` — PUT: paid/unpaid/delivered/paidAmount handling
- `src/components/orders/order-history.tsx` — print button, new badges, filters, mark-as-paid
- `src/components/customers/debts-dashboard.tsx` — full rewrite: per-debt table + 3 dialogs
- `src/components/customers/customer-card.tsx` — address field + display
- `src/components/customers/customer-form.tsx` — address Textarea + persist on save
- `src/components/customers/customer-list.tsx` — PUT on edit, search includes address

## Key Decisions
- **Debt storage**: chose the dedicated `Debt` Prisma model approach (not reusing Order) — cleaner separation, supports standalone debts (no command), has its own `paymentHistory` JSON.
- **Order payment badge logic**: derived from `paidAmount` vs `totalAmount`, not from `status` — matches the task spec exactly (paid / partial / unpaid / pending / cancelled).
- **Mark-as-paid API**: uses `PUT /api/orders/[id] { status: "paid" }` (existing PUT method, not PATCH). The backend forces `paidAmount = totalAmount` when status is "paid".
- **Customer edits persistence**: previously customer-list only updated locally on edit; now calls `PUT /api/customers/[id]` with full field set including address.

## Build Verification
- `npx prisma db push` — DB in sync, Prisma Client regenerated.
- `npx next build` — ✓ Compiled successfully (62/62 static pages, 0 errors).
- `bun run lint` — 0 errors in any of my files (8 pre-existing errors in unrelated files).

## Response Shape Changes (Breaking)
- `/api/debts` GET response shape changed from `{ customers: [], totalDebt, count }` to `{ debts: [], totalDebt, totalRemaining, count }`. Only `debts-dashboard.tsx` consumed the old shape (now updated).
