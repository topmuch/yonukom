import { db } from '@/lib/db';

/**
 * Monthly Recurring Revenue: Sum of all active subscription amounts in FCFA.
 */
export async function calculateMRR(): Promise<number> {
  const result = await db.subscription.aggregate({
    _sum: { amount: true },
    where: { status: 'active' },
  });

  return result._sum.amount ?? 0;
}

/**
 * Activation Rate: Percentage of tenants that have at least 1 order.
 * (active tenants / total tenants * 100)
 */
export async function calculateActivationRate(): Promise<number> {
  const [totalTenants, tenantsWithOrders] = await Promise.all([
    db.tenant.count(),
    db.tenant.findMany({
      where: {
        businesses: {
          some: {
            orders: { some: {} },
          },
        },
      },
      select: { id: true },
    }),
  ]);

  if (totalTenants === 0) return 0;

  return (tenantsWithOrders.length / totalTenants) * 100;
}

/**
 * Churn Rate: Percentage of cancelled subscriptions.
 * (cancelled subs / total subs * 100)
 */
export async function calculateChurnRate(): Promise<number> {
  const [totalSubs, cancelledSubs] = await Promise.all([
    db.subscription.count(),
    db.subscription.count({ where: { status: 'cancelled' } }),
  ]);

  if (totalSubs === 0) return 0;

  return (cancelledSubs / totalSubs) * 100;
}

/**
 * Aggregated tenant metrics for the superadmin dashboard.
 */
export async function getTenantMetrics() {
  const [
    totalTenants,
    activeTenantsList,
    mrr,
    activationRate,
    churnRate,
    pastDueCount,
    expiredCount,
  ] = await Promise.all([
    db.tenant.count(),
    db.tenant.findMany({
      where: {
        businesses: {
          some: {
            orders: { some: {} },
          },
        },
      },
      select: { id: true },
    }),
    calculateMRR(),
    calculateActivationRate(),
    calculateChurnRate(),
    db.subscription.count({ where: { status: 'past_due' } }),
    db.subscription.count({ where: { status: 'expired' } }),
  ]);

  return {
    totalTenants,
    activeTenants: activeTenantsList.length,
    mrr,
    activationRate,
    churnRate,
    pastDueCount,
    expiredCount,
  };
}

/**
 * Revenue by month for the last N months of MRR data (for charting).
 * Returns an array of { month: string, revenue: number }.
 * Month format: "YYYY-MM"
 */
export async function getRevenueByMonth(months: number = 12): Promise<{ month: string; revenue: number }[]> {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  // Fetch all completed subscription payments within the window
  const payments = await db.subscriptionPayment.findMany({
    where: {
      status: 'completed',
      paymentDate: { gte: startDate },
    },
    select: {
      amount: true,
      paymentDate: true,
    },
    orderBy: { paymentDate: 'asc' },
  });

  // Build a map of month -> revenue
  const revenueMap = new Map<string, number>();

  // Initialize all months in the range with 0
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    revenueMap.set(key, 0);
  }

  // Accumulate payments into their respective months
  for (const payment of payments) {
    const d = payment.paymentDate;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (revenueMap.has(key)) {
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + payment.amount);
    }
  }

  // Convert to sorted array (oldest first)
  return Array.from(revenueMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));
}

/**
 * Subscription breakdown: count of active subscriptions by plan.
 */
export async function getSubscriptionBreakdown(): Promise<{
  starter: number;
  pro: number;
  enterprise: number;
}> {
  const [starter, pro, enterprise] = await Promise.all([
    db.subscription.count({ where: { plan: 'starter', status: 'active' } }),
    db.subscription.count({ where: { plan: 'pro', status: 'active' } }),
    db.subscription.count({ where: { plan: 'enterprise', status: 'active' } }),
  ]);

  return { starter, pro, enterprise };
}

/**
 * Recent platform logs ordered by createdAt descending.
 */
export async function getRecentPlatformLogs(limit: number = 50) {
  return db.platformLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
