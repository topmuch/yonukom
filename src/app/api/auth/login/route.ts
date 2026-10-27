// ============================================================
// YonuKom — Auth API
// POST: Login with email + password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken } from '@/lib/auth'

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

    // Vérification du mot de passe avec bcrypt
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      // Create audit log for failed login
      await db.auditLog.create({
        data: {
          action: 'login_failed',
          entityType: 'user',
          entityId: user.id,
          userId: user.id,
          businessId: user.businessId ?? 'unknown',
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
        businessId: user.businessId ?? 'unknown',
        details: JSON.stringify({ email, role: user.role }),
      },
    })

    // Return user info (without password)
    // Generate a JWT token for stateless authentication.
    // The frontend stores this token in localStorage and sends it
    // back in the Authorization header ("Bearer <token>") for any
    // API route that requires auth (via the `withAuth` wrapper).
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name ?? '',
      },
      // Inclure la config d'onboarding du business pour que le frontend
      // puisse savoir si l'utilisateur a déjà fait l'onboarding ou non.
      // Si null → nouvel utilisateur → onboarding à refaire.
      onboardingConfig: user.business?.onboardingConfig ?? null,
      token,
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Erreur de connexion' },
      { status: 500 }
    )
  }
}
