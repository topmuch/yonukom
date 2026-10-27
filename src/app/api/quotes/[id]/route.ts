import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Valid B2B pipeline status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['quote_validated', 'cancelled'],
  quote_validated: ['delivery_note', 'cancelled'],
  delivery_note: ['invoiced'],
  invoiced: [],
  cancelled: [],
}

// DELETE /api/quotes/:id — hard delete B2B quote (Order with B2B status)
// Requires ?businessId=xxx — validated against the quote's businessId.
// Releases reserved stock for quote_validated status before deletion.
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

    const existingQuote = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Devis introuvable' },
        { status: 404 }
      )
    }

    // Verify this is a B2B quote
    const b2bStatuses = ['draft', 'quote_validated', 'delivery_note', 'invoiced', 'cancelled']
    if (!b2bStatuses.includes(existingQuote.status)) {
      return NextResponse.json(
        { error: 'Cette commande n\'est pas un devis B2B' },
        { status: 400 }
      )
    }

    if (existingQuote.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Accès refusé : ce devis n\'appartient pas à votre business' },
        { status: 403 }
      )
    }

    await db.$transaction(async (tx) => {
      // If quote is in 'quote_validated' status, reserved stock still exists
      // — release it before deleting the quote.
      if (existingQuote.status === 'quote_validated') {
        for (const item of existingQuote.orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          })

          await tx.stockMovement.create({
            data: {
              type: 'reservation_release',
              quantity: item.quantity,
              productId: item.productId,
              orderId: existingQuote.id,
              reason: 'Devis supprimé',
            },
          })
        }
      }

      // Cascade delete order items + payments
      await tx.orderItem.deleteMany({ where: { orderId: id } })
      await tx.payment.deleteMany({ where: { orderId: id } })

      // Disconnect invoices (keep history)
      await tx.invoice.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // Null out stock movement references
      await tx.stockMovement.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // Null out commissions
      await tx.commission.updateMany({
        where: { orderId: id },
        data: { orderId: null },
      })

      // Finally delete the quote
      await tx.order.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting quote:', error)
    return NextResponse.json(
      { error: 'Échec de la suppression du devis' },
      { status: 500 }
    )
  }
}

