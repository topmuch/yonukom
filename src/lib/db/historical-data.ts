// ============================================================
// YonuKom — IA Locale : Données Historiques
// Synchronise les données du backend → IndexedDB pour que
// l'IA locale puisse les analyser même HORS LIGNE.
//
// ⚠️ Toutes les fonctions sont OFFLINE-FIRST.
// Si le backend est indisponible, on utilise les données locales.
// ============================================================

import { localDB, type SalesHistoryEntry, type StockHistoryEntry, type RevenueHistoryEntry } from "@/lib/dexie";
import type { AIProduct, AISale, AIEmployee, AIRevenuePoint, AIAllData } from "@/lib/ai/rules-engine";

// ==========================================
// SYNC : Backend → IndexedDB
// ==========================================

/**
 * Synchronise les données historiques du backend vers IndexedDB.
 * Appelé périodiquement par le scheduler IA.
 *
 * 1. Récupère les ventes, produits, revenus du backend
 * 2. Les transforme en entrées historiques
 * 3. Les stocke dans les tables Dexie.js
 * 4. Supprime les entrées trop anciennes (> 90 jours)
 */
export async function syncHistoricalData(businessId: string = "demo"): Promise<void> {
  // Pas de businessId valide → rien à synchroniser (pas de données démo).
  if (!businessId || businessId === "demo") {
    return;
  }
  try {
    // 1. Récupérer les données du backend (filtrées par businessId)
    const qs = `businessId=${encodeURIComponent(businessId)}`;
    const [productsRes, ordersRes] = await Promise.all([
      fetch(`/api/ecom-products?${qs}`),
      fetch(`/api/ecom-orders?${qs}`),
    ]);

    if (!productsRes.ok || !ordersRes.ok) {
      console.warn("[IA] Backend indisponible — utilisation des données locales");
      return;
    }

    const productsData = await productsRes.json();
    const ordersData = await ordersRes.json();

    const products = productsData.products || [];
    const orders = ordersData.orders || [];

    // 2. Transformer et stocker les ventes
    const today = new Date().toISOString().split("T")[0];

    const salesEntries: SalesHistoryEntry[] = orders.flatMap((order: any) =>
      (order.items || order.orderItems || []).map((item: any) => ({
        id: `sh-${item.id || Math.random().toString(36).slice(2)}`,
        productId: item.productId,
        productName: item.productName || item.product?.name || "",
        quantity: item.quantity,
        totalAmount: item.totalPrice || item.quantity * item.unitPrice,
        date: new Date(order.createdAt).toISOString().split("T")[0],
        employeeId: order.createdBy,
        employeeName: undefined,
        paymentMethod: order.paymentMethod,
        isCancelled: order.isCancelled || false,
        syncedAt: new Date(),
      }))
    );

    // 3. Stocker les snapshots de stock
    const stockEntries: StockHistoryEntry[] = products.map((p: any) => ({
      id: `stk-${p.id}-${today}`,
      productId: p.id,
      productName: p.name,
      quantity: p.quantity,
      reservedQuantity: p.reservedQuantity || 0,
      availableQuantity: (p.quantity || 0) - (p.reservedQuantity || 0),
      date: today,
      syncedAt: new Date(),
    }));

    // 4. Calculer les revenus journaliers
    const revenueByDate: Record<string, { revenue: number; orderCount: number }> = {};
    for (const order of orders) {
      if (order.isCancelled) continue;
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, orderCount: 0 };
      }
      revenueByDate[date].revenue += order.totalAmount || 0;
      revenueByDate[date].orderCount += 1;
    }

    const revenueEntries: RevenueHistoryEntry[] = Object.entries(revenueByDate).map(
      ([date, data]) => ({
        id: `rev-${date}`,
        date,
        revenue: data.revenue,
        orderCount: data.orderCount,
        syncedAt: new Date(),
      })
    );

    // 5. Stocker dans IndexedDB (bulkPut = upsert)
    await Promise.all([
      localDB.salesHistory.bulkPut(salesEntries),
      localDB.stockHistory.bulkPut(stockEntries),
      localDB.revenueHistory.bulkPut(revenueEntries),
    ]);

    // 6. Nettoyer les données > 90 jours
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];
    await Promise.all([
      localDB.salesHistory.where("date").below(ninetyDaysAgo).delete(),
      localDB.stockHistory.where("date").below(ninetyDaysAgo).delete(),
      localDB.revenueHistory.where("date").below(ninetyDaysAgo).delete(),
    ]);

    console.log(`[IA] Sync terminé : ${salesEntries.length} ventes, ${stockEntries.length} stocks, ${revenueEntries.length} revenus`);
  } catch (error) {
    console.warn("[IA] Erreur sync historique — mode offline:", error);
  }
}

