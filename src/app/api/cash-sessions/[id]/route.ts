// ============================================================
// YonuKom — Cash Session Detail API
// GET: Get a specific cash session
// PUT: Close a cash session (declare cash, calculate variance)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cash-sessions/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await db.cashSession.findUnique({
      where: { id },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Cash session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching cash session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cash session' },
      { status: 500 }
    )
  }
}

// PUT /api/cash-sessions/[id] — Close a cash session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { declaredTotal, closedBy } = body

    if (declaredTotal === undefined || !closedBy) {
      return NextResponse.json(
        { error: 'declaredTotal and closedBy are required' },
        { status: 400 }
      )
    }

    // Get the session
    const session = await db.cashSession.findUnique({
      where: { id },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Cash session not found' },
        { status: 404 }
      )
    }

    if (session.closedAt) {
      return NextResponse.json(
        { error: 'Cette caisse est déjà fermée.' },
        { status: 409 }
      )
    }

    // Calculate theoretical total from payments received during this session
    const payments = await db.payment.findMany({
      where: {
        createdAt: {
          gte: session.openedAt,
        },
        order: {
          businessId: session.businessId,
        },
      },
    })

    const theoreticalTotal = payments.reduce((sum, p) => sum + p.amount, 0)
    const declared = Number(declaredTotal)
    const difference = declared - theoreticalTotal

    // Close the session
    const closedSession = await db.cashSession.update({
      where: { id },
      data: {
        closedAt: new Date(),
        closedBy,
        theoreticalTotal,
        declaredTotal: declared,
        difference,
        isActive: false,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'cash_close',
        entityType: 'cash_session',
        entityId: id,
        userId: closedBy,
        businessId: session.businessId,
        details: JSON.stringify({
          theoreticalTotal,
          declaredTotal: declared,
          difference,
          sessionDuration: new Date().getTime() - session.openedAt.getTime(),
        }),
      },
    })

    return NextResponse.json(closedSession)
  } catch (error) {
    console.error('Error closing cash session:', error)
    return NextResponse.json(
      { error: 'Failed to close cash session' },
      { status: 500 }
    )
  }
}
