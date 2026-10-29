import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/business/reset
// Body: { businessId }
// Supprime toutes les données commerciales du business (orders, products,
// customers, cashSessions, auditLogs) SANS supprimer le business lui-même
// ni l'utilisateur. Permet à un commerçant de repartir d'un compte propre.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    // Vérifier que le business existe
    const business = await db.business.findUnique({ where: { id: businessId } });
    if (!business) {
      return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
    }

    // Supprimer dans l'ordre des FK (les enfants d'abord)
    // 1. Audit logs
    await db.auditLog.deleteMany({ where: { businessId } });

    // 2. Cash sessions (s'ils existent)
    try {
      await (db as any).cashSession.deleteMany({ where: { businessId } });
    } catch {
      /* table peut ne pas exister */
    }

    // 3. Payments liés aux orders (via orderItems)
    //    On doit d'abord récupérer les order IDs, puis supprimer leurs payments
    const orders = await db.order.findMany({
      where: { businessId },
      select: { id: true },
    });
    const orderIds = orders.map((o) => o.id);

    if (orderIds.length > 0) {
      try {
        await (db as any).payment.deleteMany({
          where: { orderId: { in: orderIds } },
        });
      } catch {
        /* ignore */
      }
    }

    // 4. Order items
    try {
      await (db as any).orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });
    } catch {
      /* ignore */
    }

    // 5. Orders
    await db.order.deleteMany({ where: { businessId } });

    // 6. Products
    await db.product.deleteMany({ where: { businessId } });

    // 7. Customers
    await db.customer.deleteMany({ where: { businessId } });

    return NextResponse.json({
      success: true,
      message: "Toutes les données commerciales ont été supprimées",
      deleted: {
        orders: orderIds.length,
        products: true,
        customers: true,
        auditLogs: true,
      },
    });
  } catch (error) {
    console.error("[POST /api/business/reset] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
