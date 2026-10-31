// ============================================================
// YonuKom — API Bilan PDF (printable HTML)
// GET /api/accounting/balance-sheet/pdf?businessId=xxx&asOf=YYYY-MM-DD
//
// Retourne une page HTML imprimable (Ctrl+P → Save as PDF)
// présentant le bilan simplifié à une date donnée.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatFCFA(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatted} FCFA`;
}

function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function parseAsOf(asOf: string | null): Date {
  if (!asOf || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  }
  const [y, m, d] = asOf.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

interface BalanceRow {
  label: string;
  amount: number;
  detail?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const asOfParam = searchParams.get("asOf");

    if (!businessId) {
      return new NextResponse("Paramètre businessId requis", { status: 400 });
    }

    const asOf = parseAsOf(asOfParam);
    const asOfStr = asOf.toISOString().split("T")[0];

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, phone: true, address: true, city: true },
    });
    if (!business) {
      return new NextResponse("Commerce introuvable", { status: 404 });
    }

    // --- Assets ---
    const cashPayments = await db.payment.aggregate({
      _sum: { amount: true },
      where: {
        method: "cash",
        createdAt: { lte: asOf },
        order: { businessId, isCancelled: false },
      },
    });
    const cashOnHand = cashPayments._sum.amount || 0;

    const products = await db.product.findMany({
      where: { businessId, isActive: true },
      select: { quantity: true, purchasePrice: true, productType: true },
    });
    let inventoryValue = 0;
    let inventoryUnits = 0;
    for (const p of products) {
      if (p.productType === "service" || p.productType === "plate_restaurant") continue;
      if (p.quantity > 0 && p.purchasePrice > 0) {
        inventoryValue += p.quantity * p.purchasePrice;
        inventoryUnits += p.quantity;
      }
    }

    const openOrders = await db.order.findMany({
      where: {
        businessId,
        isCancelled: false,
        createdAt: { lte: asOf },
      },
      select: { totalAmount: true, paidAmount: true },
    });
    const receivables = openOrders.reduce(
      (s, o) => s + Math.max(0, o.totalAmount - o.paidAmount),
      0
    );
    const totalAssets = cashOnHand + inventoryValue + receivables;

    // --- Liabilities ---
    const suppliers = await db.supplier.aggregate({
      _sum: { outstandingBalance: true },
      where: { businessId, isActive: true },
    });
    const payables = suppliers._sum.outstandingBalance || 0;

    const deposits = await db.payment.aggregate({
      _sum: { amount: true },
      where: {
        isDeposit: true,
        createdAt: { lte: asOf },
        order: { businessId, isCancelled: false },
      },
    });
    const customerAdvances = deposits._sum.amount || 0;
    const totalLiabilities = payables + customerAdvances;

    // --- Equity ---
    const equity = totalAssets - totalLiabilities;

    const assetRows: BalanceRow[] = [
      { label: "Caisse (espèces)", amount: cashOnHand, detail: "Total paiements en espèces" },
      { label: "Stocks", amount: inventoryValue, detail: `${inventoryUnits} unités valorisées au prix d'achat` },
      { label: "Créances clients", amount: receivables, detail: `${openOrders.length} commandes non soldées` },
    ];
    const liabilityRows: BalanceRow[] = [
      { label: "Dettes fournisseurs", amount: payables, detail: "Soldes dûs aux fournisseurs" },
      { label: "Acomptes clients", amount: customerAdvances, detail: "Acomptes B2B reçus" },
    ];

    const renderRow = (row: BalanceRow, isTotal = false) => `
      <tr class="${isTotal ? "total-row" : ""}">
        <td>
          <strong>${escapeHtml(row.label)}</strong>
          ${row.detail ? `<br/><span style="font-size:11px; color:#64748b;">${escapeHtml(row.detail)}</span>` : ""}
        </td>
        <td class="num">${formatFCFA(row.amount)}</td>
      </tr>`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bilan — ${escapeHtml(business.name)} — ${escapeHtml(asOfStr)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; background: #ffffff; font-size: 13px; line-height: 1.5; }
    .page { max-width: 900px; margin: 0 auto; padding: 32px 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 3px solid #0f766e; padding-bottom: 18px; margin-bottom: 28px; }
    .business-name { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
    .business-meta { font-size: 12px; color: #475569; margin: 1px 0; }
    .title-block { text-align: right; }
    .title { font-size: 24px; font-weight: 800; color: #0f766e; margin: 0 0 6px 0; }
    .period { font-size: 14px; color: #1e293b; font-weight: 600; margin: 0 0 4px 0; }
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .col-card { background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
    .col-card.assets { border-top: 4px solid #16a34a; }
    .col-card.liabilities { border-top: 4px solid #dc2626; }
    .col-header { padding: 12px 16px; font-weight: 700; font-size: 14px; background: #fff; border-bottom: 1px solid #e2e8f0; }
    .col-header.assets { color: #16a34a; }
    .col-header.liabilities { color: #dc2626; }
    table.bs { width: 100%; border-collapse: collapse; font-size: 13px; }
    table.bs td { padding: 10px 16px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    table.bs tr:nth-child(even) td { background: #fff; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row { background: #fef3c7 !important; font-weight: 700; }
    .total-row td { border-top: 2px solid #0f172a; }
    .equity-banner { padding: 16px 20px; border-radius: 8px; background: linear-gradient(135deg, #0f766e, #14b8a6); color: #fff; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .equity-banner .label { font-size: 14px; font-weight: 600; }
    .equity-banner .value { font-size: 24px; font-weight: 800; }
    .print-bar { position: sticky; top: 0; background: #0f766e; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; z-index: 100; }
    .print-bar button { background: #fff; color: #0f766e; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .print-bar a { color: #fff; text-decoration: underline; font-size: 12px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer strong { color: #475569; }
    @media print { .print-bar { display: none; } .page { padding: 0; max-width: 100%; } @page { size: A4 portrait; margin: 14mm; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Bilan simplifié — <strong>${escapeHtml(business.name)}</strong> — au ${escapeHtml(formatDate(asOf))}</span>
    <div style="display:flex; gap:14px; align-items:center;">
      <a href="/">← Retour</a>
      <button onclick="window.print()">🖨️ Imprimer / PDF</button>
    </div>
  </div>
  <div class="page">
    <div class="header">
      <div>
        <h1 class="business-name">${escapeHtml(business.name)}</h1>
        ${business.address ? `<p class="business-meta">${escapeHtml(business.address)}</p>` : ""}
        ${business.city ? `<p class="business-meta">${escapeHtml(business.city)}</p>` : ""}
        ${business.phone ? `<p class="business-meta">Tél: ${escapeHtml(business.phone)}</p>` : ""}
      </div>
      <div class="title-block">
        <h2 class="title">BILAN SIMPLIFIÉ</h2>
        <p class="period">Arrêté au ${escapeHtml(formatDate(asOf))}</p>
        <p class="period" style="font-weight:400; color:#64748b; font-size:12px;">Vue synthétique du patrimoine</p>
      </div>
    </div>

    <div class="equity-banner">
      <div>
        <div class="label">Capitaux propres (Actifs − Passifs)</div>
        <div style="font-size:11px; opacity:0.9;">Indicateur de santé financière du commerce</div>
      </div>
      <div class="value">${formatFCFA(equity)}</div>
    </div>

    <div class="columns">
      <div class="col-card assets">
        <div class="col-header assets">ACTIFS</div>
        <table class="bs">
          <tbody>
            ${assetRows.map((r) => renderRow(r)).join("")}
            <tr class="total-row">
              <td><strong>Total actifs</strong></td>
              <td class="num">${formatFCFA(totalAssets)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col-card liabilities">
        <div class="col-header liabilities">PASSIFS</div>
        <table class="bs">
          <tbody>
            ${liabilityRows.map((r) => renderRow(r)).join("")}
            <tr class="total-row">
              <td><strong>Total passifs</strong></td>
              <td class="num">${formatFCFA(totalLiabilities)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="footer">
      <p><strong>${escapeHtml(business.name)}</strong> — Bilan simplifié généré par YonuKom</p>
      <p>Document indicatif — ne remplace pas un bilan certifié par un expert-comptable agréé.</p>
    </div>
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try { window.print(); } catch (e) { /* ignore */ }
      }, 400);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Accounting/BalanceSheet/PDF] error:", error);
    return new NextResponse("Erreur lors de la génération du PDF bilan", {
      status: 500,
    });
  }
}
