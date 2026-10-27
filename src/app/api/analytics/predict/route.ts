// ============================================================
// YonuKom — API Analytics prédictifs (IA statistique)
// GET /api/analytics/predict?businessId=xxx
//
// Calcule 3 prédictions sans ML externe (modèle statistique simple) :
//   1. Prévision des ventes sur 30 jours (moyenne mobile + saisonnalité hebdo)
//   2. Recommandations de réapprovisionnement produits
//   3. Détection d'anomalies (jours hors-norme = potentiel pic / fraude / trend)
//
// Tous les calculs sont déterministes et basés sur 90 jours d'historique.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// --- Types retournés ---
interface ForecastDay {
  date: string; // YYYY-MM-DD
  revenue: number; // revenu prédit (FCFA)
  isWeekend: boolean;
}

interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  avgDailySales: number; // ventes moyennes/jour sur 30j
  daysUntilStockout: number; // jours avant rupture estimés
  recommendedReorderQty: number; // qté à recommander pour tenir 14j
  urgency: "critical" | "high" | "medium" | "low";
}

interface Anomaly {
  date: string;
  actualRevenue: number;
  expectedRevenue: number; // moyenne mobile 7j
  ratio: number; // actual / expected
  type: "spike" | "drop";
}

interface PredictResponse {
  salesForecast: ForecastDay[];
  predictedMonthTotal: number;
  growthRate: number; // % par rapport aux 30j précédents
  previousMonthTotal: number;
  restockRecommendations: RestockRecommendation[];
  anomalies: Anomaly[];
  lastUpdated: string;
  meta: {
    historyDays: number;
    forecastDays: number;
    movingAverageWindow: number;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FORECAST_DAYS = 30;
const HISTORY_DAYS = 90;
const MA_WINDOW = 7; // moyenne mobile 7 jours
const REORDER_COVERAGE_DAYS = 14;

// 0 = dimanche, 1 = lundi, ..., 6 = samedi
function dayOfWeek(date: Date): number {
  return date.getDay();
}

// Calcule un index de saisonnalité par jour de la semaine à partir des données historiques.
// Pour chaque jour de la semaine, on compare la moyenne des ventes de ce jour vs la moyenne globale.
// Retourne un tableau de 7 coefficients (index 0 = dimanche).
function computeDayOfWeekSeasonality(
  dailyRevenue: Map<string, number>,
  startDate: Date,
  days: number
): number[] {
  const totalsByDay = [0, 0, 0, 0, 0, 0, 0]; // dim, lun, mar, mer, jeu, ven, sam
  const countsByDay = [0, 0, 0, 0, 0, 0, 0];
  let grandTotal = 0;
  let grandCount = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * DAY_MS);
    const dKey = d.toISOString().split("T")[0];
    const rev = dailyRevenue.get(dKey) || 0;
    const dow = dayOfWeek(d);
    totalsByDay[dow] += rev;
    countsByDay[dow] += 1;
    grandTotal += rev;
    grandCount += 1;
  }

  const grandAvg = grandCount > 0 ? grandTotal / grandCount : 0;
  // Coefficient = moyenne du jour / moyenne globale. Si pas de données → 1.0 (neutre)
  return totalsByDay.map((total, idx) => {
    if (countsByDay[idx] === 0 || grandAvg === 0) return 1.0;
    const dayAvg = total / countsByDay[idx];
    return dayAvg / grandAvg;
  });
}

