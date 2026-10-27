// ============================================================
// YonuKom — API Invoice PDF (printable HTML)
// GET /api/invoices/:id/pdf — retourne une page HTML imprimable
// Imprimable via Ctrl+P → Save as PDF (évite toute dépendance PDF)
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

interface InvoiceItem {
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

// GET /api/invoices/:id/pdf
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        business: true,
        customer: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Facture introuvable", { status: 404 });
    }

    // Parser les items
    let items: InvoiceItem[] = [];
    try {
      items = JSON.parse(invoice.itemsJson || "[]") as InvoiceItem[];
    } catch {
      items = [];
    }

    const business = invoice.business;
    const customer = invoice.customer;

    // Calcul du reste à payer
    const remaining = invoice.totalAmount - invoice.paidAmount;

    // Statut label FR
    const statusLabels: Record<string, string> = {
      draft: "Brouillon",
      sent: "Envoyée",
      paid: "Payée",
      partial: "Partielle",
      cancelled: "Annulée",
    };
    const statusLabel = statusLabels[invoice.status] || invoice.status;

    // Construire les lignes d'items HTML
    const itemsRows = items.length
      ? items
          .map(
            (item, i) => `
            <tr>
              <td class="num">${i + 1}</td>
              <td>${escapeHtml(item.name || item.description || "Article")}</td>
              <td class="num">${item.quantity ?? 1}</td>
              <td class="num">${formatFCFA(Number(item.unitPrice ?? 0))}</td>
              <td class="num strong">${formatFCFA(Number(item.totalPrice ?? 0))}</td>
            </tr>`
          )
          .join("")
      : `
            <tr>
              <td colspan="5" class="empty">Aucun article détaillé</td>
            </tr>`;

    // Logo HTML si logoUrl
    const logoHtml = business.logoUrl
      ? `<img src="${escapeHtml(business.logoUrl)}" alt="logo" class="logo" />`
      : `<div class="logo-placeholder">${escapeHtml(
          business.name.charAt(0).toUpperCase()
        )}</div>`;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Facture ${escapeHtml(invoice.number)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a1a1a;
      background: #ffffff;
      font-size: 13px;
      line-height: 1.5;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 28px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      border-bottom: 3px solid #0f766e;
      padding-bottom: 18px;
      margin-bottom: 28px;
    }
    .business-block {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      flex: 1;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .logo-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      background: #0f766e;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .business-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .business-meta {
      font-size: 12px;
      color: #475569;
      margin: 1px 0;
    }
    .invoice-block {
      text-align: right;
      flex-shrink: 0;
    }
    .invoice-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f766e;
      margin: 0 0 6px 0;
      letter-spacing: 0.5px;
    }
    .invoice-number {
      font-size: 14px;
      color: #1e293b;
      font-weight: 600;
      margin: 0 0 4px 0;
    }
    .invoice-dates {
      font-size: 12px;
      color: #64748b;
      margin: 1px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 8px;
      background: ${invoice.status === "paid" ? "#dcfce7" : invoice.status === "partial" ? "#fef3c7" : invoice.status === "cancelled" ? "#fee2e2" : "#e2e8f0"};
      color: ${invoice.status === "paid" ? "#166534" : invoice.status === "partial" ? "#92400e" : invoice.status === "cancelled" ? "#991b1b" : "#334155"};
    }
    .parties {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
    }
    .party {
      flex: 1;
      padding: 12px 14px;
      background: #f8fafc;
      border-left: 3px solid #0f766e;
      border-radius: 4px;
    }
    .party-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 0 0 4px 0;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 2px 0;
    }
    .party-meta {
      font-size: 12px;
      color: #475569;
      margin: 1px 0;
    }
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 12px;
    }
    table.items th {
      background: #0f766e;
      color: #ffffff;
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.items td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    table.items tr:nth-child(even) td {
      background: #f8fafc;
    }
    td.num, th.num { text-align: right; }
    td.strong { font-weight: 700; }
    td.empty { text-align: center; color: #94a3b8; padding: 24px; }
    .totals {
      margin-left: auto;
      width: 320px;
      margin-bottom: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 7px 0;
      font-size: 13px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .totals-row:last-child {
      border-bottom: none;
      border-top: 2px solid #0f172a;
      padding-top: 11px;
      margin-top: 6px;
      font-size: 15px;
      font-weight: 800;
      color: #0f766e;
    }
    .totals-row.paid { color: #16a34a; }
    .totals-row.remaining { color: ${remaining > 0 ? "#dc2626" : "#16a34a"}; font-weight: 700; }
    .notes {
      margin-top: 24px;
      padding: 12px 14px;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      font-size: 12px;
      color: #78350f;
    }
    .notes-label {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      display: block;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .footer strong { color: #475569; }
    .print-bar {
      position: sticky;
      top: 0;
      background: #0f766e;
      color: #ffffff;
      padding: 10px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      z-index: 100;
    }
    .print-bar button {
      background: #ffffff;
      color: #0f766e;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 13px;
    }
    .print-bar button:hover { background: #f0fdfa; }
    .print-bar a {
      color: #ffffff;
      text-decoration: underline;
      font-size: 12px;
    }
    @media print {
      .print-bar { display: none; }
      .page { padding: 0; max-width: 100%; }
      body { font-size: 12px; }
      @page { size: A4 portrait; margin: 14mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Facture <strong>${escapeHtml(invoice.number)}</strong> — ${escapeHtml(business.name)}</span>
    <div style="display: flex; gap: 14px; align-items: center;">
      <a href="/">← Retour</a>
      <button onclick="window.print()">🖨️ Imprimer / PDF</button>
    </div>
  </div>

  <div class="page">
    <div class="header">
      <div class="business-block">
        ${logoHtml}
        <div>
          <h1 class="business-name">${escapeHtml(business.name)}</h1>
          ${business.address ? `<p class="business-meta">${escapeHtml(business.address)}</p>` : ""}
          ${business.city ? `<p class="business-meta">${escapeHtml(business.city)}${business.country ? ", " + escapeHtml(business.country) : ""}</p>` : ""}
          ${business.phone ? `<p class="business-meta">Tél: ${escapeHtml(business.phone)}</p>` : ""}
          ${business.email ? `<p class="business-meta">Email: ${escapeHtml(business.email)}</p>` : ""}
        </div>
      </div>
      <div class="invoice-block">
        <h2 class="invoice-title">FACTURE</h2>
        <p class="invoice-number">${escapeHtml(invoice.number)}</p>
        <p class="invoice-dates">Émise le: ${formatDate(invoice.issueDate)}</p>
        ${invoice.dueDate ? `<p class="invoice-dates">Échéance: ${formatDate(invoice.dueDate)}</p>` : ""}
        <span class="status-badge">${escapeHtml(statusLabel)}</span>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <p class="party-label">Facturé à</p>
        ${customer ? `
          <p class="party-name">${escapeHtml(customer.name)}</p>
          ${customer.phone ? `<p class="party-meta">Tél: ${escapeHtml(customer.phone)}</p>` : ""}
          ${customer.email ? `<p class="party-meta">Email: ${escapeHtml(customer.email)}</p>` : ""}
          ${customer.address ? `<p class="party-meta">${escapeHtml(customer.address)}</p>` : ""}
        ` : `<p class="party-meta">Client comptoir</p>`}
      </div>
      ${invoice.orderId ? `
      <div class="party">
        <p class="party-label">Commande liée</p>
        <p class="party-name">Vente #${escapeHtml(invoice.orderId.slice(-6).toUpperCase())}</p>
      </div>
      ` : ""}
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="num" style="width: 40px;">#</th>
          <th>Désignation</th>
          <th class="num" style="width: 70px;">Qté</th>
          <th class="num" style="width: 130px;">P.U.</th>
          <th class="num" style="width: 140px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-row">
        <span>Sous-total HT</span>
        <span>${formatFCFA(invoice.subtotal)}</span>
      </div>
      <div class="totals-row">
        <span>TVA (${invoice.taxRate}%)</span>
        <span>${formatFCFA(invoice.taxAmount)}</span>
      </div>
      <div class="totals-row">
        <span>Total TTC</span>
        <span>${formatFCFA(invoice.totalAmount)}</span>
      </div>
      ${invoice.paidAmount > 0 ? `
        <div class="totals-row paid">
          <span> déjà payé</span>
          <span>- ${formatFCFA(invoice.paidAmount)}</span>
        </div>
        <div class="totals-row remaining">
          <span>Reste à payer</span>
          <span>${formatFCFA(remaining)}</span>
        </div>
      ` : ""}
    </div>

    ${invoice.notes ? `
      <div class="notes">
        <span class="notes-label">Notes / Conditions</span>
        ${escapeHtml(invoice.notes).replace(/\n/g, "<br />")}
      </div>
    ` : ""}

    <div class="footer">
      <p><strong>${escapeHtml(business.name)}</strong>${business.phone ? ` — Tél: ${escapeHtml(business.phone)}` : ""}${business.email ? ` — ${escapeHtml(business.email)}` : ""}</p>
      <p>Merci pour votre confiance — Document généré par YonuKom</p>
    </div>
  </div>

  <script>
    // Déclenche l'impression après chargement complet
    window.addEventListener('load', function() {
      // Petit délai pour laisser les polices se charger
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
    console.error("[Invoices/:id/pdf] error:", error);
    return new NextResponse("Erreur lors de la génération du PDF", { status: 500 });
  }
}
