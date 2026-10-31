// ============================================================
// YonuKom — Stats API
// GET /api/stats?businessId=xxx&period=today|week|month
// Retourne des KPI agrégés pour le dashboard Statistiques :
//   - totalRevenue, orderCount, avgOrderValue
//   - paymentBreakdown { cash, wave, orange_money, cb }
//   - topProducts [{ name, quantity, revenue }]
//   - dailyRevenue [{ date, revenue, orders }]
// Seules les commandes non annulées sont comptées (status !== "cancelled").
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Period = 'today' | 'week' | 'month'

function computeStartDate(period: Period): Date {
  const now = new Date()
  switch (period) {
    case 'today':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    case 'week':
      return new Date(now.getTime() - 7 * 86400000)
    case 'month':
      return new Date(now.getTime() - 30 * 86400000)
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
}

function getDays(period: Period): number {
  return period === 'month' ? 30 : period === 'week' ? 7 : 1
}

function getEmptyStats(period: Period) {
  const now = new Date()
  const days = getDays(period)
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    dailyRevenue.push({
      date: d.toISOString().split('T')[0],
      revenue: 0,
      orders: 0,
    })
  }
  return {
    period,
    totalRevenue: 0,
    orderCount: 0,
    avgOrderValue: 0,
    paymentBreakdown: { cash: 0, wave: 0, orange_money: 0, cb: 0 },
    topProducts: [],
    dailyRevenue,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const periodParam = searchParams.get('period') || 'today'
    const period: Period = ['today', 'week', 'month'].includes(periodParam)
      ? (periodParam as Period)
      : 'today'

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }

    const startDate = computeStartDate(period)

    // Récupère toutes les commandes (non annulées) sur la période, avec leurs items + payments
    const orders = await db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: startDate },
        // On exclut les commandes "cancelled" — on garde tout le reste
        // (completed, paid, partial, draft, etc. — tout ce qui représente du CA réel ou potentiel).
        NOT: { status: 'cancelled' },
      },
      include: {
        orderItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    if (orders.length === 0) {
      return NextResponse.json(getEmptyStats(period))
    }

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

    // Ventes par moyen de paiement (somme des Payment par méthode)
    const paymentBreakdown = { cash: 0, wave: 0, orange_money: 0, cb: 0 }
    for (const o of orders) {
      for (const p of o.payments) {
        if (p.method in paymentBreakdown) {
          paymentBreakdown[p.method as keyof typeof paymentBreakdown] += p.amount
        }
      }
    }

    // Top produits : on agrège par productId
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const o of orders) {
      for (const item of o.orderItems) {
        const key = item.productId
        const name = item.product?.name ?? 'Article'
        if (!productMap[key]) {
          productMap[key] = { name, quantity: 0, revenue: 0 }
        }
        productMap[key].quantity += item.quantity
        productMap[key].revenue += item.totalPrice
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // CA journalier (par jour)
    const days = getDays(period)
    const now = new Date()
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 86400000)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 86400000)
      const dayOrders = orders.filter(
        (o) => o.createdAt >= dayStart && o.createdAt < dayEnd
      )
      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: dayOrders.length,
      })
    }

    return NextResponse.json({
      period,
      totalRevenue,
      orderCount,
      avgOrderValue,
      paymentBreakdown,
      topProducts,
      dailyRevenue,
    })
  } catch (error) {
    console.error('[GET /api/stats] error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
