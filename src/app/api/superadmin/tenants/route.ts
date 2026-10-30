import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperadmin } from '@/lib/require-superadmin';

export async function GET(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const tenants = await db.tenant.findMany({
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
        businesses: {
          select: {
            id: true,
            name: true,
            type: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('[Superadmin] Failed to list tenants:', error);
    return NextResponse.json(
      { error: 'Failed to list tenants' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const body = await request.json();
    const { name, ownerName, ownerEmail, ownerPhone, businessType, config } = body;

    if (!name || !ownerName || !ownerEmail || !ownerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, ownerName, ownerEmail, ownerPhone' },
        { status: 400 }
      );
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Create tenant with subscription in a transaction
    const tenant = await db.tenant.create({
      data: {
        name,
        ownerName,
        ownerEmail,
        ownerPhone,
        businessType: businessType ?? 'retail_shop',
        config: config ? JSON.stringify(config) : null,
        subscription: {
          create: {
            plan: 'starter',
            status: 'active',
            amount: 5000,
            currentPeriodStart: now,
            currentPeriodEnd: thirtyDaysFromNow,
          },
        },
      },
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
      },
    });

    // Log to PlatformLog
    await db.platformLog.create({
      data: {
        level: 'info',
        category: 'tenant_change',
        message: `Tenant created: ${tenant.name} (${tenant.id})`,
        metadata: JSON.stringify({
          tenantId: tenant.id,
          tenantName: tenant.name,
          ownerEmail: tenant.ownerEmail,
          businessType: tenant.businessType,
        }),
      },
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('[Superadmin] Failed to create tenant:', error);

    // Handle unique constraint violation (duplicate ownerEmail)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'A tenant with this owner email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create tenant' },
      { status: 500 }
    );
  }
}
