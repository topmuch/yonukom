// ============================================================
// YonuKom — Cash Sessions API
// GET: List cash sessions for a business
// POST: Open a new cash session
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cash-sessions?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    const sessions = await db.cashSession.findMany({
      where: { businessId },
      orderBy: { openedAt: 'desc' },
    })

    // Check if there's an active (open) session
    const activeSession = sessions.find((s) => s.isActive && !s.closedAt)

    return NextResponse.json({
      sessions,
      activeSession: activeSession || null,
    })
  } catch (error) {
    console.error('Error fetching cash sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash sessions' },
      { status: 500 }
    )
  }
}

// POST /api/cash-sessions — Open a new cash session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, openedBy } = body

    if (!businessId || !openedBy) {
      return NextResponse.json(
        { error: 'businessId and openedBy are required' },
        { status: 400 }
      )
    }

    // Check if there's already an active session
    const existingActive = await db.cashSession.findFirst({
      where: { businessId, isActive: true, closedAt: null },
    })

    if (existingActive) {
      return NextResponse.json(
        { error: 'Une caisse est déjà ouverte. Fermez-la avant d\'en ouvrir une nouvelle.' },
        { status: 409 }
      )
    }

    const session = await db.cashSession.create({
      data: {
        businessId,
        openedBy,
        isActive: true,
        openedAt: new Date(),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'cash_open',
        entityType: 'cash_session',
        entityId: session.id,
        userId: openedBy,
        businessId,
        details: JSON.stringify({ openedAt: session.openedAt }),
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error opening cash session:', error)
    return NextResponse.json(
      { error: 'Failed to open cash session' },
      { status: 500 }
    )
  }
}
