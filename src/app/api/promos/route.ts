// ============================================================
// YonuKom — Promos API
// GET  /api/promos?businessId=xxx[&active=true]
//   → Liste les promos (active first), ou seulement la promo active si ?active=true
// POST /api/promos
//   Body: { businessId, name, type, percentage, productId?, minAmount?, ticketMessage? }
//   → Crée une nouvelle promo. Si une autre promo est déjà active, elle est désactivée
//     (1 seule promo active à la fois par business).
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VALID_TYPES = ['global', 'product', 'amount']

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const activeOnly = searchParams.get('active') === 'true'

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = { businessId }
    if (activeOnly) {
      where.isActive = true
    }

    const promos = await db.promo.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    })

    if (activeOnly) {
      // Renvoie un objet simple { promo } (ou null) — utilisé par le panier pour appliquer la promo active
      return NextResponse.json({ promo: promos[0] ?? null })
    }

    return NextResponse.json({ promos })
  } catch (error) {
    console.error('[GET /api/promos] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      businessId,
      name,
      type,
      percentage,
      productId,
      minAmount,
      ticketMessage,
    } = body as {
      businessId?: string
      name?: string
      type?: string
      percentage?: number
      productId?: string | null
      minAmount?: number | null
      ticketMessage?: string | null
    }

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Le nom de la promo est obligatoire' },
        { status: 400 }
      )
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Type de promo invalide (global, product, amount)' },
        { status: 400 }
      )
    }
    const pct = Number(percentage)
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json(
        { error: 'Le pourcentage doit être entre 0 et 100' },
        { status: 400 }
      )
    }
    if (type === 'product' && !productId) {
      return NextResponse.json(
        { error: 'productId est obligatoire pour une promo de type "product"' },
        { status: 400 }
      )
    }
    if (type === 'amount') {
      const min = Number(minAmount)
      if (isNaN(min) || min <= 0) {
        return NextResponse.json(
          { error: 'minAmount doit être un entier positif pour une promo de type "amount"' },
          { status: 400 }
        )
      }
    }

    // Vérifier que le business existe
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      )
    }

    // Vérifier productId si fourni (ownership)
    if (type === 'product' && productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { id: true, businessId: true },
      })
      if (!product || product.businessId !== businessId) {
        return NextResponse.json(
          { error: 'Produit introuvable ou n\'appartenant pas à ce commerce' },
          { status: 400 }
        )
      }
    }

    // Création atomique : désactive les anciennes promos actives + crée la nouvelle
    const newPromo = await db.$transaction(async (tx) => {
      // 1 — Désactiver toutes les promos actuellement actives
      await tx.promo.updateMany({
        where: { businessId, isActive: true },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      })

      // 2 — Créer la nouvelle promo active
      return tx.promo.create({
        data: {
          businessId,
          name: name.trim().slice(0, 200),
          type,
          percentage: pct,
          productId: type === 'product' && productId ? productId : null,
          minAmount:
            type === 'amount' && minAmount !== undefined && minAmount !== null
              ? Math.max(0, Math.floor(Number(minAmount)))
              : null,
          ticketMessage:
            typeof ticketMessage === 'string' && ticketMessage.trim()
              ? ticketMessage.trim().slice(0, 500)
              : null,
          isActive: true,
          startDate: new Date(),
        },
      })
    })

    return NextResponse.json(newPromo, { status: 201 })
  } catch (error) {
    console.error('[POST /api/promos] error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création de la promo' },
      { status: 500 }
    )
  }
}
