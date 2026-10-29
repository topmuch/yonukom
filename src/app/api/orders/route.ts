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
// - businessId    : obligatoire
// - customerId    : optionnel (walk-in par défaut créé automatiquement)
// - paymentMethod : optionnel ("cash" par défaut) — crée un Payment + marque la commande payée
// - items         : obligatoire, non vide — chaque item peut référencer un
//                   productId existant OU être un article manuel (name + price).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, businessId, items, createdBy, status, deliveryAddress, paymentMethod, deliveryFee, orderType, promoId, paid = true } = body as {
      customerId?: string
      businessId?: string
      items?: OrderItemInput[]
      createdBy?: string | null
      status?: string
      deliveryAddress?: string | null
      paymentMethod?: string
      deliveryFee?: number
      orderType?: string
      promoId?: string | null
      paid?: boolean
    }

    // `paid` contrôle si un Payment est créé et si paidAmount = totalAmount.
    // Par défaut true (vente comptoir encaissée — comportement historique du POS).
    // Le dashboard manuel peut passer paid=false pour créer une commande "Non payée"
    // ou "En cours" sans encaisser immédiatement.
    const shouldCreatePayment = paid === true

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

    // --- Safety net : refuser l'encaissement si aucune session de caisse ouverte ---
    // Le frontend bloque déjà l'action, mais l'API doit aussi l'imposer
    // (anti-fraude / appels directs hors UI).
    // ⚠️ Uniquement requis quand on encaisse (paid=true). Pour une commande
    // "Non payée" / "En cours" / "Livré" (paid=false), aucune session de caisse
    // n'est nécessaire puisque aucun flux financier n'est enregistré.
    if (shouldCreatePayment) {
      const activeCashSession = await db.cashSession.findFirst({
        where: { businessId, isActive: true, closedAt: null },
        select: { id: true },
      })
      if (!activeCashSession) {
        return NextResponse.json(
          { error: 'Caisse fermée. Ouvrez une session de caisse avant d\'encaisser.' },
          { status: 403 }
        )
      }
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

    // --- Frais de livraison + type de commande ---
    const resolvedOrderType =
      orderType && ['dine_in', 'takeaway', 'delivery'].includes(orderType)
        ? orderType
        : 'dine_in'
    // deliveryFee : entier FCFA, clampé à 0+ (default 0). Forcé à 0 si pas de livraison.
    const parsedDeliveryFee = Number(deliveryFee) || 0
    const resolvedDeliveryFee =
      resolvedOrderType === 'delivery' && parsedDeliveryFee > 0
        ? Math.floor(parsedDeliveryFee)
        : 0

    const totalAmount = subtotal + resolvedDeliveryFee

    // --- Validation de la promo (optionnelle) ---
    // Si un promoId est fourni, on vérifie qu'il appartient au business et qu'il est actif.
    let resolvedPromoId: string | null = null
    let promoDiscount = 0
    if (promoId && typeof promoId === 'string') {
      const promo = await db.promo.findUnique({
        where: { id: promoId },
        select: { id: true, businessId: true, isActive: true, type: true, percentage: true, productId: true, minAmount: true },
      })
      if (promo && promo.businessId === businessId && promo.isActive) {
        // Vérifier les conditions de la promo
        const pct = promo.percentage ?? 0
        if (promo.type === 'global') {
          promoDiscount = Math.round((subtotal * pct) / 100)
        } else if (promo.type === 'amount') {
          const min = promo.minAmount ?? 0
          if (subtotal >= min) {
            promoDiscount = Math.round((subtotal * pct) / 100)
          } else {
            // Seuil non atteint → on n'applique pas la promo
          }
        } else if (promo.type === 'product' && promo.productId) {
          const matchingSubtotal = resolvedItems
            .filter((ri) => ri.productId === promo.productId)
            .reduce((sum, ri) => sum + ri.totalPrice, 0)
          promoDiscount = Math.round((matchingSubtotal * pct) / 100)
        }
        if (promoDiscount > 0) {
          resolvedPromoId = promo.id
        }
      }
    }
    const finalTotalAmount = Math.max(0, totalAmount - promoDiscount)

    // Valider le moyen de paiement (défaut: cash)
    const VALID_PAYMENT_METHODS = ['cash', 'wave', 'orange_money', 'cb', 'cheque', 'virement']
    const resolvedPaymentMethod = paymentMethod && VALID_PAYMENT_METHODS.includes(paymentMethod)
      ? paymentMethod
      : 'cash'

    // --- Créer la commande + items + mouvements de stock + paiement dans une transaction ---
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: resolvedCustomerId!,
          businessId,
          subtotal,
          totalAmount: finalTotalAmount,
          deliveryFee: resolvedDeliveryFee,
          orderType: resolvedOrderType,
          promoId: resolvedPromoId,
          // Marquer comme payée si encaissement immédiat (vente comptoir)
          paidAmount: shouldCreatePayment ? finalTotalAmount : 0,
          remainingAmount: shouldCreatePayment ? 0 : finalTotalAmount,
          status: status || (shouldCreatePayment ? 'completed' : 'to_pay'),
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

      // Créer un Payment immédiat UNIQUEMENT si encaissement (paid=true).
      // Pour les commandes "Non payée" / "En cours" / "Livré" sans encaissement,
      // aucun Payment n'est créé — le merchant pourra encaisser plus tard via
      // le bouton "Marquer comme payée" dans l'historique.
      if (shouldCreatePayment) {
        await tx.payment.create({
          data: {
            amount: finalTotalAmount,
            method: resolvedPaymentMethod,
            orderId: newOrder.id,
            receivedBy: createdBy || null,
          },
        })
      }

      return newOrder
    })

    // Renvoyer aussi le paymentMethod + deliveryFee + orderType + promoId pour que le front
    // puisse l'afficher sans avoir à refetcher la commande.
    return NextResponse.json(
      { ...order, paymentMethod: resolvedPaymentMethod, deliveryFee: resolvedDeliveryFee, orderType: resolvedOrderType, promoId: resolvedPromoId, promoDiscount },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}
