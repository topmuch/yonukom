import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ subscriptionId: string }> };

// GET /api/superadmin/subscriptions/[subscriptionId] — fetch single subscription
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { subscriptionId } = await params;

    const sub = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            ownerEmail: true,
            ownerPhone: true,
            businessType: true,
          },
        },
        payments: true,
      },
    });

    if (!sub) {
      return NextResponse.json(
        { error: "Abonnement introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(sub);
  } catch (error) {
    console.error("[Superadmin] Failed to fetch subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}

// PATCH /api/superadmin/subscriptions/[subscriptionId]
// Accepts: { status, plan, amount, paymentMethod, nextBillingDate, billingPeriod }
// Valid statuses: active | suspended | expired | past_due | cancelled
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { subscriptionId } = await params;
    const body = await request.json();

    const existing = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: { tenant: { select: { id: true, name: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Abonnement introuvable" },
        { status: 404 }
      );
    }

    const validPlans = ["starter", "pro", "enterprise"];
    const validStatuses = ["active", "suspended", "expired", "past_due", "cancelled"];
    const validBillingPeriods = ["monthly", "annual"];

    const updateData: Record<string, unknown> = {};

    if (body.plan !== undefined) {
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json(
          { error: `Plan invalide. Doit être parmi: ${validPlans.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.plan = body.plan;
    }

    if (body.status !== undefined) {
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Statut invalide. Doit être parmi: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    if (body.billingPeriod !== undefined) {
      if (!validBillingPeriods.includes(body.billingPeriod)) {
        return NextResponse.json(
          { error: `Période invalide. Doit être parmi: ${validBillingPeriods.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.billingPeriod = body.billingPeriod;
    }

    if (body.amount !== undefined) {
      const amt = Number(body.amount);
      if (Number.isNaN(amt) || amt < 0) {
        return NextResponse.json(
          { error: "Montant invalide" },
          { status: 400 }
        );
      }
      updateData.amount = Math.round(amt);
    }

    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod || null;
    }

    if (body.nextBillingDate !== undefined) {
      updateData.nextBillingDate = body.nextBillingDate ? new Date(body.nextBillingDate) : null;
    }

    if (body.currentPeriodEnd !== undefined) {
      updateData.currentPeriodEnd = new Date(body.currentPeriodEnd);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
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
    try {
      await db.platformLog.create({
        data: {
          level: "info",
          category: "payment",
          message: `Subscription updated for tenant: ${subscription.tenant.name} (${subscription.tenant.id}) — ${Object.keys(updateData).join(", ")}`,
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
    } catch {
      // Non-blocking
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[Superadmin] Failed to update subscription:", error);
    return NextResponse.json(
      { error: "Failed to update subscription" },
      { status: 500 }
    );
  }
}

// PUT (legacy alias for PATCH)
export async function PUT(request: NextRequest, ctx: Params) {
  return PATCH(request, ctx);
}

// DELETE /api/superadmin/subscriptions/[subscriptionId]
// Cascade delete: subscription + tenant + businesses + users
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { subscriptionId } = await params;

    const existing = await db.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            businesses: { select: { id: true } },
            users: { select: { id: true } },
          },
        },
        payments: { select: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Abonnement introuvable" },
        { status: 404 }
      );
    }

    const tenantId = existing.tenantId;
    const tenantName = existing.tenant.name;

    // Cascade delete in a transaction:
    // 1. Subscription payments
    // 2. Subscription
    // 3. Tenant users (with tenantId)
    // 4. Businesses of tenant
    // 5. Tenant itself
    await db.$transaction([
      db.subscriptionPayment.deleteMany({
        where: { subscriptionId },
      }),
      db.subscription.delete({ where: { id: subscriptionId } }),
      db.user.deleteMany({
        where: { tenantId },
      }),
      db.business.deleteMany({
        where: { tenantId },
      }),
      db.tenant.delete({ where: { id: tenantId } }),
    ]);

    // Log to PlatformLog
    try {
      await db.platformLog.create({
        data: {
          level: "warning",
          category: "tenant_change",
          message: `Tenant deleted via subscription cascade: ${tenantName} (${tenantId})`,
          metadata: JSON.stringify({
            tenantId,
            tenantName,
            subscriptionId,
            deletedUsersCount: existing.tenant.users.length,
            deletedBusinessesCount: existing.tenant.businesses.length,
          }),
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, id: subscriptionId, tenantId });
  } catch (error) {
    console.error("[Superadmin] Failed to delete subscription:", error);
    return NextResponse.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}
