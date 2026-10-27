// ============================================================
// YonuKom — API Analytics Insights (IA générative)
// GET /api/analytics/insights?businessId=xxx
//
// Génère 4-6 insights actionnables en français à partir des stats brutes.
// Utilise z-ai-web-dev-sdk (glm-4-flash) — avec fallback déterministe
// si l'IA échoue ou n'est pas disponible.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatFCFA } from "@/lib/fcfa";

interface InsightsResponse {
  insights: string[];
  source: "ai" | "fallback";
  generatedAt: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Calcule un résumé statistique du commerce (30 derniers jours)
async function computeBusinessStats(businessId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY_MS); // pour comparer 30j précédents

  const [business, orders, recentOrders, prevOrders, products] =
    await Promise.all([
      db.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, type: true },
      }),
      db.order.findMany({
        where: {
          businessId,
          isCancelled: false,
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          orderItems: { select: { productId: true, product: { select: { name: true } }, quantity: true, totalPrice: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      // Just for count
      db.order.count({
        where: {
          businessId,
          isCancelled: false,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      db.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: {
          businessId,
          isCancelled: false,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      db.product.findMany({
        where: { businessId, isActive: true },
        select: { id: true, name: true, quantity: true, minStockAlert: true },
      }),
    ]);

  if (!business) return null;

  // Stats globales
  const totalSales = orders.reduce((s, o) => s + o.totalAmount, 0);
  const orderCount = orders.length;
  const avgOrderValue = orderCount > 0 ? Math.round(totalSales / orderCount) : 0;

  // Période précédente (30j d'avant)
  const prevTotalSales = prevOrders._sum.totalAmount || 0;
  const prevOrderCount = prevOrders._count;
  const salesGrowthPct =
    prevTotalSales > 0
      ? Math.round(((totalSales - prevTotalSales) / prevTotalSales) * 100)
      : totalSales > 0
      ? 100
      : 0;

  // Top produit par revenu
  const productRevenue = new Map<
    string,
    { name: string; revenue: number; qty: number }
  >();
  for (const o of orders) {
    for (const it of o.orderItems) {
      const key = it.productId;
      if (!productRevenue.has(key)) {
        productRevenue.set(key, {
          name: it.product?.name || "Inconnu",
          revenue: 0,
          qty: 0,
        });
      }
      const entry = productRevenue.get(key)!;
      entry.revenue += it.totalPrice;
      entry.qty += it.quantity;
    }
  }
  const topProducts = [...productRevenue.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const topProduct = topProducts[0] || null;

  // Jour le plus actif (par revenu)
  const dayRevenue = new Map<string, number>(); // 0=dim, ..., 6=sam
  const dayLabels = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ];
  for (const o of orders) {
    const dow = o.createdAt.getDay();
    dayRevenue.set(dow, (dayRevenue.get(dow) || 0) + o.totalAmount);
  }
  let busiestDay: { day: string; revenue: number; pct: number } | null = null;
  if (totalSales > 0) {
    let bestDow = 0;
    let bestRev = -1;
    for (const [dow, rev] of dayRevenue.entries()) {
      if (rev > bestRev) {
        bestRev = rev;
        bestDow = Number(dow);
      }
    }
    if (bestRev > 0) {
      busiestDay = {
        day: dayLabels[bestDow],
        revenue: bestRev,
        pct: Math.round((bestRev / totalSales) * 100),
      };
    }
  }

  // Clients uniques
  const uniqueCustomers = new Set(
    orders.map((o) => o.customerId).filter(Boolean)
  ).size;

  // Stock alerts
  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.minStockAlert
  );

  return {
    business,
    totalSales,
    orderCount,
    avgOrderValue,
    prevTotalSales,
    prevOrderCount,
    salesGrowthPct,
    topProduct,
    topProducts,
    busiestDay,
    uniqueCustomers,
    lowStockProducts,
    productCount: products.length,
  };
}

// Génère des insights déterministes en français (fallback non-AI)
function buildFallbackInsights(stats: NonNullable<
  Awaited<ReturnType<typeof computeBusinessStats>>
>): string[] {
  const insights: string[] = [];

  if (stats.totalSales === 0 && stats.orderCount === 0) {
    insights.push(
      "Aucune vente enregistrée sur les 30 derniers jours. Créez votre première commande pour déclencher l'analyse prédictive."
    );
    return insights;
  }

  // 1. Croissance
  if (stats.salesGrowthPct > 0) {
    insights.push(
      `Vos ventes ont progressé de ${stats.salesGrowthPct}% par rapport au mois précédent (${formatFCFA(
        stats.totalSales
      )} vs ${formatFCFA(stats.prevTotalSales)}). Continuez sur cette lancée.`
    );
  } else if (stats.salesGrowthPct < 0) {
    insights.push(
      `Vos ventes ont baissé de ${Math.abs(
        stats.salesGrowthPct
      )}% ce mois-ci. Analysez les causes : saisonnalité, rupture de stock, ou baisse de fréquentation ?`
    );
  } else {
    insights.push(
      `Vos ventes sont stables par rapport au mois dernier (${formatFCFA(
        stats.totalSales
      )} sur ${stats.orderCount} commandes).`
    );
  }

  // 2. Top produit
  if (stats.topProduct) {
    insights.push(
      `Votre produit phare est « ${stats.topProduct.name} » avec ${formatFCFA(
        stats.topProduct.revenue
      )} de revenu (${stats.topProduct.qty} unités vendues). Mettez-le en avant sur vos réseaux sociaux.`
    );
  }

  // 3. Jour le plus actif
  if (stats.busiestDay) {
    insights.push(
      `Le ${stats.busiestDay.day} représente ${stats.busiestDay.pct}% de votre chiffre d'affaires. Renforcez le stock et les effectifs la veille au soir.`
    );
  }

  // 4. Panier moyen
  if (stats.avgOrderValue > 0) {
    insights.push(
      `Panier moyen : ${formatFCFA(
        stats.avgOrderValue
      )}. Proposez des ventes additionnelles (cross-sell) pour l'augmenter de 10%.`
    );
  }

  // 5. Stock
  if (stats.lowStockProducts.length > 0) {
    const list = stats.lowStockProducts
      .slice(0, 3)
      .map((p) => `« ${p.name} » (${p.quantity} restant)`)
      .join(", ");
    insights.push(
      `⚠️ ${stats.lowStockProducts.length} produit(s) en stock bas : ${list}. Réapprovisionnez rapidement pour ne pas perdre de ventes.`
    );
  } else {
    insights.push(
      "✅ Tous vos stocks sont sains. Aucun réapprovisionnement urgent à prévoir."
    );
  }

  // 6. Clients
  if (stats.uniqueCustomers > 0) {
    insights.push(
      `${stats.uniqueCustomers} client(s) distinct(s) ont commandé ce mois. Lancez une campagne WhatsApp de fidélisation pour les réactiver.`
    );
  }

  return insights;
}

// Construit le prompt pour l'IA
function buildAiPrompt(stats: NonNullable<
  Awaited<ReturnType<typeof computeBusinessStats>>
>): string {
  const lines: string[] = [];
  lines.push(
    `Tu es un conseiller commercial expert pour le commerce « ${stats.business.name} » (Sénégal).`
  );
  lines.push(
    `Voici les statistiques des 30 derniers jours (montants en FCFA) :`
  );
  lines.push(`- Chiffre d'affaires : ${stats.totalSales} FCFA`);
  lines.push(`- Nombre de commandes : ${stats.orderCount}`);
  lines.push(`- Panier moyen : ${stats.avgOrderValue} FCFA`);
  lines.push(
    `- Évolution vs mois précédent : ${stats.salesGrowthPct}% (${stats.prevTotalSales} FCFA le mois d'avant)`
  );
  if (stats.topProduct) {
    lines.push(
      `- Top produit : ${stats.topProduct.name} (${stats.topProduct.revenue} FCFA, ${stats.topProduct.qty} unités)`
    );
  }
  if (stats.busiestDay) {
    lines.push(
      `- Jour le plus actif : ${stats.busiestDay.day} (${stats.busiestDay.pct}% du CA)`
    );
  }
  lines.push(`- Clients distincts : ${stats.uniqueCustomers}`);
  lines.push(
    `- Produits en stock bas : ${stats.lowStockProducts.length} sur ${stats.productCount}`
  );

  lines.push("");
  lines.push(
    "Génère 4 à 6 insights ACTIONNABLES en français, court (max 200 caractères chacun),"
  );
  lines.push(
    "orientés commerçant sénégalais. Une seule phrase par insight. Pas de puces ni numérotation."
  );
  lines.push(
    "Mets en avant des actions concrètes : réapprovisionnement, offres ciblées, fidélisation WhatsApp,"
  );
  lines.push(
    "ajustements de prix, gestion des pics de demande. Sois direct et pragmatique."
  );
  lines.push("");
  lines.push(
    "Réponds UNIQUEMENT avec les insights, un par ligne (séparés par un saut de ligne)."
  );

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const stats = await computeBusinessStats(businessId);
    if (!stats) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- Tenter l'IA ---
    let aiInsights: string[] | null = null;
    try {
      // Import dynamique pour éviter de casser le build si le SDK n'est pas dispo en CI
      const ZAIModule = await import("z-ai-web-dev-sdk");
      const ZAI = (ZAIModule as { default?: any; create?: any }).default ||
        (ZAIModule as any);
      const zai = await ZAI.create();
      const prompt = buildAiPrompt(stats);

      const response = await zai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant analyste commercial expert pour les PME au Sénégal. Réponds en français.",
          },
          { role: "user", content: prompt },
        ],
        model: "glm-4-flash",
        temperature: 0.7,
        max_tokens: 800,
      });

      const content: string =
        response?.choices?.[0]?.message?.content || "";

      // Parser la réponse : un insight par ligne
      aiInsights = content
        .split(/\n+/)
        .map((line: string) =>
          line
            .replace(/^[\s>*\-•\d.)\]]+/, "")
            .replace(/^\*+|\*+$/g, "")
            .trim()
        )
        .filter((line: string) => line.length >= 20 && line.length <= 400)
        .slice(0, 6);
    } catch (aiError) {
      console.warn("[Analytics/Insights] AI call failed, using fallback:", aiError);
      aiInsights = null;
    }

    const insights = aiInsights && aiInsights.length >= 3
      ? aiInsights
      : buildFallbackInsights(stats);

    const result: InsightsResponse = {
      insights,
      source: aiInsights && aiInsights.length >= 3 ? "ai" : "fallback",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Analytics/Insights] error:", error);
    return NextResponse.json(
      { error: "Échec de la génération des insights" },
      { status: 500 }
    );
  }
}
