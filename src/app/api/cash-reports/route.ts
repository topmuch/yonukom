// ============================================================
// YonuKom — Cash Reports API
// GET /api/cash-reports?businessId=xxx&period=day|week|month|year
//
// Agrège, pour la période demandée :
//   - CA total, nb commandes, panier moyen, annulations
//   - Répartition des paiements par moyen (cash, wave, OM, cb…)
//   - Décomposition journalière / mensuelle (pour graphique)
//   - Sessions de caisse de la période (théorique, déclaré, écart)
//     → chaque session fermée expose son id pour ouvrir le livre
//       de clôture (/api/cash-sessions/[id]/closure-book)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Period = 'day' | 'week' | 'month' | 'year'

const VALID_PERIODS: Period[] = ['day', 'week', 'month', 'year']

function getRange(period: Period): { start: Date; end: Date; label: string } {
  const now = new Date()
  const end = new Date(now)
  let start: Date
  let label: string

  switch (period) {
    case 'day': {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      label = "Aujourd'hui"
      break
    }
    case 'week': {
      // Lundi de la semaine courante
      const day = now.getDay() // 0 = dimanche
      const diffToMonday = day === 0 ? 6 : day - 1
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0)
      label = 'Cette semaine'
      break
    }
    case 'month': {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      break
    }
    case 'year':
    default: {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      label = String(now.getFullYear())
      break
    }
  }

  return { start, end, label }
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const periodParam = (searchParams.get('period') ?? 'day') as Period

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    const period: Period = VALID_PERIODS.includes(periodParam) ? periodParam : 'day'
    const { start, end, label } = getRange(period)

    // ---------- Ventes de la période ----------
    const orders = await db.order.findMany({
      where: {
        businessId,
        createdAt: { gte: start, lte: end },
      },
      include: { payments: true },
      orderBy: { createdAt: 'asc' },
      take: 5000, // safety cap
    })

    const validOrders = orders.filter((o) => !o.isCancelled)
    const cancelledCount = orders.length - validOrders.length

    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const orderCount = validOrders.length
    const averageTicket = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0

    // ---------- Répartition par moyen de paiement ----------
    const payments: Record<string, number> = {}
    for (const o of validOrders) {
      for (const p of o.payments) {
        payments[p.method] = (payments[p.method] ?? 0) + p.amount
      }
    }

    // ---------- Décomposition temporelle ----------
    // day  → barres par heure (0-23)
    // week → barres par jour (7)
    // month→ barres par jour du mois
    // year → barres par mois (12)
    const buckets: { key: string; label: string; revenue: number; orders: number }[] = []

    if (period === 'day') {
      for (let h = 0; h < 24; h++) {
        buckets.push({
          key: String(h),
          label: `${String(h).padStart(2, '0')}h`,
          revenue: 0,
          orders: 0,
        })
      }
      for (const o of validOrders) {
        const h = o.createdAt.getHours()
        buckets[h].revenue += o.totalAmount
        buckets[h].orders += 1
      }
    } else if (period === 'week' || period === 'month') {
      const cursor = new Date(start)
      while (cursor <= end) {
        buckets.push({
          key: dayKey(cursor),
          label: cursor.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
          revenue: 0,
          orders: 0,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      const byKey = new Map(buckets.map((b) => [b.key, b]))
      for (const o of validOrders) {
        const b = byKey.get(dayKey(o.createdAt))
        if (b) {
          b.revenue += o.totalAmount
          b.orders += 1
        }
      }
    } else {
      // year → 12 mois
      for (let m = 0; m < 12; m++) {
        buckets.push({
          key: String(m),
          label: new Date(2000, m, 1).toLocaleDateString('fr-FR', { month: 'short' }),
          revenue: 0,
          orders: 0,
        })
      }
      for (const o of validOrders) {
        const m = o.createdAt.getMonth()
        buckets[m].revenue += o.totalAmount
        buckets[m].orders += 1
      }
    }

    // ---------- Sessions de caisse de la période ----------
    const sessions = await db.cashSession.findMany({
      where: {
        businessId,
        openedAt: { gte: start, lte: end },
      },
      orderBy: { openedAt: 'desc' },
      take: 200,
    })

    const closedSessions = sessions.filter((s) => s.closedAt)
    const totalTheoretical = sessions.reduce((sum, s) => sum + (s.theoreticalTotal ?? 0), 0)
    const totalDeclared = sessions.reduce((sum, s) => sum + (s.declaredTotal ?? 0), 0)
    const totalDifference = sessions.reduce((sum, s) => sum + (s.difference ?? 0), 0)

    return NextResponse.json({
      period,
      label,
      range: { start: start.toISOString(), end: end.toISOString() },
      sales: {
        totalRevenue,
        orderCount,
        cancelledCount,
        averageTicket,
      },
      payments,
      buckets,
      sessions: {
        count: sessions.length,
        closedCount: closedSessions.length,
        totalTheoretical,
        totalDeclared,
        totalDifference,
        list: sessions,
      },
    })
  } catch (error) {
    console.error('[GET /api/cash-reports] error:', error)
    return NextResponse.json(
      { error: 'Failed to build cash report' },
      { status: 500 }
    )
  }
}
