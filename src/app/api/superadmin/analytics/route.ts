import { NextResponse } from 'next/server';
import {
  getTenantMetrics,
  getRevenueByMonth,
  getSubscriptionBreakdown,
} from '@/lib/analytics/superadmin-metrics';

export async function GET() {
  try {
    const [tenantMetrics, revenueByMonth, subscriptionBreakdown] = await Promise.all([
      getTenantMetrics(),
      getRevenueByMonth(),
      getSubscriptionBreakdown(),
    ]);

    // Return flat structure matching PlatformMetrics type
    return NextResponse.json({
      totalTenants: tenantMetrics.totalTenants,
      activeTenants: tenantMetrics.activeTenants,
      mrr: tenantMetrics.mrr,
      activationRate: tenantMetrics.activationRate,
      churnRate: tenantMetrics.churnRate,
      pastDueCount: tenantMetrics.pastDueCount,
      expiredCount: tenantMetrics.expiredCount,
      totalRevenue: tenantMetrics.mrr,
      revenueByMonth,
      subscriptionBreakdown,
    });
  } catch (error) {
    console.error('[Superadmin] Failed to get analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get platform analytics' },
      { status: 500 }
    );
  }
}
