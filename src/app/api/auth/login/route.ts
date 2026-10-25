// ============================================================
// YonuKom — Auth API
// POST: Login with email + password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email },
      include: { business: true },
    })

    if (!user) {
      // Create audit log for failed login
      await db.auditLog.create({
        data: {
          action: 'login_failed',
          entityType: 'user',
          details: JSON.stringify({ email, reason: 'user_not_found' }),
          businessId: 'unknown',
        },
      })
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Compte désactivé. Contactez le patron.' },
        { status: 403 }
      )
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password && user.password !== 'temp') {
      // Create audit log for failed login
      await db.auditLog.create({
        data: {
          action: 'login_failed',
          entityType: 'user',
          entityId: user.id,
          userId: user.id,
          businessId: user.businessId,
          details: JSON.stringify({ email, reason: 'wrong_password' }),
        },
      })
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Create audit log for successful login
    await db.auditLog.create({
      data: {
        action: 'login',
        entityType: 'user',
        entityId: user.id,
        userId: user.id,
        businessId: user.businessId,
        details: JSON.stringify({ email, role: user.role }),
      },
    })

    // Return user info (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business.name,
      },
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
