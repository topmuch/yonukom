# SUPERADMIN-V2 — Subagent L

Work record for the SUPERADMIN-V2 task: Superadmin enhancements (SEO, notifications, subscriptions, dark mode, users, tenants).

## Scope
- Task 1: PlatformSetting model + /api/superadmin/settings + Settings page (SEO + Email sections)
- Task 2: Notification badge in sidebar + "Notifications récentes" card in Overview
- Task 3: Subscriptions — suspend/deactivate/activate/delete actions + plan pricing display + Mensuel/Annuel toggle + PATCH status
- Task 4: Fix dark mode hardcoded colors (replace bg-white/text-slate-900/border-slate-200 with theme-aware tokens)
- Task 5: Users page — suspend/delete + select all + bulk delete + PATCH/DELETE /api/superadmin/users/[id]
- Task 6: Fix tenant detail view (info + quick actions)

## Files Modified
- prisma/schema.prisma — Added PlatformSetting model + "suspended" status doc + billingPeriod field on Subscription
- src/types/index.ts — Added "suspended" status, billingPeriod type, plan annual prices, PlatformSettingData, expanded TenantInfo
- src/components/superadmin/subscription-status-badge.tsx — Added "suspended" status badge
- src/app/api/superadmin/subscriptions/route.ts — Allow "suspended" in status filter
- src/app/api/superadmin/subscriptions/[subscriptionId]/route.ts — Added PATCH (with suspended) + GET + DELETE cascade
- src/app/api/superadmin/tenants/[tenantId]/route.ts — Implemented DELETE cascade
- src/components/superadmin/superadmin-dashboard.tsx — Major rewrite (notifications, settings SEO/Email sections, subscriptions actions, users suspend/delete + select all + bulk delete, dark mode fixes, tenant detail dialog)
- src/components/superadmin/tenant-detail-panel.tsx — Added Business info + Users list + quick actions (Suspendre/Activer/Supprimer)

## Files Created
- src/app/api/superadmin/settings/route.ts — GET (singleton upsert) + PUT (update SEO/Email/Analytics fields)
- src/app/api/superadmin/users/[id]/route.ts — PATCH (isActive, role, name, email, phone) + DELETE (with last-patron protection)
