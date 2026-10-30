// ============================================================
// YonuKom — IA Locale : Moteur de Règles Intelligentes
// Analyze les données du commerçant (stock, ventes, employés)
// et génère des alertes & recommandations ACTIONNABLES.
//
// ⚠️ TOUT fonctionne HORS LIGNE. Pas de backend, pas de ML.
// Juste des règles métier intelligentes + statistiques simples.
// ============================================================

import * as ss from "simple-statistics";

// ==========================================
// TYPES
// ==========================================

/** Priorité d'une alerte/recommandation */
export type AIPriority = "urgent" | "suggestion" | "positive";

/** Type d'alerte */
export type AIAlertType =
  | "STOCK_CRITICAL"      // Rupture imminente (< 3 jours)
  | "STOCK_LOW"           // Stock bas (< 7 jours)
  | "REVENUE_DROP"        // Baisse anormale de CA
  | "REVENUE_TREND_DOWN"  // Tendance baissière
  | "REVENUE_TREND_UP"    // Tendance haussière
  | "CANCELLATION_SPIKE"  // Trop d'annulations
  | "CASH_VARIANCE"       // Écart de caisse suspect
  | "PAYMENT_MIX_ALERT"   // Déséquilibre moyens de paiement
  | "TOP_PERFORMER"       // Bon performer (positive)
  | "STOCK_HEALTHY";      // Stock sain (positive)

/** Action recommandée (actionnable !) */
export interface AIAction {
  type: "REORDER" | "INVESTIGATE" | "PROMOTE" | "ADJUST_PRICE" | "CHECK_CASH" | "TRAIN_EMPLOYEE";
  /** Description courte de l'action */
  label: string;
  /** Données contextuelles pour l'action */
  data: Record<string, unknown>;
}

/** Alerte / Recommandation générée par l'IA */
export interface AIAlert {
  id: string;
  type: AIAlertType;
  priority: AIPriority;
  /** Message principal (ex: "Stock critique : Riz 25kg (rupture dans 2 jours)") */
  message: string;
  /** Détail secondaire (ex: "Vente moyenne : 5/jour • Stock actuel : 10") */
  detail: string;
  /** Action recommandée (ACTIONNABLE — pas juste "stock bas") */
  action?: AIAction;
  /** ID du produit/employé concerné */
  entityId?: string;
  /** Nom du produit/employé concerné */
  entityName?: string;
  /** Score de confiance [0-1] */
  confidence: number;
  /** Timestamp de génération */
  createdAt: Date;
}

// ==========================================
// TYPES D'ENTRÉE (données du commerçant)
// ==========================================

export interface AIProduct {
  id: string;
  name: string;
  quantity: number;
  reservedQuantity: number;
  salePrice: number;
  purchasePrice: number;
  minStockAlert: number;
  category?: string;
}

export interface AISale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  date: Date | string;
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: string;
  isCancelled?: boolean;
}

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  salesCount: number;
  cancellationCount: number;
  totalRevenue: number;
  cashVarianceCount: number;
}

export interface AIRevenuePoint {
  date: string;       // YYYY-MM-DD
  revenue: number;    // FCFA
  orderCount: number;
}

export interface AIAllData {
  products: AIProduct[];
  sales: AISale[];
  employees: AIEmployee[];
  revenueHistory: AIRevenuePoint[];
  paymentBreakdown?: Record<string, number>;
}

// ==========================================
// UTILITAIRES
// ==========================================

/** Nombre de jours entre deux dates */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86400000;
}

/** Date il y a N jours */
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

/** Génère un ID unique pour une alerte */
function alertId(type: string, entityId?: string): string {
  return `${type}-${entityId || "global"}-${Date.now()}`;
}

/** Arrondit à l'entier supérieur (pour FCFA) */
function ceil(n: number): number {
  return Math.ceil(n);
}

// ==========================================
// 1. ANALYSE STOCK
// ==========================================

