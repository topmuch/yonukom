import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/online-orders?tenantId=xxx&status=PENDING
//        ou ?businessId=xxx&status=PENDING (résout le tenantId via Business)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantIdParam = searchParams.get("tenantId");
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");

    // Résoudre le tenantId : soit passé directement, soit via le businessId
    // (le login renvoie businessId au frontend, pas tenantId — on résout ici).
    let resolvedTenantId: string | null = tenantIdParam;
    if (!resolvedTenantId && businessId) {
      const business = await db.business.findUnique({
        where: { id: businessId },
        select: { tenantId: true },
      });
      resolvedTenantId = business?.tenantId ?? null;
    }

    if (!resolvedTenantId) {
      return NextResponse.json(
        { error: "tenantId ou businessId requis" },
        { status: 400 }
      );
    }

    const where: { tenantId: string; status?: string } = { tenantId: resolvedTenantId };
    if (status) where.status = status;

    const orders = await db.onlineOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Parse items JSON for each order
    const ordersWithItems = orders.map((order) => ({
      ...order,
      items: JSON.parse(order.items || "[]"),
    }));

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error("[GET /api/online-orders] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
