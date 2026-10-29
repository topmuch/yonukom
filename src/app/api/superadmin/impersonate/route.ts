import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing required field: tenantId' },
        { status: 400 }
      );
    }

    // Verify tenant exists
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        ownerEmail: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Log the impersonation action
    await db.platformLog.create({
      data: {
        level: 'warning',
        category: 'impersonation',
        message: `Impersonation started for tenant: ${tenant.name} (${tenant.id})`,
        metadata: JSON.stringify({
          tenantId: tenant.id,
          tenantName: tenant.name,
          ownerEmail: tenant.ownerEmail,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      tenantId: tenant.id,
      tenantName: tenant.name,
    });
  } catch (error) {
    console.error('[Superadmin] Failed to start impersonation:', error);
    return NextResponse.json(
      { error: 'Failed to start impersonation' },
      { status: 500 }
    );
  }
}
