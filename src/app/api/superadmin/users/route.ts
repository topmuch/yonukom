// ============================================================
// YonuKom — Superadmin API — Users
// GET:  List all users (id, name, email, phone, role, status, businessId)
// POST: Create a new user with bcrypt-hashed password
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { requireSuperadmin } from '@/lib/require-superadmin'

// GET /api/superadmin/users
export async function GET(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request)
    if (forbidden) return forbidden

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    const where = roleFilter && roleFilter !== 'all' ? { role: roleFilter } : {}

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        businessId: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Expose a flat "status" field (active/inactive) derived from isActive
    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.isActive ? 'active' : 'inactive',
      businessId: u.businessId,
      tenantId: u.tenantId,
      createdAt: u.createdAt,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('[Superadmin] Failed to list users:', error)
    return NextResponse.json(
      { error: 'Failed to list users' },
      { status: 500 }
    )
  }
}

// POST /api/superadmin/users
export async function POST(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request)
    if (forbidden) return forbidden

    const body = await request.json()
    const { name, email, phone, role, password, businessId, tenantId } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Nom, email, mot de passe et rôle sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        phone: phone ?? null,
        password: hashedPassword,
        role,
        isActive: true,
        businessId: businessId ?? null,
        tenantId: tenantId ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        businessId: true,
        tenantId: true,
        createdAt: true,
      },
    })

    // Log to platform log
    try {
      await db.platformLog.create({
        data: {
          level: 'info',
          category: 'user_action',
          message: `Superadmin created user: ${user.email} (role=${user.role})`,
          metadata: JSON.stringify({
            userId: user.id,
            email: user.email,
            role: user.role,
            businessId: user.businessId ?? null,
            tenantId: user.tenantId ?? null,
          }),
        },
      })
    } catch {
      // Non-blocking
    }

    return NextResponse.json(
      {
        ...user,
        status: user.isActive ? 'active' : 'inactive',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Superadmin] Failed to create user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