// ==========================================
// LECTURE : IndexedDB → Données pour l'IA
// ==========================================

/**
 * Récupère TOUTES les données locales nécessaires pour l'analyse IA.
 * C'est la fonction principale appelée par le moteur de règles.
 *
 * ⚠️ 100% OFFLINE — lit uniquement depuis IndexedDB.
 */
export async function getLocalDataForAI(): Promise<AIAllData> {
  // Produits depuis le cache local
  const localProducts = await localDB.products.toArray();
  const products: AIProduct[] = localProducts.map((p) => ({
    id: p.id,
    name: p.name,
    quantity: p.quantity,
    reservedQuantity: p.reservedQuantity || 0,
    salePrice: p.salePrice,
    purchasePrice: p.purchasePrice,
    minStockAlert: 5, // défaut
  }));

  // Ventes depuis l'historique
  const localSales = await localDB.salesHistory.toArray();
  const sales: AISale[] = localSales.map((s) => ({
    id: s.id,
    productId: s.productId,
    productName: s.productName,
    quantity: s.quantity,
    totalAmount: s.totalAmount,
    date: s.date,
    employeeId: s.employeeId,
    employeeName: s.employeeName,
    paymentMethod: s.paymentMethod,
    isCancelled: s.isCancelled,
  }));

  // Employés (agrégation depuis les ventes)
  const employees = aggregateEmployees(localSales);

  // Revenus journaliers
  const localRevenue = await localDB.revenueHistory.toArray();
  const revenueHistory: AIRevenuePoint[] = localRevenue
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      date: r.date,
      revenue: r.revenue,
      orderCount: r.orderCount,
    }));

  // Moyens de paiement (agrégation)
  const paymentBreakdown = aggregatePaymentMethods(localSales);

  return { products, sales, employees, revenueHistory, paymentBreakdown };
}

// ==========================================
// AGRÉGATION
// ==========================================

/** Agrège les ventes par employé pour l'analyse de performance */
function aggregateEmployees(sales: SalesHistoryEntry[]): AIEmployee[] {
  const byEmployee: Record<string, {
    name: string;
    salesCount: number;
    cancellationCount: number;
    totalRevenue: number;
  }> = {};

  for (const sale of sales) {
    const empId = sale.employeeId || "unknown";
    const empName = sale.employeeName || "Inconnu";

    if (!byEmployee[empId]) {
      byEmployee[empId] = { name: empName, salesCount: 0, cancellationCount: 0, totalRevenue: 0 };
    }

    byEmployee[empId].salesCount += 1;
    if (sale.isCancelled) {
      byEmployee[empId].cancellationCount += 1;
    } else {
      byEmployee[empId].totalRevenue += sale.totalAmount;
    }
  }

  return Object.entries(byEmployee).map(([id, data]) => ({
    id,
    name: data.name,
    role: "vendeur",
    salesCount: data.salesCount,
    cancellationCount: data.cancellationCount,
    totalRevenue: data.totalRevenue,
    cashVarianceCount: 0, // sera enrichi par l'API si dispo
  }));
}

/** Agrège les montants par méthode de paiement */
function aggregatePaymentMethods(sales: SalesHistoryEntry[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const sale of sales) {
    if (sale.isCancelled) continue;
    const method = sale.paymentMethod || "cash";
    breakdown[method] = (breakdown[method] || 0) + sale.totalAmount;
  }
  return breakdown;
}

// ==========================================
// DONNÉES MOCK — FOR TESTS/SEED ONLY — NOT FOR PRODUCTION UI
// ==========================================
//
// ⚠️ La fonction ci-dessous n'est plus importée nulle part dans l'app.
// Elle ne sert qu'aux scripts de seed / tests automatisés.
// Ne JAMAIS l'utiliser comme fallback dans une route API ou un composant UI.
// Tout nouveau compte doit afficher un état vide, PAS ces données factices.

/**
 * Génère des données mock réalistes pour les tests / seeds.
 * ⚠️ FOR TESTS/SEED ONLY — NOT FOR PRODUCTION UI.
 */
