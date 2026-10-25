import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    const { subscriptionId } = await params;
    const body = await request.json();

    // Check subscription exists
    const existing = await db.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['plan', 'status', 'amount', 'paymentMethod', 'nextBillingDate'];

    const validPlans = ['starter', 'pro', 'enterprise'];
    const validStatuses = ['active', 'expired', 'past_due', 'cancelled'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Validate plan
        if (field === 'plan' && !validPlans.includes(body[field])) {
          return NextResponse.json(
            { error: `Invalid plan. Must be one of: ${validPlans.join(', ')}` },
            { status: 400 }
          );
        }
        // Validate status
        if (field === 'status' && !validStatuses.includes(body[field])) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
            { status: 400 }
          );
        }
        updateData[field] = body[field];
      }
    }

    const subscription = await db.subscription.update({
      where: { id: subscriptionId },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
          },
        },
      },
    });

    // Log to PlatformLog
    await db.platformLog.create({
      data: {
        level: 'info',
        category: 'payment',
        message: `Subscription updated for tenant: ${subscription.tenant.name} (${subscription.tenant.id})`,
        metadata: JSON.stringify({
          subscriptionId: subscription.id,
          tenantId: subscription.tenant.id,
          updatedFields: Object.keys(updateData),
          previousValues: {
            plan: existing.plan,
            status: existing.status,
            amount: existing.amount,
          },
        }),
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('[Superadmin] Failed to update subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
