import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API MARCHAND — Analytics boutique en ligne
// GET /api/store/analytics?businessId=xxx&period=week|month|all
//   → renvoie les visiteurs, vues produit, ajouts panier, commandes,
//     conversions et top produits vus pour la boutique publique du tenant.
//   (Le businessId permet de retrouver le tenant lié, comme /api/store/settings)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const period = searchParams.get("period") || "week";

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { tenantId: true },
    });
    if (!business?.tenantId) {
      return NextResponse.json({ error: "Aucun tenant" }, { status: 404 });
    }
    const tenantId = business.tenantId;

    // Calcul de la période
    const now = new Date();
    let startDate: Date;
    if (period === "all") {
      startDate = new Date(2020, 0, 1);
    } else if (period === "month") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      // week (défaut)
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    }

    // 1. Totaux par type d'événement
    const totals = await db.analyticsEvent.groupBy({
      by: ["type"],
      where: { tenantId, createdAt: { gte: startDate } },
      _count: { type: true },
    });
    const totalsMap: Record<string, number> = {};
    for (const t of totals) totalsMap[t.type] = t._count.type;

    // 2. Évolution journalière (7 ou 30 jours)
    const days = period === "month" ? 30 : 7;
    const daily: { date: string; visits: number; purchases: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const dayEvents = await db.analyticsEvent.groupBy({
        by: ["type"],
        where: {
          tenantId,
          createdAt: { gte: dayStart, lt: dayEnd },
        },
        _count: { type: true },
      });
      const dayMap: Record<string, number> = {};
      for (const d of dayEvents) dayMap[d.type] = d._count.type;
      daily.push({
        date: dayStart.toISOString().split("T")[0],
        visits: dayMap["page_view"] || 0,
        purchases: dayMap["purchase"] || 0,
      });
    }

    // 3. Top produits vus
    const topProductsRaw = await db.analyticsEvent.groupBy({
      by: ["productId"],
      where: {
        tenantId,
        type: "product_view",
        productId: { not: null },
        createdAt: { gte: startDate },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    });
    // Enrichir avec le nom du produit
    const topProducts = await Promise.all(
      topProductsRaw.map(async (p) => {
        const product = p.productId
          ? await db.product.findUnique({ where: { id: p.productId }, select: { name: true, salePrice: true, imageUrl: true } })
          : null;
        return {
          productId: p.productId,
          name: product?.name || "Produit supprimé",
          salePrice: product?.salePrice || 0,
          imageUrl: product?.imageUrl || null,
          views: p._count.productId,
        };
      })
    );

    // 4. Commandes en ligne (count + CA)
    const onlineOrders = await db.onlineOrder.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: { id: true, totalAmount: true, status: true },
    });
    const ordersCount = onlineOrders.length;
    const revenue = onlineOrders.reduce((s, o) => s + o.totalAmount, 0);

    // 5. Taux de conversion = purchases / visits
    const visits = totalsMap["page_view"] || 0;
    const purchases = totalsMap["purchase"] || 0;
    const conversionRate = visits > 0 ? Math.round((purchases / visits) * 1000) / 10 : 0;

    // 6. Abonnés newsletter + avis
    const newsletterCount = await db.newsletterSubscriber.count({
      where: { tenantId, isActive: true },
    });
    const reviewsCount = await db.review.count({
      where: { tenantId, isApproved: true },
    });
    const pendingReviews = await db.review.count({
      where: { tenantId, isApproved: false },
    });

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totals: {
        visits: visits,
        productViews: totalsMap["product_view"] || 0,
        addToCarts: totalsMap["add_to_cart"] || 0,
        checkouts: totalsMap["checkout"] || 0,
        purchases,
        whatsappClicks: totalsMap["whatsapp_click"] || 0,
        newsletterSubs: totalsMap["newsletter_subscribe"] || 0,
      },
      daily,
      topProducts,
      orders: {
        count: ordersCount,
        revenue,
      },
      conversionRate,
      newsletterCount,
      reviewsCount,
      pendingReviews,
    });
  } catch (error) {
    console.error("[GET /api/store/analytics] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
