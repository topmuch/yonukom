import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRecentPlatformLogs } from '@/lib/analytics/superadmin-metrics';
import { requireSuperadmin } from '@/lib/require-superadmin';

export async function GET(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const limitParam = searchParams.get('limit');

    // If filters are provided, query directly; otherwise use the metrics helper
    if (level || category) {
      const validLevels = ['info', 'warning', 'error', 'critical'];
      const validCategories = ['payment', 'sync', 'api', 'user_action', 'impersonation', 'tenant_change'];

      const where: Record<string, unknown> = {};

      if (level) {
        if (!validLevels.includes(level)) {
          return NextResponse.json(
            { error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
            { status: 400 }
          );
        }
        where.level = level;
      }

      if (category) {
        if (!validCategories.includes(category)) {
          return NextResponse.json(
            { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
            { status: 400 }
          );
        }
        where.category = category;
      }

      const take = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : 50;

      const logs = await db.platformLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
      });

      return NextResponse.json(logs);
    }

    // No filters — use the helper function
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : 50;
    const logs = await getRecentPlatformLogs(limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('[Superadmin] Failed to get platform logs:', error);
    return NextResponse.json(
      { error: 'Failed to get platform logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const body = await request.json();
    const { level, category, message, metadata } = body;

    if (!category || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: category, message' },
        { status: 400 }
      );
    }

    const validLevels = ['info', 'warning', 'error', 'critical'];
    const validCategories = ['payment', 'sync', 'api', 'user_action', 'impersonation', 'tenant_change'];

    const logLevel = level ?? 'info';
    if (!validLevels.includes(logLevel)) {
      return NextResponse.json(
        { error: `Invalid level. Must be one of: ${validLevels.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    const platformLog = await db.platformLog.create({
      data: {
        level: logLevel,
        category,
        message,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(platformLog, { status: 201 });
  } catch (error) {
    console.error('[Superadmin] Failed to create platform log:', error);
    return NextResponse.json(
      { error: 'Failed to create platform log' },
      { status: 500 }
    );
  }
}
