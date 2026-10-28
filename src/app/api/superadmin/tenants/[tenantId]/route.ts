import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        businesses: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('[Superadmin] Failed to get tenant:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // Check tenant exists
    const existing = await db.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const updateData: Record<string, unknown> = {};
    const allowedFields = ['name', 'ownerName', 'ownerEmail', 'ownerPhone', 'businessType', 'config'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'config') {
          updateData[field] = JSON.stringify(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const tenant = await db.tenant.update({
      where: { id: tenantId },
      data: updateData,
      include: {
        subscription: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        businesses: true,
      },
    });

    // Log to PlatformLog
    await db.platformLog.create({
      data: {
        level: 'info',
        category: 'tenant_change',
        message: `Tenant updated: ${tenant.name} (${tenant.id})`,
        metadata: JSON.stringify({
          tenantId: tenant.id,
          updatedFields: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('[Superadmin] Failed to update tenant:', error);
    return NextResponse.json(
      { error: 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;

    const existing = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Cascade delete: subscription payments → subscription → users → businesses → tenant
    await db.$transaction([
      db.subscriptionPayment.deleteMany({
        where: { subscription: { tenantId } },
      }),
      db.subscription.deleteMany({
        where: { tenantId },
      }),
      db.user.deleteMany({
        where: { tenantId },
      }),
      db.business.deleteMany({
        where: { tenantId },
      }),
      db.tenant.delete({ where: { id: tenantId } }),
    ]);

    await db.platformLog.create({
      data: {
        level: "warning",
        category: "tenant_change",
        message: `Tenant deleted: ${existing.name} (${tenantId})`,
        metadata: JSON.stringify({ tenantId, tenantName: existing.name }),
      },
    });

    return NextResponse.json({ success: true, id: tenantId });
  } catch (error) {
    console.error("[Superadmin] Failed to delete tenant:", error);
    return NextResponse.json(
      { error: "Failed to delete tenant" },
      { status: 500 }
    );
  }
}
