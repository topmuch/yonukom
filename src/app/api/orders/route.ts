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
        orderItems: true,
        customer: true,
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

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, businessId, items, createdBy, status, deliveryAddress } = body

    if (!customerId || !businessId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'customerId, businessId, and items array are required' },
        { status: 400 }
      )
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.productId || item.quantity === undefined || item.unitPrice === undefined) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity, and unitPrice' },
          { status: 400 }
        )
      }
    }

    // Generate order number: YK-{year}-{XXXX}
    const orderCount = await db.order.count()
    const nextNum = orderCount + 1
    const orderNumber = `YK-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`

    // Calculate totals
    let subtotal = 0
    const orderItemsData = items.map((item: { productId: string; quantity: number; unitPrice: number }) => {
      const totalPrice = Number(item.quantity) * Number(item.unitPrice)
      subtotal += totalPrice
      return {
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice,
      }
    })

    const totalAmount = subtotal

    // Create order with items in a transaction
    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          businessId,
          subtotal,
          totalAmount,
          paidAmount: 0,
          remainingAmount: totalAmount,
          status: status || 'draft',
          createdBy: createdBy || null,
          deliveryAddress: deliveryAddress || null,
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: true,
          customer: true,
        },
      })

      // Create StockMovements and decrement product quantities
      for (const item of items) {
        const qty = Number(item.quantity)

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            type: 'sale',
            quantity: qty,
            productId: item.productId,
            orderId: newOrder.id,
          },
        })

        // Decrement product quantity
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: qty,
            },
          },
        })
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