/**
 * Analyse les produits et l'historique des ventes pour détecter :
 * - Ruptures imminentes (< 3 jours de stock)
 * - Stocks bas (< 7 jours de stock)
 * - Produits avec stock sain (positive)
 *
 * Recommande des quantités de réapprovisionnement basées sur
 * la vente moyenne quotidienne des 7 derniers jours.
 *
 * ⚠️ ACTIONNABLE : "Commandez 35 unités de Riz 25kg" pas juste "Stock bas"
 */
export function analyzeStock(products: AIProduct[], sales: AISale[]): AIAlert[] {
  const alerts: AIAlert[] = [];
  const sevenDaysAgo = daysAgo(7);

  for (const product of products) {
    // Stock disponible = physique - réservé
    const available = product.quantity - product.reservedQuantity;

    // Ventes des 7 derniers jours pour ce produit
    const recentSales = sales.filter((s) => {
      if (s.productId !== product.id || s.isCancelled) return false;
      const saleDate = new Date(s.date);
      return saleDate >= sevenDaysAgo;
    });

    // Vente moyenne quotidienne
    const totalQtySold = recentSales.reduce((sum, s) => sum + s.quantity, 0);
    const avgDailySales = totalQtySold / 7;

    // Si pas de vente récente, on ne peut pas prédire
    if (avgDailySales === 0) {
      // Mais si stock = 0, c'est déjà en rupture
      if (available === 0) {
        alerts.push({
          id: alertId("STOCK_CRITICAL", product.id),
          type: "STOCK_CRITICAL",
          priority: "urgent",
          message: `Rupture totale : ${product.name}`,
          detail: `Stock = 0 • Aucune vente récente pour estimer la demande`,
          action: {
            type: "REORDER",
            label: `Réapprovisionner ${product.name}`,
            data: { productId: product.id, suggestedQuantity: product.minStockAlert * 2, currentStock: 0 },
          },
          entityId: product.id,
          entityName: product.name,
          confidence: 0.95,
          createdAt: new Date(),
        });
      }
      continue;
    }

    // Jours avant rupture
    const daysUntilStockout = available / avgDailySales;

    // --- RÈGLE 1 : STOCK CRITIQUE (< 3 jours) ---
    if (daysUntilStockout < 3) {
      const suggestedQty = Math.max(
        ceil(avgDailySales * 7),    // Commander pour 7 jours
        product.minStockAlert       // Au minimum, le seuil d'alerte
      );

      alerts.push({
        id: alertId("STOCK_CRITICAL", product.id),
        type: "STOCK_CRITICAL",
        priority: "urgent",
        message: `Stock critique : ${product.name} (rupture dans ${ceil(daysUntilStockout)} jour${ceil(daysUntilStockout) > 1 ? "s" : ""})`,
        detail: `Vente moy. : ${avgDailySales.toFixed(1)}/jour • Stock dispo : ${available} • Seuil : ${product.minStockAlert}`,
        action: {
          type: "REORDER",
          label: `Commander ${suggestedQty} ${product.name}`,
          data: { productId: product.id, suggestedQuantity: suggestedQty, currentStock: available, avgDailySales: avgDailySales.toFixed(1) },
        },
        entityId: product.id,
        entityName: product.name,
        confidence: 0.9,
        createdAt: new Date(),
      });
    }
    // --- RÈGLE 2 : STOCK BAS (< 7 jours) ---
    else if (daysUntilStockout < 7) {
      const suggestedQty = ceil(avgDailySales * 14); // Commander pour 2 semaines

      alerts.push({
        id: alertId("STOCK_LOW", product.id),
        type: "STOCK_LOW",
        priority: "suggestion",
        message: `Stock bas : ${product.name} (rupture dans ${ceil(daysUntilStockout)} jours)`,
        detail: `Vente moy. : ${avgDailySales.toFixed(1)}/jour • Stock dispo : ${available}`,
        action: {
          type: "REORDER",
          label: `Commander ${suggestedQty} ${product.name}`,
          data: { productId: product.id, suggestedQuantity: suggestedQty, currentStock: available, avgDailySales: avgDailySales.toFixed(1) },
        },
        entityId: product.id,
        entityName: product.name,
        confidence: 0.75,
        createdAt: new Date(),
      });
    }
    // --- RÈGLE 3 : STOCK SAIN (positive) ---
    else if (daysUntilStockout > 14 && available > product.minStockAlert * 2) {
      alerts.push({
        id: alertId("STOCK_HEALTHY", product.id),
        type: "STOCK_HEALTHY",
        priority: "positive",
        message: `Stock sain : ${product.name}`,
        detail: `${ceil(daysUntilStockout)} jours de stock • ${available} unités disponibles`,
        entityId: product.id,
        entityName: product.name,
        confidence: 0.6,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

// ==========================================
// 2. ANALYSE REVENU (Chiffre d'Affaires)
// ==========================================

/**
 * Analyse l'historique des revenus pour détecter :
 * - Baisse anormale de CA (> 30% vs moyenne)
 * - Tendance baissière (régression linéaire sur 30 jours)
 * - Tendance haussière (positive)
 *
 * Utilise simple-statistics pour la régression linéaire
 * et le calcul d'écart-type.
 */
export function analyzeRevenue(revenueHistory: AIRevenuePoint[]): AIAlert[] {
  const alerts: AIAlert[] = [];

  if (revenueHistory.length < 7) {
    // Pas assez de données pour analyser
    return alerts;
  }

  // Trier par date
  const sorted = [...revenueHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const revenues = sorted.map((r) => r.revenue);

  // --- RÈGLE 4 : BAISSE ANORMALE DE CA ---
  // Comparer les 3 derniers jours vs la moyenne des 30 derniers jours
  if (revenues.length >= 7) {
    const recentDays = Math.min(3, revenues.length);
    const recentRevenue = revenues.slice(-recentDays);
    const recentAvg = ss.mean(recentRevenue);

    const historicalAvg = ss.mean(revenues);
    const historicalStdDev = ss.standardDeviation(revenues);

    // Baisse > 1.5 écart-type = anormale
    if (historicalStdDev > 0 && (historicalAvg - recentAvg) > historicalStdDev * 1.5) {
      const dropPercent = Math.round(((historicalAvg - recentAvg) / historicalAvg) * 100);

      alerts.push({
        id: alertId("REVENUE_DROP"),
        type: "REVENUE_DROP",
        priority: "urgent",
        message: `Baisse anormale de CA : -${dropPercent}% ces ${recentDays} jours`,
        detail: `CA récent : ${ceil(recentAvg).toLocaleString()} FCFA/jour • Moyenne : ${ceil(historicalAvg).toLocaleString()} FCFA/jour`,
        action: {
          type: "INVESTIGATE",
          label: "Analyser la baisse",
          data: { recentAvg: ceil(recentAvg), historicalAvg: ceil(historicalAvg), dropPercent },
        },
        confidence: 0.85,
        createdAt: new Date(),
      });
    }
  }

  // --- RÈGLE 5 : TENDANCE (régression linéaire) ---
  if (revenues.length >= 14) {
    // Points pour la régression : x = jour (0, 1, 2...), y = revenu
    const points: [number, number][] = revenues.map((r, i) => [i, r]);

    // Régression linéaire : y = mx + b
    const regression = ss.linearRegression(points);
    const slope = regression.m; // pente = tendance
    const intercept = regression.b;

    // Pente relative (en % de la moyenne)
    const avgRevenue = ss.mean(revenues);
    const relativeSlope = avgRevenue > 0 ? (slope / avgRevenue) * 100 : 0;

    // Tendance baissière significative
    if (relativeSlope < -1) {
      // Pente négative > 1% par jour
      const projectedIn7Days = slope * (revenues.length + 7) + intercept;

      alerts.push({
        id: alertId("REVENUE_TREND_DOWN"),
        type: "REVENUE_TREND_DOWN",
        priority: "suggestion",
        message: `Tendance baissière : CA en baisse de ${Math.abs(relativeSlope).toFixed(1)}%/jour`,
        detail: `Projection dans 7 jours : ${ceil(Math.max(0, projectedIn7Days)).toLocaleString()} FCFA/jour`,
        action: {
          type: "PROMOTE",
          label: "Boostez vos ventes",
          data: { slope: relativeSlope.toFixed(2), projected: ceil(Math.max(0, projectedIn7Days)) },
        },
        confidence: 0.7,
        createdAt: new Date(),
      });
    }
    // Tendance haussière significative
    else if (relativeSlope > 1) {
      alerts.push({
        id: alertId("REVENUE_TREND_UP"),
        type: "REVENUE_TREND_UP",
        priority: "positive",
        message: `Tendance haussière : CA en hausse de ${relativeSlope.toFixed(1)}%/jour`,
        detail: `Continuez sur cette lancée ! La croissance est constante.`,
        confidence: 0.7,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

// ==========================================
// 3. ANALYSE PERFORMANCE EMPLOYÉS
// ==========================================

/**
 * Analyse les performances et comportements des employés :
 * - Taux d'annulation anormalement élevé (> 20%)
 * - Écarts de caisse fréquents
 * - Top performer (positive)
 *
 * ⚠️ Anti-fraude : détecte les comportements suspects
 * sans accusation — juste une alerte pour investigation.
 */
export function analyzeEmployeePerformance(employees: AIEmployee[]): AIAlert[] {
  const alerts: AIAlert[] = [];

  for (const emp of employees) {
    // Ignorer les employés sans ventes
    if (emp.salesCount === 0) continue;

    // --- RÈGLE 6 : TAUX D'ANNULATION ÉLEVÉ ---
    const cancellationRate = emp.cancellationCount / emp.salesCount;

    if (cancellationRate > 0.2 && emp.cancellationCount >= 3) {
      // Plus de 20% d'annulations ET au moins 3 annulations
      const ratePercent = Math.round(cancellationRate * 100);

      alerts.push({
        id: alertId("CANCELLATION_SPIKE", emp.id),
        type: "CANCELLATION_SPIKE",
        priority: "urgent",
        message: `Taux d'annulation élevé : ${emp.name} (${ratePercent}%)`,
        detail: `${emp.cancellationCount} annulations sur ${emp.salesCount} ventes • À investiguer`,
        action: {
          type: "INVESTIGATE",
          label: `Vérifier les ventes de ${emp.name}`,
          data: { employeeId: emp.id, cancellationRate: ratePercent, cancellationCount: emp.cancellationCount, salesCount: emp.salesCount },
        },
        entityId: emp.id,
        entityName: emp.name,
        confidence: 0.8,
        createdAt: new Date(),
      });
    }

    // --- RÈGLE 7 : ÉCARTS DE CAISSE FRÉQUENTS ---
    if (emp.cashVarianceCount >= 2) {
      alerts.push({
        id: alertId("CASH_VARIANCE", emp.id),
        type: "CASH_VARIANCE",
        priority: "urgent",
        message: `Écarts de caisse fréquents : ${emp.name} (${emp.cashVarianceCount} fois)`,
        detail: `${emp.cashVarianceCount} sessions avec écart • Vérifier les procédures de clôture`,
        action: {
          type: "CHECK_CASH",
          label: `Vérifier les clôtures de ${emp.name}`,
          data: { employeeId: emp.id, cashVarianceCount: emp.cashVarianceCount },
        },
        entityId: emp.id,
        entityName: emp.name,
        confidence: 0.85,
        createdAt: new Date(),
      });
    }

    // --- RÈGLE 8 : TOP PERFORMER ---
    // Le meilleur vendeur (par revenue) avec taux d'annulation < 5%
    const isLowCancellation = cancellationRate < 0.05;
    const isTopSeller = emp.totalRevenue > 0 && emp.salesCount >= 5;

    if (isTopSeller && isLowCancellation) {
      alerts.push({
        id: alertId("TOP_PERFORMER", emp.id),
        type: "TOP_PERFORMER",
        priority: "positive",
        message: `Top vendeur : ${emp.name}`,
        detail: `${emp.salesCount} ventes • ${emp.totalRevenue.toLocaleString()} FCFA de CA • ${Math.round(cancellationRate * 100)}% d'annulations`,
        entityId: emp.id,
        entityName: emp.name,
        confidence: 0.7,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

// ==========================================
// 4. ANALYSE MOYENS DE PAIEMENT
// ==========================================

/**
 * Détecte un déséquilibre dans les moyens de paiement.
 * Si un seul méthode représente > 70% du total → alerte.
 * (Risque de dépendance à un seul canal)
 */
export function analyzePaymentMix(paymentBreakdown: Record<string, number>): AIAlert[] {
  const alerts: AIAlert[] = [];
  const total = Object.values(paymentBreakdown).reduce((s, v) => s + v, 0);

  if (total === 0) return alerts;

  const PAYMENT_LABELS: Record<string, string> = {
    wave: "Wave",
    orange_money: "Orange Money",
    cash: "Espèces",
    cb: "Carte bancaire",
    cheque: "Chèque",
    virement: "Virement",
  };

  for (const [method, amount] of Object.entries(paymentBreakdown)) {
    const ratio = amount / total;
    if (ratio > 0.7) {
      alerts.push({
        id: alertId("PAYMENT_MIX_ALERT", method),
        type: "PAYMENT_MIX_ALERT",
        priority: "suggestion",
        message: `Dépendance paiement : ${Math.round(ratio * 100)}% via ${PAYMENT_LABELS[method] || method}`,
        detail: `Diversifiez vos canaux de paiement pour réduire le risque`,
        action: {
          type: "PROMOTE",
          label: `Promouvoir d'autres moyens de paiement`,
          data: { dominantMethod: method, ratio: Math.round(ratio * 100) },
        },
        confidence: 0.65,
        createdAt: new Date(),
      });
    }
  }

  return alerts;
}

// ==========================================
// 5. GÉNÉRATION DE RECOMMANDATIONS
// ==========================================

/**
 * Combine TOUTES les analyses et génère une liste de
 * recommandations PRIORISÉES (Urgent → Suggestion → Positive).
 *
 * C'est la fonction principale appelée par le scheduler.
 */
export function generateRecommendations(data: AIAllData): AIAlert[] {
  const allAlerts: AIAlert[] = [];

  // 1. Analyse stock
  allAlerts.push(...analyzeStock(data.products, data.sales));

  // 2. Analyse revenu
  allAlerts.push(...analyzeRevenue(data.revenueHistory));

  // 3. Analyse employés
  allAlerts.push(...analyzeEmployeePerformance(data.employees));

  // 4. Analyse moyens de paiement
  if (data.paymentBreakdown && Object.keys(data.paymentBreakdown).length > 0) {
    allAlerts.push(...analyzePaymentMix(data.paymentBreakdown));
  }

  // Trier par priorité : urgent → suggestion → positive
  const priorityOrder: Record<AIPriority, number> = {
    urgent: 0,
    suggestion: 1,
    positive: 2,
  };

  allAlerts.sort((a, b) => {
    const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priDiff !== 0) return priDiff;
    // Même priorité → trier par confiance décroissante
    return b.confidence - a.confidence;
  });

  // Limiter à 20 alertes maximum (pas de surcharge)
  return allAlerts.slice(0, 20);
}

// ==========================================
// UTILITAIRE : Ligne de tendance
// ==========================================

/**
 * Calcule les points de la ligne de tendance (régression linéaire)
 * pour affichage sur un graphique Recharts.
 *
 * @param dataPoints - Les points de données [{x, y}]
 * @returns Les 2 points de la ligne de tendance (début et fin)
 */
export function calculateTrendLine(
  dataPoints: { x: number; y: number }[]
): { x: number; y: number }[] {
  if (dataPoints.length < 2) return [];

  const points: [number, number][] = dataPoints.map((p) => [p.x, p.y]);
  const regression = ss.linearRegression(points);

  // Générer la ligne sur le même range X
  const minX = Math.min(...dataPoints.map((p) => p.x));
  const maxX = Math.max(...dataPoints.map((p) => p.x));

  return [
    { x: minX, y: regression.m * minX + regression.b },
    { x: maxX, y: regression.m * maxX + regression.b },
  ];
}

/**
 * Calcule la moyenne mobile sur N jours
 * pour lisser les variations quotidiennes.
 */
export function movingAverage(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null; // Pas assez de données
    const slice = values.slice(i - window + 1, i + 1);
    return ss.mean(slice);
  });
}