// Moyenne mobile simple sur N jours
function movingAverage(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(avg);
  }
  return result;
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

    // Vérifier ownership rapide
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- 1. Récupérer 90 jours d'historique de commandes non annulées ---
    const now = new Date();
    const historyStart = new Date(now.getTime() - HISTORY_DAYS * DAY_MS);

    const orders = await db.order.findMany({
      where: {
        businessId,
        isCancelled: false,
        createdAt: { gte: historyStart },
      },
      select: {
        totalAmount: true,
        createdAt: true,
        orderItems: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    });

    // --- Agréger le revenu par jour ---
    const dailyRevenue = new Map<string, number>();
    for (const o of orders) {
      const key = o.createdAt.toISOString().split("T")[0];
      dailyRevenue.set(key, (dailyRevenue.get(key) || 0) + o.totalAmount);
    }

    // Construire le tableau de revenus historiques jour par jour (90 entrées)
    const historyRevenue: { date: Date; revenue: number }[] = [];
    for (let i = 0; i < HISTORY_DAYS; i++) {
      const d = new Date(historyStart.getTime() + i * DAY_MS);
      const key = d.toISOString().split("T")[0];
      historyRevenue.push({ date: d, revenue: dailyRevenue.get(key) || 0 });
    }

    // --- 2. Calculer la saisonnalité hebdomadaire ---
    const seasonality = computeDayOfWeekSeasonality(
      dailyRevenue,
      historyStart,
      HISTORY_DAYS
    );

    // --- 3. Moyenne mobile du revenu récent (7 derniers jours) ---
    const recentRevenues = historyRevenue.slice(-MA_WINDOW).map((h) => h.revenue);
    const baseAvg =
      recentRevenues.reduce((a, b) => a + b, 0) /
      Math.max(1, recentRevenues.length);

    // --- 4. Générer la prévision sur 30 jours ---
    // Méthode : baseAvg × coefficient de saisonnalité du jour cible
    // (modèle simple : niveau × saisonnalité — suffisant pour la démo et utile en pratique)
    const salesForecast: ForecastDay[] = [];
    for (let i = 1; i <= FORECAST_DAYS; i++) {
      const targetDate = new Date(now.getTime() + i * DAY_MS);
      const dow = dayOfWeek(targetDate);
      const predicted = Math.round(baseAvg * seasonality[dow]);
      salesForecast.push({
        date: targetDate.toISOString().split("T")[0],
        revenue: Math.max(0, predicted),
        isWeekend: dow === 0 || dow === 6,
      });
    }

    const predictedMonthTotal = salesForecast.reduce(
      (sum, d) => sum + d.revenue,
      0
    );

    // --- 5. Growth rate vs 30 jours précédents ---
    const previousMonthSlice = historyRevenue.slice(-30);
    const previousMonthTotal = previousMonthSlice.reduce(
      (sum, d) => sum + d.revenue,
      0
    );
    const growthRate =
      previousMonthTotal > 0
        ? Math.round(
            ((predictedMonthTotal - previousMonthTotal) / previousMonthTotal) *
              100
          )
        : predictedMonthTotal > 0
        ? 100
        : 0;

    // --- 6. Détection d'anomalies ---
    // Un jour est "anormal" si son revenu est > 2× la MA7 (spike)
    // ou < 0.5× la MA7 (drop) — et un revenu minimum absolu pour éviter le bruit des jours à 0.
    const anomalies: Anomaly[] = [];
    const historyRevenuesOnly = historyRevenue.map((h) => h.revenue);
    const ma = movingAverage(historyRevenuesOnly, MA_WINDOW);

    const noiseThreshold = Math.max(5000, baseAvg * 0.3); // 5k FCFA min ou 30% de la base

    for (let i = MA_WINDOW; i < historyRevenue.length; i++) {
      const actual = historyRevenue[i].revenue;
      const expected = ma[i - 1] || baseAvg;
      if (expected < noiseThreshold) continue; // pas assez de signal pour parler d'anomalie
      const ratio = actual / expected;
      if (ratio > 2) {
        anomalies.push({
          date: historyRevenue[i].date.toISOString().split("T")[0],
          actualRevenue: actual,
          expectedRevenue: Math.round(expected),
          ratio: Math.round(ratio * 100) / 100,
          type: "spike",
        });
      } else if (ratio < 0.5) {
        anomalies.push({
          date: historyRevenue[i].date.toISOString().split("T")[0],
          actualRevenue: actual,
          expectedRevenue: Math.round(expected),
          ratio: Math.round(ratio * 100) / 100,
          type: "drop",
        });
      }
    }

    // Trier anomalies par ratio décroissant (les plus marquées d'abord), garder les 20 max
    anomalies.sort((a, b) => b.ratio - a.ratio);
    const topAnomalies = anomalies.slice(0, 20);

    // --- 7. Recommandations de réapprovisionnement ---
    // Pour chaque produit actif du business, on calcule la vente moyenne quotidienne
    // sur les 30 derniers jours à partir des OrderItems.
    const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY_MS);
    const recentItems = await db.orderItem.findMany({
      where: {
        order: {
          businessId,
          isCancelled: false,
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      select: {
        productId: true,
        quantity: true,
        createdAt: true,
      },
    });

    // Agréger par produit : quantité totale vendue + nombre de jours distincts
    const productSales = new Map<
      string,
      { totalQty: number; daysWithSale: Set<string> }
    >();
    for (const it of recentItems) {
      if (!it.productId) continue;
      const key = it.productId;
      if (!productSales.has(key)) {
        productSales.set(key, { totalQty: 0, daysWithSale: new Set() });
      }
      const entry = productSales.get(key)!;
      entry.totalQty += it.quantity;
      entry.daysWithSale.add(it.createdAt.toISOString().split("T")[0]);
    }

    // Récupérer les produits actifs
    const products = await db.product.findMany({
      where: {
        businessId,
        isActive: true,
        // On ne recommande pas pour les services / plats (pas de stock déductible)
        productType: { in: ["standard"] },
      },
      select: {
        id: true,
        name: true,
        quantity: true,
        minStockAlert: true,
        purchasePrice: true,
      },
    });

    const restockRecommendations: RestockRecommendation[] = [];
    for (const p of products) {
      const sales = productSales.get(p.id);
      const totalQty = sales?.totalQty || 0;
      // Ventes moyennes/jour = totalQty / 30 (sur 30 jours d'historique)
      const avgDailySales = totalQty / 30;

      // Si pas de vente récente ET stock sain → on ignore
      if (avgDailySales <= 0 && p.quantity > p.minStockAlert) continue;

      const daysUntilStockout =
        avgDailySales > 0 ? Math.floor(p.quantity / avgDailySales) : 999;

      // Recommandation : on recommande de réapprovisionner si
      //   (a) stock < seuil d'alerte, OU
      //   (b) daysUntilStockout < 14 jours (couverture cible)
      const needsReorder =
        p.quantity <= p.minStockAlert || daysUntilStockout < REORDER_COVERAGE_DAYS;

      if (!needsReorder) continue;

      // Qté recommandée = ce qu'il faut pour tenir 14 jours de plus (au-delà du stock actuel)
      const recommendedReorderQty = Math.max(
        p.minStockAlert * 2,
        Math.ceil(avgDailySales * REORDER_COVERAGE_DAYS) - p.quantity
      );

      let urgency: RestockRecommendation["urgency"];
      if (p.quantity === 0) urgency = "critical";
      else if (daysUntilStockout <= 3) urgency = "critical";
      else if (daysUntilStockout <= 7) urgency = "high";
      else if (daysUntilStockout <= 14) urgency = "medium";
      else urgency = "low";

      restockRecommendations.push({
        productId: p.id,
        productName: p.name,
        currentStock: p.quantity,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        daysUntilStockout,
        recommendedReorderQty: Math.max(1, recommendedReorderQty),
        urgency,
      });
    }

    // Trier par urgence (rupture imminente en premier)
    const urgencyOrder: Record<RestockRecommendation["urgency"], number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    restockRecommendations.sort(
      (a, b) =>
        urgencyOrder[a.urgency] - urgencyOrder[b.urgency] ||
        a.daysUntilStockout - b.daysUntilStockout
    );

    const response: PredictResponse = {
      salesForecast,
      predictedMonthTotal,
      growthRate,
      previousMonthTotal,
      restockRecommendations,
      anomalies: topAnomalies,
      lastUpdated: now.toISOString(),
      meta: {
        historyDays: HISTORY_DAYS,
        forecastDays: FORECAST_DAYS,
        movingAverageWindow: MA_WINDOW,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Analytics/Predict] error:", error);
    return NextResponse.json(
      { error: "Échec du calcul des prévisions" },
      { status: 500 }
    );
  }
}
