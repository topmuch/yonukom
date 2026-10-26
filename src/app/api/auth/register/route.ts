// ============================================================
// YonuKom — Auth API — Register
// POST: Create a new user with hashed password
// Creates Business + Tenant + User (role=patron) in a transaction.
// Does NOT auto-login the user — they must log in via /api/auth/login.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      phone,
      businessName,
      identifier, // username / identifier
      password,
    } = body

    // Validate required fields
    if (!name || !email || !businessName || !password) {
      return NextResponse.json(
        { error: 'Nom, email, nom du commerce et mot de passe sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Check for existing user (email must be unique)
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create Business + Tenant + User (patron) in a transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create Tenant (superadmin view of the business)
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          ownerName: name,
          ownerEmail: email,
          ownerPhone: phone ?? '',
          businessType: 'retail_shop',
          config: null,
        },
      })

      // 2. Create Business (tenant-scoped entity)
      const business = await tx.business.create({
        data: {
          name: businessName,
          type: 'mixte',
          phone: phone ?? null,
          currency: 'XOF',
          country: 'SN',
          tenantId: tenant.id,
          onboardingCompleted: false,
        },
      })

      // 3. Create the patron user (linked to business + tenant)
      const user = await tx.user.create({
        data: {
          email,
          name,
          phone: phone ?? null,
          password: hashedPassword,
          role: 'patron',
          isActive: true,
          businessId: business.id,
          tenantId: tenant.id,
        },
      })

      // 4. Seed a starter subscription (30 days trial)
      const now = new Date()
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: 'starter',
          status: 'active',
          amount: 5000,
          currentPeriodStart: now,
          currentPeriodEnd: thirtyDays,
        },
      })

      return { user, tenant, business }
    })

    // Log to platform log
    try {
      await db.platformLog.create({
        data: {
          level: 'info',
          category: 'tenant_change',
          message: `New user registered: ${result.user.email} (tenant ${result.tenant.id})`,
          metadata: JSON.stringify({
            userId: result.user.id,
            tenantId: result.tenant.id,
            businessId: result.business.id,
            email: result.user.email,
            identifier: identifier ?? null,
          }),
        },
      })
    } catch {
      // Non-blocking — log failure should not fail registration
    }

    return NextResponse.json(
      {
        ok: true,
        message: 'Compte créé avec succès',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Auth] Register error:', error)
    return NextResponse.json(
      { error: "Erreur lors de la création du compte" },
      { status: 500 }
    )
  }
}
