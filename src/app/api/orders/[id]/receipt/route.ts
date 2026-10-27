// ============================================================
// YonuKom — Receipt (Ticket de caisse)
// GET /api/orders/:id/receipt
// Renvoie une page HTML imprimable (format ticket 80mm) avec
// auto-print au chargement. Aucune librairie PDF — impression navigateur.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Étiquettes lisibles des moyens de paiement
const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  cb: 'Carte bancaire',
  cheque: 'Chèque',
  virement: 'Virement',
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatFCFA(n: number | null | undefined): string {
  const v = typeof n === 'number' && !isNaN(n) ? n : 0
  return v.toLocaleString('fr-FR') + ' FCFA'
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// GET /api/orders/:id/receipt — HTML printable
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Charger la commande + relations nécessaires
    const order = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true },
            },
          },
        },
        payments: true,
        customer: true,
      },
    })

    if (!order) {
      return new NextResponse(
        '<!doctype html><html lang="fr"><body style="font-family: monospace; padding: 16px;"><h1>Commande introuvable</h1><p>Aucune commande trouvée pour cet identifiant.</p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Charger le business et le caissier en parallèle
    const [business, cashier] = await Promise.all([
      db.business.findUnique({
        where: { id: order.businessId },
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          logoUrl: true,
          currency: true,
        },
      }),
      order.createdBy
        ? db.user.findUnique({
            where: { id: order.createdBy },
            select: { name: true },
          })
        : Promise.resolve(null),
    ])

    // Si customer est walk-in (phone "N/A"), on l'affiche comme "Client comptoir"
    const customerName = order.customer?.name ?? 'Client comptoir'
    const customerPhone =
      order.customer?.phone && order.customer.phone !== 'N/A'
        ? order.customer.phone
        : null

    // Premier paiement → méthode principale
    const mainPayment = order.payments[0]
    const paymentLabel = mainPayment
      ? (PAYMENT_LABELS[mainPayment.method] ?? mainPayment.method)
      : 'Non spécifié'

    // Construction des lignes d'articles
    const itemsRows = order.orderItems
      .map((item) => {
        const lineTotal = item.totalPrice
        return `
          <tr>
            <td colspan="3" class="item-name">${escapeHtml(item.product?.name ?? 'Article')}</td>
          </tr>
          <tr class="item-line">
            <td class="qty">x${item.quantity}</td>
            <td class="unit">${formatFCFA(item.unitPrice)}</td>
            <td class="line-total">${formatFCFA(lineTotal)}</td>
          </tr>
        `
      })
      .join('')

    // Truncated order id (8 chars) — pour lisibilité sur ticket
    const shortId = order.id.slice(-8).toUpperCase()

    // Logo HTML (data URL ou URL externe)
    const logoHtml = business?.logoUrl
      ? `<img src="${escapeHtml(business.logoUrl)}" alt="logo" style="max-width: 60mm; max-height: 30mm; object-fit: contain;" />`
      : ''

    // Adresse complète (avec ville)
    const addressParts = [
      business?.address,
      business?.city,
    ].filter(Boolean)
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null

    // Header HTML avec CSS d'impression (format 80mm)
    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Ticket ${escapeHtml(order.orderNumber || shortId)}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    font-family: "Courier New", "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.4;
  }
  .receipt {
    width: 80mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 6mm 4mm;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .muted { color: #555; }
  .small { font-size: 10px; }
  hr {
    border: none;
    border-top: 1px dashed #000;
    margin: 8px 0;
  }
  .header .logo-wrap {
    text-align: center;
    margin-bottom: 6px;
  }
  .header h1 {
    font-size: 14px;
    font-weight: 700;
    margin: 2px 0;
    letter-spacing: 0.5px;
  }
  .header .meta {
    font-size: 10px;
    color: #333;
    margin: 1px 0;
  }
  .section { margin: 6px 0; font-size: 11px; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 1px 0; }
  .item-name { font-weight: 600; padding-top: 4px; }
  .item-line td { padding: 0 0 2px 0; }
  .qty { width: 18%; }
  .unit { width: 42%; text-align: left; }
  .line-total { width: 40%; text-align: right; }
  .totals { margin-top: 4px; }
  .totals .row { display: flex; justify-content: space-between; padding: 1px 0; }
  .totals .row.total {
    font-weight: 700;
    font-size: 14px;
    border-top: 1px solid #000;
    padding-top: 4px;
    margin-top: 4px;
  }
  .footer { margin-top: 10px; text-align: center; font-size: 11px; }
  .footer .thanks { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
  @media print {
    @page { margin: 0; size: 80mm auto; }
    html, body { width: 80mm; }
    .no-print { display: none; }
  }
  .print-btn {
    display: block;
    margin: 8px auto 0;
    padding: 8px 16px;
    background: #10B981;
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
  }
</style>
</head>
<body>
  <div class="receipt">
    <!-- Header / Business -->
    <div class="header center">
      ${logoHtml ? `<div class="logo-wrap">${logoHtml}</div>` : ''}
      <h1>${escapeHtml(business?.name ?? 'YonuKom')}</h1>
      ${addressLine ? `<div class="meta">${escapeHtml(addressLine)}</div>` : ''}
      ${business?.phone ? `<div class="meta">Tél: ${escapeHtml(business.phone)}</div>` : ''}
      ${business?.email ? `<div class="meta">${escapeHtml(business.email)}</div>` : ''}
    </div>

    <hr />

    <!-- Date + N° commande + caissier -->
    <div class="section">
      <div class="row" style="display:flex;justify-content:space-between;">
        <span>${escapeHtml(formatDate(order.createdAt))}</span>
      </div>
      <div class="row" style="display:flex;justify-content:space-between;">
        <span class="muted">Ticket N°</span>
        <span class="bold">${escapeHtml(order.orderNumber || shortId)}</span>
      </div>
      <div class="row" style="display:flex;justify-content:space-between;">
        <span class="muted">Réf.</span>
        <span>${shortId}</span>
      </div>
      ${cashier ? `<div class="row" style="display:flex;justify-content:space-between;"><span class="muted">Caissier</span><span>${escapeHtml(cashier.name)}</span></div>` : ''}
    </div>

    <hr />

    <!-- Client -->
    <div class="section">
      <div class="bold">Client: ${escapeHtml(customerName)}</div>
      ${customerPhone ? `<div class="muted">Tél: ${escapeHtml(customerPhone)}</div>` : ''}
    </div>

    <hr />

    <!-- Articles -->
    <table>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <hr />

    <!-- Totaux -->
    <div class="totals">
      <div class="row"><span>Sous-total</span><span>${formatFCFA(order.subtotal)}</span></div>
      <div class="row total"><span>TOTAL</span><span>${formatFCFA(order.totalAmount)}</span></div>
    </div>

    <hr />

    <!-- Paiement -->
    <div class="section">
      <div class="row" style="display:flex;justify-content:space-between;">
        <span class="muted">Paiement</span>
        <span class="bold">${escapeHtml(paymentLabel)}</span>
      </div>
      ${mainPayment ? `<div class="row" style="display:flex;justify-content:space-between;"><span class="muted">Montant reçu</span><span>${formatFCFA(mainPayment.amount)}</span></div>` : ''}
    </div>

    <hr />

    <!-- Footer -->
    <div class="footer">
      <div class="thanks">Merci de votre visite !</div>
      <div class="muted small">YonuKom — Gestion de vente</div>
    </div>

    <button class="print-btn no-print" onclick="window.print()">Imprimer</button>
  </div>

  <script>
    // Auto-print au chargement (après rendu)
    window.onload = function () {
      // Petit délai pour laisser les images (logo) se charger
      setTimeout(function () {
        try { window.print(); } catch (e) { /* ignore */ }
      }, 250);
    };
  </script>
</body>
</html>`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return new NextResponse(
      '<!doctype html><html lang="fr"><body style="font-family: monospace; padding: 16px;"><h1>Erreur</h1><p>Impossible de générer le ticket.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
