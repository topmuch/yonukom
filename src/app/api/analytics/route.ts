// ============================================================
// YonuKom — Analytics API
// GET: Dashboard analytics (sales, revenue, top products, trends)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/analytics?businessId=xxx&period=today|week|month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const period = searchParams.get('period') || 'today'

    if (!businessId) {
      // Pas de businessId → retourner un état vide (PLUS de données mock).
      // Les nouveaux comptes et les visiteurs non connectés doivent voir
      // un dashboard vide, pas des chiffres aléatoires qui faussent la
      // perception du commerçant.
      return NextResponse.json(getEmptyAnalytics(period))
    }

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now)
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }

    // Fetch orders in period
    const orders = await db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate },
        isCancelled: false,
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalPaid = orders.reduce((sum, o) => sum + o.paidAmount, 0)
    const totalRemaining = orders.reduce((sum, o) => sum + o.remainingAmount, 0)
    const orderCount = orders.length

    // Average order value
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

    // Payment method breakdown
    const paymentBreakdown: Record<string, number> = {}
    orders.forEach((o) => {
      o.payments.forEach((p) => {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] || 0) + p.amount
      })
    })

    // Top products by revenue
    const productRevenue: Record<string, { name: string; revenue: number; quantity: number }> = {}
    orders.forEach((o) => {
      o.orderItems.forEach((item) => {
        const key = item.productId
        if (!productRevenue[key]) {
          productRevenue[key] = {
            name: item.product?.name || 'Inconnu',
            revenue: 0,
            quantity: 0,
          }
        }
        productRevenue[key].revenue += item.totalPrice
        productRevenue[key].quantity += item.quantity
      })
    })
    const topProducts = Object.values(productRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Daily revenue for chart (last 7 days or last 30 days)
    const days = period === 'month' ? 30 : period === 'week' ? 7 : 1
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now)
      dayStart.setDate(dayStart.getDate() - i)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const dayOrders = orders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
      )
      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: dayOrders.length,
      })
    }

    // Cancelled orders count
    const cancelledOrders = await db.order.count({
      where: {
        businessId,
        createdAt: { gte: startDate },
        isCancelled: true,
      },
    })

    // Low stock products
    const lowStockProducts = await db.product.findMany({
      where: {
        businessId,
        isActive: true,
        quantity: { lte: db.product.fields.minStockAlert },
      },
      take: 5,
      orderBy: { quantity: 'asc' },
    })

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      metrics: {
        totalRevenue,
        totalPaid,
        totalRemaining,
        orderCount,
        avgOrderValue,
        cancelledOrders,
      },
      paymentBreakdown,
      topProducts,
      dailyRevenue,
      lowStockProducts,
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// État vide pour les nouveaux comptes et les visiteurs non connectés.
// On ne retourne PLUS de données mock aléatoires : un nouveau commerçant
// doit voir 0 FCFA partout, pas un faux chiffre d'affaires qui pourrait
// le faire douter de la fiabilité du logiciel.
function getEmptyAnalytics(period: string) {
  const now = new Date()
  const days = period === 'month' ? 30 : period === 'week' ? 7 : 1

  const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dailyRevenue.push({
      date: d.toISOString().split('T')[0],
      revenue: 0,
      orders: 0,
    })
  }

  return {
    period,
    startDate: new Date(now.getTime() - days * 86400000).toISOString(),
    endDate: now.toISOString(),
    metrics: {
      totalRevenue: 0,
      totalPaid: 0,
      totalRemaining: 0,
      orderCount: 0,
      avgOrderValue: 0,
      cancelledOrders: 0,
    },
    paymentBreakdown: {
      wave: 0,
      orange_money: 0,
      cash: 0,
      cb: 0,
    },
    topProducts: [],
    dailyRevenue,
    lowStockProducts: [],
  }
}
