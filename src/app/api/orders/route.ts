import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders?businessId=xxx&status=yyy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const status = searchParams.get('status')

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId query parameter is required' },
        { status: 400 }
      )
    }

    const where: Record<string, unknown> = {
      businessId,
    }

    if (status) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        customer: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// Type for an order item payload — supports two forms :
//   1. Produit existant :  { productId, quantity, unitPrice? }
//   2. Article manuel  :  { name, price|unitPrice, quantity }
type OrderItemInput = {
  productId?: string
  name?: string
  quantity?: number
  unitPrice?: number
  price?: number
}

// POST /api/orders
// - businessId  : obligatoire
// - customerId  : optionnel (walk-in par défaut créé automatiquement)
// - items       : obligatoire, non vide — chaque item peut référencer un
//                 productId existant OU être un article manuel (name + price).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, businessId, items, createdBy, status, deliveryAddress } = body as {
      customerId?: string
      businessId?: string
      items?: OrderItemInput[]
      createdBy?: string | null
      status?: string
      deliveryAddress?: string | null
    }

    // --- Validation de base ---
    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId est obligatoire' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items (tableau non vide) est obligatoire' },
        { status: 400 }
      )
    }

    // Valider chaque item : doit avoir soit productId, soit (name + price)
    for (const item of items) {
      const hasProduct = !!item.productId
      const hasManual = !!item.name && (item.price !== undefined || item.unitPrice !== undefined)
      const qty = Number(item.quantity)
      if ((!hasProduct && !hasManual) || !qty || qty <= 0) {
        return NextResponse.json(
          {
            error:
              "Chaque article doit avoir soit {productId, quantity} soit {name, price, quantity}",
          },
          { status: 400 }
        )
      }
    }

    // Vérifier que le business existe (FK constraint sinon)
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json(
        { error: `Business introuvable pour businessId="${businessId}"` },
        { status: 400 }
      )
    }

    // --- Résoudre le customer : walk-in par défaut ---
    let resolvedCustomerId: string | undefined = customerId
    if (!customerId || customerId === 'walk-in' || customerId.trim() === '') {
      const existingWalkIn = await db.customer.findFirst({
        where: { businessId, name: 'Client comptoir', phone: 'N/A' },
        select: { id: true },
      })
      if (existingWalkIn) {
        resolvedCustomerId = existingWalkIn.id
      } else {
        const walkIn = await db.customer.create({
          data: {
            name: 'Client comptoir',
            phone: 'N/A',
            businessId,
          },
        })
        resolvedCustomerId = walkIn.id
      }
    }

    // Generate order number: YK-{year}-{XXXX}
    const orderCount = await db.order.count()
    const nextNum = orderCount + 1
    const orderNumber = `YK-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

    // --- Préparer les items : résoudre / créer les produits manuels ---
    type ResolvedItem = {
      productId: string
      quantity: number
      unitPrice: number
      totalPrice: number
      isManual: boolean
    }

    let subtotal = 0
    const resolvedItems: ResolvedItem[] = []

    for (const item of items) {
      const qty = Number(item.quantity)
      let productId: string
      let unitPrice: number
      let isManual = false

      if (item.productId) {
        // Produit existant — utiliser le prix du payload (snapshot), sinon le prix DB
        const existing = await db.product.findUnique({
          where: { id: item.productId },
          select: { id: true, salePrice: true, productType: true },
        })
        if (!existing) {
          return NextResponse.json(
            { error: `Produit introuvable : ${item.productId}` },
            { status: 400 }
          )
        }
        productId = existing.id
        unitPrice =
          item.unitPrice !== undefined
            ? Number(item.unitPrice)
            : Number(item.price ?? existing.salePrice)
        isManual = false
      } else {
        // Article manuel — créer un Product "service" à la volée
        const manualPrice =
          item.unitPrice !== undefined
            ? Number(item.unitPrice)
            : Number(item.price ?? 0)
        const newProd = await db.product.create({
          data: {
            name: String(item.name).slice(0, 200),
            businessId,
            salePrice: manualPrice,
            purchasePrice: 0,
            quantity: 0,
            productType: 'service',
            unitType: 'piece',
            minStockAlert: 0,
            isActive: true,
            description: 'Article saisi manuellement (vente rapide)',
          },
        })
        productId = newProd.id
        unitPrice = manualPrice
        isManual = true
      }

      const totalPrice = qty * unitPrice
      subtotal += totalPrice
      resolvedItems.push({ productId, quantity: qty, unitPrice, totalPrice, isManual })
    }

    const totalAmount = subtotal

    // --- Créer la commande + items + mouvements de stock dans une transaction ---
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: resolvedCustomerId!,
          businessId,
          subtotal,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: status || 'completed',
          createdBy: createdBy || null,
          deliveryAddress: deliveryAddress || null,
          orderItems: {
            create: resolvedItems.map((ri) => ({
              productId: ri.productId,
              quantity: ri.quantity,
              unitPrice: ri.unitPrice,
              totalPrice: ri.totalPrice,
            })),
          },
        },
        include: {
          orderItems: true,
          customer: true,
        },
      })

      // Stock movements + décrément pour les items basés sur un produit existant
      // (les articles manuels "service" ne déduisent pas de stock)
      for (const ri of resolvedItems) {
        if (ri.isManual) continue // service — pas de stock
        await tx.stockMovement.create({
          data: {
            type: 'sale',
            quantity: ri.quantity,
            productId: ri.productId,
            orderId: newOrder.id,
          },
        })
        // Décrémenter le stock physique — clampé à 0
        const prod = await tx.product.findUnique({
          where: { id: ri.productId },
          select: { quantity: true },
        })
        if (prod) {
          await tx.product.update({
            where: { id: ri.productId },
            data: {
              quantity: Math.max(0, prod.quantity - ri.quantity),
            },
          })
        }
      }

      return newOrder
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
