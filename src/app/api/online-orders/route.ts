import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/online-orders?tenantId=xxx&status=PENDING
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const status = searchParams.get("status");

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId requis" }, { status: 400 });
    }

    const where: any = { tenantId };
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
