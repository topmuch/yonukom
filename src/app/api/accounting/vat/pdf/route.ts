// ============================================================
// YonuKom — API VAT PDF (printable HTML)
// GET /api/accounting/vat/pdf?businessId=xxx&period=YYYY-MM
//
// Retourne une page HTML imprimable (Ctrl+P → Save as PDF)
// résumant la déclaration mensuelle de TVA au format Sénégalais.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VAT_RATE_SN = 0.18;

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

function parsePeriod(period: string | null): { year: number; month: number } {
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  const [y, m] = period.split("-").map(Number);
  return { year: y, month: m };
}

function monthLabel(year: number, month: number): string {
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${months[month - 1]} ${year}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const periodParam = searchParams.get("period");

    if (!businessId) {
      return new NextResponse("Paramètre businessId requis", { status: 400 });
    }

    const { year, month } = parsePeriod(periodParam);
    const periodStr = `${year}-${String(month).padStart(2, "0")}`;

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, phone: true, address: true, city: true },
    });
    if (!business) {
      return new NextResponse("Commerce introuvable", { status: 404 });
    }

    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);

    const [salesAgg, purchasesAgg] = await Promise.all([
      db.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: {
          businessId,
          isCancelled: false,
          createdAt: { gte: start, lt: end },
        },
      }),
      db.purchase.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: {
          businessId,
          status: { in: ["received", "paid" ] },
          receivedDate: { gte: start, lt: end },
        },
      }),
    ]);

    const salesTotal = salesAgg._sum.totalAmount || 0;
    const purchasesTotal = purchasesAgg._sum.totalAmount || 0;
    const vatCollected = Math.round(salesTotal * VAT_RATE_SN);
    const vatDeductible = Math.round(purchasesTotal * VAT_RATE_SN);
    const vatToPay = vatCollected - vatDeductible;
    const isCredit = vatToPay < 0;

    const dueDate = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}-20`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Déclaration TVA — ${escapeHtml(business.name)} — ${monthLabel(year, month)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #1a1a1a; background: #ffffff; font-size: 13px; line-height: 1.5; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px 28px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 3px solid #0f766e; padding-bottom: 18px; margin-bottom: 28px; }
    .business-name { font-size: 18px; font-weight: 700; margin: 0 0 4px 0; }
    .business-meta { font-size: 12px; color: #475569; margin: 1px 0; }
    .title-block { text-align: right; }
    .title { font-size: 24px; font-weight: 800; color: #0f766e; margin: 0 0 6px 0; }
    .period { font-size: 14px; color: #1e293b; font-weight: 600; margin: 0 0 4px 0; }
    .print-bar { position: sticky; top: 0; background: #0f766e; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; z-index: 100; }
    .print-bar button { background: #fff; color: #0f766e; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px; }
    .print-bar a { color: #fff; text-decoration: underline; font-size: 12px; }
    table.decl { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    table.decl th { background: #0f766e; color: #fff; text-align: left; padding: 10px 14px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    table.decl td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    table.decl tr:nth-child(even) td { background: #f8fafc; }
    td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .total-row { background: #fef3c7 !important; font-weight: 700; }
    .total-row td { border-top: 2px solid #0f172a; }
    .alert { padding: 12px 14px; border-radius: 6px; font-size: 12px; margin-bottom: 24px; }
    .alert.due { background: #fffbeb; border: 1px solid #fde68a; color: #78350f; }
    .alert.credit { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
    .alert strong { display: block; margin-bottom: 4px; font-size: 13px; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
    .footer strong { color: #475569; }
    @media print { .print-bar { display: none; } .page { padding: 0; max-width: 100%; } @page { size: A4 portrait; margin: 14mm; } }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Déclaration TVA — <strong>${escapeHtml(business.name)}</strong> — ${escapeHtml(monthLabel(year, month))}</span>
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
        <h2 class="title">DÉCLARATION TVA</h2>
        <p class="period">Période : ${escapeHtml(monthLabel(year, month))}</p>
        <p class="period" style="font-weight:400; color:#64748b; font-size:12px;">Taux appliqué : 18% (standard Sénégal)</p>
      </div>
    </div>

    <table class="decl">
      <thead>
        <tr>
          <th>Désignation</th>
          <th class="num" style="text-align:right;">Assiette HT</th>
          <th class="num" style="text-align:right;">TVA</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Opérations imposables (ventes)</strong><br/><span style="font-size:11px; color:#64748b;">${salesAgg._count} commande(s)</span></td>
          <td class="num">${formatFCFA(salesTotal)}</td>
          <td class="num">${formatFCFA(vatCollected)}</td>
        </tr>
        <tr>
          <td><strong>Achats et services</strong><br/><span style="font-size:11px; color:#64748b;">${purchasesAgg._count} achat(s) reçu(s)</span></td>
          <td class="num">${formatFCFA(purchasesTotal)}</td>
          <td class="num">${formatFCFA(vatDeductible)}</td>
        </tr>
        <tr class="total-row">
          <td><strong>${isCredit ? "Crédit de TVA reportable" : "TVA à verser"}</strong></td>
          <td class="num">—</td>
          <td class="num" style="color: ${isCredit ? "#1e40af" : "#dc2626"};">${formatFCFA(Math.abs(vatToPay))}</td>
        </tr>
      </tbody>
    </table>

    ${
      isCredit
        ? `<div class="alert credit"><strong>Crédit de TVA reportable</strong>Vous disposez d'un crédit de TVA de <strong>${formatFCFA(Math.abs(vatToPay))}</strong> reportable sur le mois suivant. Ce montant viendra déduire votre prochaine déclaration.</div>`
        : `<div class="alert due"><strong>TVA à verser avant le ${escapeHtml(formatDate(new Date(dueDate)))}</strong>Vous devez verser <strong>${formatFCFA(vatToPay)}</strong> à l'administration fiscale sénégalaise avant le 20 du mois suivant la période. Référez-vous au service des impôts (Direction Générale des Impôts et des Domaines — DGID).</div>`
    }

    <div class="footer">
      <p><strong>${escapeHtml(business.name)}</strong> — Document généré par YonuKom</p>
      <p>Conforme au régime du réel — Code Général des Impôts du Sénégal</p>
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
    console.error("[Accounting/VAT/PDF] error:", error);
    return new NextResponse("Erreur lors de la génération du PDF TVA", {
      status: 500,
    });
  }
}
