import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/payments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, amount, method, reference, isDeposit, receivedBy } = body

    if (!orderId || amount === undefined || !method) {
      return NextResponse.json(
        { error: 'orderId, amount, and method are required' },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)

    // Verify the order exists
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Create payment and update order amounts in a transaction
    const payment = await db.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          amount: numericAmount,
          method,
          orderId,
          reference: reference || null,
          isDeposit: isDeposit ?? false,
          receivedBy: receivedBy || null,
        },
      })

      // Update order paidAmount and remainingAmount
      const newPaidAmount = order.paidAmount + numericAmount
      const newRemainingAmount = order.totalAmount - newPaidAmount

      // Determine new status based on payment
      const updateData: Record<string, unknown> = {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
      }

      // Auto-transition: if fully paid, set status to appropriate next state
      if (newRemainingAmount <= 0 && order.status === 'to_pay') {
        updateData.status = 'to_ship'
      }

      await tx.order.update({
        where: { id: orderId },
        data: updateData,
      })

      return newPayment
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    )
  }
}