export function getMockDataForAI(): AIAllData {
  const now = new Date();
  const products: AIProduct[] = [
    { id: "p1", name: "Thiébou Rouge", quantity: 45, reservedQuantity: 0, salePrice: 2500, purchasePrice: 1200, minStockAlert: 10, category: "Plats" },
    { id: "p2", name: "Riz 25kg", quantity: 8, reservedQuantity: 2, salePrice: 7500, purchasePrice: 5500, minStockAlert: 5, category: "Épicerie" },
    { id: "p3", name: "Huile 5L", quantity: 15, reservedQuantity: 0, salePrice: 4500, purchasePrice: 3200, minStockAlert: 8, category: "Épicerie" },
    { id: "p4", name: "Sucre 1kg", quantity: 3, reservedQuantity: 0, salePrice: 600, purchasePrice: 400, minStockAlert: 10, category: "Épicerie" },
    { id: "p5", name: "Savon 500g", quantity: 0, reservedQuantity: 0, salePrice: 500, purchasePrice: 300, minStockAlert: 15, category: "Hygiène" },
    { id: "p6", name: "Café Touba", quantity: 12, reservedQuantity: 0, salePrice: 500, purchasePrice: 250, minStockAlert: 10, category: "Boissons" },
    { id: "p7", name: "Lait concentré", quantity: 4, reservedQuantity: 0, salePrice: 500, purchasePrice: 300, minStockAlert: 8, category: "Épicerie" },
    { id: "p8", name: "Attiéké 1kg", quantity: 20, reservedQuantity: 0, salePrice: 1000, purchasePrice: 600, minStockAlert: 5, category: "Plats" },
  ];

  // Générer 30 jours de ventes
  const sales: AISale[] = [];
  const revenueHistory: AIRevenuePoint[] = [];

  for (let day = 29; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().split("T")[0];

    // Entre 5 et 15 ventes par jour (variabilité)
    const dailyOrders = Math.floor(Math.random() * 10 + 5);
    let dailyRevenue = 0;

    for (let i = 0; i < dailyOrders; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3 + 1);
      const amount = qty * product.salePrice;
      const isCancelled = Math.random() < 0.05; // 5% taux d'annulation

      sales.push({
        id: `mock-sale-${day}-${i}`,
        productId: product.id,
        productName: product.name,
        quantity: qty,
        totalAmount: amount,
        date: dateStr,
        employeeId: i % 3 === 0 ? "emp-fatou" : "emp-mamadou",
        employeeName: i % 3 === 0 ? "Fatou Sow" : "Mamadou Diallo",
        paymentMethod: ["wave", "orange_money", "cash"][Math.floor(Math.random() * 3)],
        isCancelled,
      });

      if (!isCancelled) {
        dailyRevenue += amount;
      }
    }

    // Baisse anormale il y a 3-5 jours (pour tester la règle REVENUE_DROP)
    let adjustedRevenue = dailyRevenue;
    if (day >= 3 && day <= 5) {
      adjustedRevenue = Math.round(dailyRevenue * 0.4); // -60%
    }

    revenueHistory.push({
      date: dateStr,
      revenue: adjustedRevenue,
      orderCount: dailyOrders,
    });
  }

  // Employés
  const employees: AIEmployee[] = [
    {
      id: "emp-fatou",
      name: "Fatou Sow",
      role: "vendeur",
      salesCount: 85,
      cancellationCount: 2,
      totalRevenue: 425000,
      cashVarianceCount: 0,
    },
    {
      id: "emp-mamadou",
      name: "Mamadou Diallo",
      role: "gerant",
      salesCount: 60,
      cancellationCount: 15, // 25% — suspect !
      totalRevenue: 310000,
      cashVarianceCount: 3, // 3 écarts de caisse
    },
  ];

  // Moyens de paiement
  const paymentBreakdown = {
    wave: 320000,
    orange_money: 180000,
    cash: 235000,
  };

  return { products, sales, employees, revenueHistory, paymentBreakdown };
}

// ==========================================
// STATS RAPIDES (pour le dashboard)
// ==========================================

/** Compte les entrées dans chaque table historique */
export async function getHistoricalDataStats(): Promise<{
  salesCount: number;
  stockSnapshotsCount: number;
  revenueDaysCount: number;
}> {
  const [salesCount, stockSnapshotsCount, revenueDaysCount] = await Promise.all([
    localDB.salesHistory.count(),
    localDB.stockHistory.count(),
    localDB.revenueHistory.count(),
  ]);

  return { salesCount, stockSnapshotsCount, revenueDaysCount };
}
