// ============================================================
// YonuKom — Promo Detail API
// PATCH /api/promos/[id] → update (e.g. isActive: false to deactivate)
// DELETE /api/promos/[id] → hard delete
// Body must include businessId for ownership validation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ALLOWED_FIELDS = new Set([
  'name',
  'percentage',
  'ticketMessage',
  'isActive',
  'endDate',
  'minAmount',
  'productId',
])

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { businessId, ...rest } = body as { businessId?: string; [k: string]: unknown }

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }

    // Vérifier ownership
    const existing = await db.promo.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    })
    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Promo introuvable ou accès non autorisé' },
        { status: 404 }
      )
    }

    // Si on réactive une promo, on doit désactiver les autres actives
    const willActivate = rest.isActive === true

    // Construire l'objet update (uniquement les champs whitelistés)
    const data: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(rest)) {
      if (ALLOWED_FIELDS.has(k)) {
        data[k] = v
      }
    }
    if (data.percentage !== undefined) {
      const pct = Number(data.percentage)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { error: 'Le pourcentage doit être entre 0 et 100' },
          { status: 400 }
        )
      }
      data.percentage = pct
    }
    if (data.isActive === false) {
      data.endDate = new Date()
    }

    const updated = await db.$transaction(async (tx) => {
      if (willActivate) {
        // Désactiver les autres promos actives du business
        await tx.promo.updateMany({
          where: { businessId, isActive: true, NOT: { id } },
          data: { isActive: false, endDate: new Date() },
        })
      }
      return tx.promo.update({ where: { id }, data })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/promos/[id]] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }

    const existing = await db.promo.findUnique({
      where: { id },
      select: { id: true, businessId: true },
    })
    if (!existing || existing.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Promo introuvable ou accès non autorisé' },
        { status: 404 }
      )
    }

    await db.promo.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/promos/[id]] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
