import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/:id — update status; special handling for cancellation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, cancellationReason, cancelledBy } = body

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Handle cancellation
    if (status === 'cancelled' || body.isCancelled === true) {
      if (!cancellationReason) {
        return NextResponse.json(
          { error: 'cancellationReason is required when cancelling an order' },
          { status: 400 }
        )
      }

      const order = await db.$transaction(async (tx) => {
        // Increment product quantities back for each order item
        for (const item of existingOrder.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          })

          // Create stock movement (adjustment) for the reversal
          await tx.stockMovement.create({
            data: {
              type: 'adjustment',
              quantity: item.quantity,
              reason: `Order cancellation: ${cancellationReason}`,
              productId: item.productId,
              orderId: existingOrder.id,
            },
          })
        }

        // Update the order
        const updatedOrder = await tx.order.update({
          where: { id },
          data: {
            status: 'cancelled',
            isCancelled: true,
            cancellationReason,
            cancelledBy: cancelledBy || null,
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            payments: true,
            customer: true,
          },
        })

        return updatedOrder
      })

      return NextResponse.json(order)
    }

    // Normal status update
    const updateData: Record<string, unknown> = {}
    if (status !== undefined) {
      updateData.status = status
    }
    if (body.isDelivered !== undefined) {
      updateData.isDelivered = body.isDelivered
    }
    if (body.deliveryAddress !== undefined) {
      updateData.deliveryAddress = body.deliveryAddress
    }
    if (body.deliveryDate !== undefined) {
      updateData.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null
    }
    if (body.whatsappSent !== undefined) {
      updateData.whatsappSent = body.whatsappSent
    }
    if (body.paymentLink !== undefined) {
      updateData.paymentLink = body.paymentLink
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        payments: true,
        customer: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}
