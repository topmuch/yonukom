import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/customers/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const customer = await db.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/:id — hard delete customer
// Requires ?businessId=xxx — validated against the customer's businessId.
// Blocks deletion (409) if customer has any non-cancelled orders ("outstanding orders").
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

    const existing = await db.customer.findUnique({ where: { id } })

    if (!existing) {
      return NextResponse.json(
        { error: 'Client introuvable' },
        { status: 404 }
      )
    }

    if (existing.businessId !== businessId) {
      return NextResponse.json(
        { error: 'Accès refusé : ce client n\'appartient pas à votre business' },
        { status: 403 }
      )
    }

    // Block deletion if customer has outstanding (non-cancelled) orders
    const outstandingOrders = await db.order.count({
      where: {
        customerId: id,
        isCancelled: false,
      },
    })

    if (outstandingOrders > 0) {
      return NextResponse.json(
        {
          error: `Impossible de supprimer ce client : ${outstandingOrders} commande(s) en cours y sont rattachées. Annulez ou supprimez d'abord ces commandes.`,
          code: 'HAS_OUTSTANDING_ORDERS',
          count: outstandingOrders,
        },
        { status: 409 }
      )
    }

    await db.$transaction(async (tx) => {
      // 1. Null out invoices.customerId (keep invoice history — anonymise customer)
      await tx.invoice.updateMany({
        where: { customerId: id },
        data: { customerId: null },
      })

      // 2. Delete cancelled orders tied to this customer
      //    (no outstanding orders — only cancelled ones remain)
      const cancelledOrders = await tx.order.findMany({
        where: { customerId: id },
        select: { id: true },
      })
      const cancelledOrderIds = cancelledOrders.map((o) => o.id)

      if (cancelledOrderIds.length > 0) {
        // Cascade for each cancelled order
        await tx.orderItem.deleteMany({
          where: { orderId: { in: cancelledOrderIds } },
        })
        await tx.payment.deleteMany({
          where: { orderId: { in: cancelledOrderIds } },
        })
        await tx.invoice.updateMany({
          where: { orderId: { in: cancelledOrderIds } },
          data: { orderId: null },
        })
        await tx.stockMovement.updateMany({
          where: { orderId: { in: cancelledOrderIds } },
          data: { orderId: null },
        })
        await tx.commission.updateMany({
          where: { orderId: { in: cancelledOrderIds } },
          data: { orderId: null },
        })
        await tx.order.deleteMany({
          where: { id: { in: cancelledOrderIds } },
        })
      }

      // 3. Finally delete the customer
      await tx.customer.delete({ where: { id } })
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Échec de la suppression du client' },
      { status: 500 }
    )
  }
}

// PUT /api/customers/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const existingCustomer = await db.customer.findUnique({
      where: { id },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = [
      'name', 'phone', 'email', 'address',
      'paymentMethod', 'isB2B', 'creditLimit', 'favoriteProductIds',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Convert numeric fields
    if (updateData.creditLimit !== undefined) {
      updateData.creditLimit = updateData.creditLimit !== null ? Number(updateData.creditLimit) : null
    }

    const customer = await db.customer.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}