// GET /api/quotes/:id — single quote with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const quote = await db.order.findUnique({
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

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Verify this is a B2B quote
    const b2bStatuses = ['draft', 'quote_validated', 'delivery_note', 'invoiced', 'cancelled']
    if (!b2bStatuses.includes(quote.status)) {
      return NextResponse.json(
        { error: 'This order is not a B2B quote' },
        { status: 400 }
      )
    }

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PUT /api/quotes/:id — update quote with STATUS TRANSITION LOGIC
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, cancellationReason, cancelledBy, deliveryAddress, notes, userId, userRole } = body

    // Fetch existing quote
    const existingQuote = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    })

    if (!existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // ─── Simple field updates (no status change) ───
    if (!status) {
      const updateData: Record<string, unknown> = {}

      if (deliveryAddress !== undefined) {
        updateData.deliveryAddress = deliveryAddress
      }
      if (notes !== undefined) {
        // Store notes in paymentLink field (repurposed for B2B notes)
        updateData.paymentLink = notes
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No fields to update' },
          { status: 400 }
        )
      }

      const updated = await db.order.update({
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

      return NextResponse.json(updated)
    }

    // ─── Validate status transition ───
    const currentStatus = existingQuote.status

    if (!VALID_TRANSITIONS[currentStatus]) {
      return NextResponse.json(
        { error: `Cannot transition from status '${currentStatus}'` },
        { status: 400 }
      )
    }

    if (!VALID_TRANSITIONS[currentStatus].includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid transition: '${currentStatus}' → '${status}'. Allowed: ${VALID_TRANSITIONS[currentStatus].join(', ')}`,
        },
        { status: 400 }
      )
    }

    // ─── Role check: validation/delivery/invoicing require patron or gerant ───
    if (['quote_validated', 'delivery_note', 'invoiced'].includes(status)) {
      if (userRole && userRole !== 'patron' && userRole !== 'gerant') {
        return NextResponse.json(
          { error: 'Only patron or gerant can perform this action' },
          { status: 403 }
        )
      }
    }

    // ─── TRANSITION: draft → quote_validated (VALIDATE) ───
    if (status === 'quote_validated' && currentStatus === 'draft') {
      // Check stock availability for each item
      const stockErrors: { productId: string; productName: string; available: number; requested: number }[] = []

      for (const item of existingQuote.orderItems) {
        const product = item.product
        const available = product.quantity - product.reservedQuantity
        if (available < item.quantity) {
          stockErrors.push({
            productId: product.id,
            productName: product.name,
            available,
            requested: item.quantity,
          })
        }
      }

      if (stockErrors.length > 0) {
        return NextResponse.json(
          {
            error: 'Insufficient available stock for one or more products',
            details: stockErrors,
          },
          { status: 400 }
        )
      }

      // Reserve stock for each item
      const result = await db.$transaction(async (tx) => {
        for (const item of existingQuote.orderItems) {
          // Increment reservedQuantity on product
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedQuantity: {
                increment: item.quantity,
              },
            },
          })

          // Create StockMovement type:reservation
          await tx.stockMovement.create({
            data: {
              type: 'reservation',
              quantity: item.quantity,
              productId: item.productId,
              orderId: existingQuote.id,
              userId: userId || null,
            },
          })
        }

        // Update order status
        const updatedQuote = await tx.order.update({
          where: { id },
          data: {
            status: 'quote_validated',
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

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'quote_validated',
            entityType: 'order',
            entityId: existingQuote.id,
            details: JSON.stringify({
              orderNumber: existingQuote.orderNumber,
              from: 'draft',
              to: 'quote_validated',
              totalAmount: existingQuote.totalAmount,
            }),
            userId: userId || null,
            businessId: existingQuote.businessId,
          },
        })

        return updatedQuote
      })

      return NextResponse.json(result)
    }

    // ─── TRANSITION: quote_validated → delivery_note (DELIVER) ───
    if (status === 'delivery_note' && currentStatus === 'quote_validated') {
      const result = await db.$transaction(async (tx) => {
        for (const item of existingQuote.orderItems) {
          // 1. Decrement physical stock (quantity out)
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          })

          // 2. Decrement reservedQuantity (release reservation)
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedQuantity: {
                decrement: item.quantity,
              },
            },
          })

          // 3. Create StockMovement type:reservation_release
          await tx.stockMovement.create({
            data: {
              type: 'reservation_release',
              quantity: item.quantity,
              productId: item.productId,
              orderId: existingQuote.id,
              userId: userId || null,
            },
          })

          // 4. Create StockMovement type:sale
          await tx.stockMovement.create({
            data: {
              type: 'sale',
              quantity: item.quantity,
              productId: item.productId,
              orderId: existingQuote.id,
              userId: userId || null,
            },
          })
        }

        // Update order: status + delivery info
        const updatedQuote = await tx.order.update({
          where: { id },
          data: {
            status: 'delivery_note',
            isDelivered: true,
            deliveryDate: new Date(),
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

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'quote_delivered',
            entityType: 'order',
            entityId: existingQuote.id,
            details: JSON.stringify({
              orderNumber: existingQuote.orderNumber,
              from: 'quote_validated',
              to: 'delivery_note',
              totalAmount: existingQuote.totalAmount,
            }),
            userId: userId || null,
            businessId: existingQuote.businessId,
          },
        })

        return updatedQuote
      })

      return NextResponse.json(result)
    }

    // ─── TRANSITION: delivery_note → invoiced (INVOICE) ───
    if (status === 'invoiced' && currentStatus === 'delivery_note') {
      const result = await db.$transaction(async (tx) => {
        // Just update status — payment tracking begins
        const updatedQuote = await tx.order.update({
          where: { id },
          data: {
            status: 'invoiced',
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

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'quote_invoiced',
            entityType: 'order',
            entityId: existingQuote.id,
            details: JSON.stringify({
              orderNumber: existingQuote.orderNumber,
              from: 'delivery_note',
              to: 'invoiced',
              totalAmount: existingQuote.totalAmount,
              paidAmount: existingQuote.paidAmount,
              remainingAmount: existingQuote.remainingAmount,
            }),
            userId: userId || null,
            businessId: existingQuote.businessId,
          },
        })

        return updatedQuote
      })

      return NextResponse.json(result)
    }

    // ─── TRANSITION: * → cancelled (CANCEL) ───
    if (status === 'cancelled') {
      if (!cancellationReason) {
        return NextResponse.json(
          { error: 'cancellationReason is required when cancelling a quote' },
          { status: 400 }
        )
      }

      const result = await db.$transaction(async (tx) => {
        // If currently quote_validated, release reservation
        if (currentStatus === 'quote_validated') {
          for (const item of existingQuote.orderItems) {
            // Decrement reservedQuantity
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reservedQuantity: {
                  decrement: item.quantity,
                },
              },
            })

            // Create StockMovement type:reservation_release
            await tx.stockMovement.create({
              data: {
                type: 'reservation_release',
                quantity: item.quantity,
                productId: item.productId,
                orderId: existingQuote.id,
                userId: userId || null,
                reason: `Quote cancelled: ${cancellationReason}`,
              },
            })
          }
        }

        // If delivery_note, stock was already physically removed — 
        // cancellation after delivery is just a financial note, no stock reversal
        // (The goods have already left the warehouse)

        // Update the order
        const updatedQuote = await tx.order.update({
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

        // Audit log
        await tx.auditLog.create({
          data: {
            action: 'quote_cancelled',
            entityType: 'order',
            entityId: existingQuote.id,
            details: JSON.stringify({
              orderNumber: existingQuote.orderNumber,
              from: currentStatus,
              to: 'cancelled',
              reason: cancellationReason,
              reservationReleased: currentStatus === 'quote_validated',
            }),
            userId: userId || null,
            businessId: existingQuote.businessId,
          },
        })

        return updatedQuote
      })

      return NextResponse.json(result)
    }

    // Should not reach here, but just in case
    return NextResponse.json(
      { error: 'Unhandled status transition' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}
