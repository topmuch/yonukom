// ============================================================
// YonuKom — API Bilan simplifié (Balance Sheet)
// GET /api/accounting/balance-sheet?businessId=xxx&asOf=YYYY-MM-DD
//
// Retourne un bilan simplifié à une date donnée :
//   - Actifs (assets) :
//       • cashOnHand (somme des paiements en espèces)
//       • inventoryValue (somme product.quantity × product.purchasePrice)
//       • receivables (somme des soldes restant à encaisser sur commandes non annulées)
//   - Passifs (liabilities) :
//       • payables (soldes dûs aux fournisseurs = suppliers.outstandingBalance)
//       • customerAdvances (acomptes B2B reçus = payments.isDeposit=true)
//   - Capitaux propres (equity) = Total Actifs - Total Passifs
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface BalanceSheetResponse {
  asOf: string; // YYYY-MM-DD
  assets: {
    cashOnHand: number;
    inventoryValue: number;
    receivables: number;
    total: number;
  };
  liabilities: {
    payables: number;
    customerAdvances: number;
    total: number;
  };
  equity: number;
}

function parseAsOf(asOf: string | null): Date {
  if (!asOf || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    // Fin de journée aujourd'hui
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }
  // YYYY-MM-DD → fin de journée
  const [y, m, d] = asOf.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const asOfParam = searchParams.get("asOf");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const asOf = parseAsOf(asOfParam);

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- 1. Actifs ---
    // Cash on hand = somme des paiements en espèces reçus jusqu'à la date
    const cashPayments = await db.payment.aggregate({
      _sum: { amount: true },
      where: {
        method: "cash",
        createdAt: { lte: asOf },
        order: {
          businessId,
          isCancelled: false,
        },
      },
    });
    const cashOnHand = cashPayments._sum.amount || 0;

    // Inventory value = sum(product.quantity × product.purchasePrice)
    const products = await db.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      select: {
        quantity: true,
        purchasePrice: true,
        productType: true,
      },
    });
    let inventoryValue = 0;
    for (const p of products) {
      // Pour les services / plats restaurant, on ne valorise pas le stock
      if (p.productType === "service" || p.productType === "plate_restaurant") {
        continue;
      }
      if (p.quantity > 0 && p.purchasePrice > 0) {
        inventoryValue += p.quantity * p.purchasePrice;
      }
    }

    // Receivables = somme des (totalAmount - paidAmount) pour commandes non annulées
    // créées jusqu'à la date et non intégralement payées
    const openOrders = await db.order.findMany({
      where: {
        businessId,
        isCancelled: false,
        createdAt: { lte: asOf },
        // On ne garde que les commandes avec reste à payer > 0
        // (Prisma ne supporte pas column-to-column comparison en SQLite — on filtre en JS)
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    });
    const receivables = openOrders.reduce(
      (s, o) => s + Math.max(0, o.totalAmount - o.paidAmount),
      0
    );

    const totalAssets = cashOnHand + inventoryValue + receivables;

    // --- 2. Passifs ---
    // Payables = somme des soldes dûs aux fournisseurs
    const suppliers = await db.supplier.aggregate({
      _sum: { outstandingBalance: true },
      where: {
        businessId,
        isActive: true,
      },
    });
    const payables = suppliers._sum.outstandingBalance || 0;

    // Customer advances = acomptes reçus (Payment.isDeposit=true) jusqu'à la date
    const deposits = await db.payment.aggregate({
      _sum: { amount: true },
      where: {
        isDeposit: true,
        createdAt: { lte: asOf },
        order: {
          businessId,
          isCancelled: false,
        },
      },
    });
    const customerAdvances = deposits._sum.amount || 0;

    const totalLiabilities = payables + customerAdvances;

    // --- 3. Capitaux propres ---
    const equity = totalAssets - totalLiabilities;

    const response: BalanceSheetResponse = {
      asOf: asOf.toISOString().split("T")[0],
      assets: {
        cashOnHand,
        inventoryValue,
        receivables,
        total: totalAssets,
      },
      liabilities: {
        payables,
        customerAdvances,
        total: totalLiabilities,
      },
      equity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Accounting/BalanceSheet] error:", error);
    return NextResponse.json(
      { error: "Échec du calcul du bilan" },
      { status: 500 }
    );
  }
}
