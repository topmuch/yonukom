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

// DELETE /api/orders/:id — hard delete order + cascade (items, payments; null invoices.orderId)
// Requires ?businessId=xxx — validated against the order's businessId.
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
        { error: 'businessId est requis' },
        { status: 400 }
      )
    }

    const existing = await db.order.findUnique({
      where: { id },
      include: { orderItems: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }

    if (existing.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Accès refusé : cette commande n\'appartient pas à votre business' },
        { status: 403 }
      )
    }

    await db.$transaction(async (tx) => {
      // 1. Delete order items
      await tx.orderItem.deleteMany({ where: { orderId: id } })

      // 2. Delete payments
      await tx.payment.deleteMany({ where: { orderId: id } })

      // 3. Disconnect invoices (set orderId = null — keeps invoice history)
      await tx.invoice.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // 4. Null out stock movement references (orderId is just a string field, no FK)
      await tx.stockMovement.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // 5. Null out commissions tied to this order (keep audit trail, release FK)
      await tx.commission.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // 6. Finally delete the order
      await tx.order.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Échec de la suppression de la commande' },
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
    // --- POS payment status : "paid" marque la commande comme entièrement payée ---
    // Le "Marquer comme payée" du front appelle PUT { status: "paid" } sans paidAmount :
    // on force alors paidAmount = totalAmount et remainingAmount = 0.
    if (status === 'paid') {
      updateData.paidAmount = existingOrder.totalAmount
      updateData.remainingAmount = 0
      updateData.isCancelled = false
    } else if (status === 'unpaid') {
      updateData.paidAmount = 0
      updateData.remainingAmount = existingOrder.totalAmount
    } else if (status === 'delivered' && body.isDelivered === undefined) {
      // Livraison = commande livrée au client (mais pas forcément payée)
      updateData.isDelivered = true
    }
    // Si l'appelant fournit explicitement paidAmount, on l'utilise (et on recalcule remaining)
    if (body.paidAmount !== undefined) {
      const newPaid = Math.min(
        existingOrder.totalAmount,
        Math.max(0, Math.floor(Number(body.paidAmount) || 0))
      )
      updateData.paidAmount = newPaid
      updateData.remainingAmount = Math.max(0, existingOrder.totalAmount - newPaid)
      // Mettre à jour le statut automatiquement si non fourni
      if (status === undefined) {
        if (newPaid >= existingOrder.totalAmount) {
          updateData.status = 'paid'
        } else if (newPaid > 0) {
          updateData.status = 'partial'
        } else {
          updateData.status = 'unpaid'
        }
      }
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
