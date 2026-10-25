import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// B2B Pipeline statuses for quotes
const B2B_STATUSES = ['draft', 'quote_validated', 'delivery_note', 'invoiced']

// GET /api/quotes?businessId=xxx&status=yyy
// List B2B quotes (orders with pipeline statuses)
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

    // Build where clause — only B2B pipeline statuses
    const where: Record<string, unknown> = {
      businessId,
      status: status
        ? status
        : { in: B2B_STATUSES },
    }

    // If a specific status is requested, validate it's a B2B status
    if (status && !B2B_STATUSES.includes(status) && status !== 'cancelled') {
      return NextResponse.json(
        { error: `Invalid B2B quote status. Must be one of: ${[...B2B_STATUSES, 'cancelled'].join(', ')}` },
        { status: 400 }
      )
    }

    const quotes = await db.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
        payments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(quotes)
  } catch (error) {
    console.error('Error fetching B2B quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST /api/quotes
// Create a new B2B quote (draft) — NO stock impact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, customerId, items, createdBy, deliveryAddress } = body

    // Validate required fields
    if (!businessId || !customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'businessId, customerId, and items array are required' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || item.quantity === undefined || item.unitPrice === undefined) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity, and unitPrice' },
          { status: 400 }
        )
      }
      if (Number(item.quantity) <= 0) {
        return NextResponse.json(
          { error: 'Each item quantity must be positive' },
          { status: 400 }
        )
      }
      if (Number(item.unitPrice) < 0) {
        return NextResponse.json(
          { error: 'Each item unitPrice must be non-negative' },
          { status: 400 }
        )
      }
    }

    // Verify customer exists and is B2B
    const customer = await db.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (!customer.isB2B) {
      return NextResponse.json(
        { error: 'Customer must be a B2B customer (isB2B=true) to create quotes' },
        { status: 400 }
      )
    }

    // Verify all products exist and belong to the business
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.product.findMany({
      where: {
        id: { in: productIds },
        businessId,
        isActive: true,
      },
    })

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id)
      const missingIds = productIds.filter((id: string) => !foundIds.includes(id))
      return NextResponse.json(
        { error: `Products not found or inactive: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Generate order number: YK-{year}-{XXXX}
    const orderCount = await db.order.count()
    const nextNum = orderCount + 1
    const orderNumber = `YK-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

    // Calculate totals (all in FCFA integers)
    let subtotal = 0
    const orderItemsData = items.map(
      (item: { productId: string; quantity: number; unitPrice: number }) => {
        const quantity = Math.floor(Number(item.quantity))
        const unitPrice = Math.floor(Number(item.unitPrice))
        const totalPrice = quantity * unitPrice
        subtotal += totalPrice
        return {
          productId: item.productId,
          quantity,
          unitPrice,
          totalPrice,
        }
      }
    )

    const totalAmount = subtotal

    // Create quote as draft — NO stock impact at this stage
    const quote = await db.$transaction(async (tx) => {
      const newQuote = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          businessId,
          subtotal,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: 'draft',
          createdBy: createdBy || null,
          deliveryAddress: deliveryAddress || null,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          customer: true,
          payments: true,
        },
      })

      // Audit log for quote creation
      await tx.auditLog.create({
        data: {
          action: 'quote_created',
          entityType: 'order',
          entityId: newQuote.id,
          details: JSON.stringify({
            orderNumber,
            status: 'draft',
            totalAmount,
            itemCount: items.length,
          }),
          businessId,
        },
      })

      return newQuote
    })

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Error creating B2B quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
