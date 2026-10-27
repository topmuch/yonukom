// ============================================================
// YonuKom — Receipt (Ticket de caisse)
// GET /api/orders/:id/receipt
// Renvoie une page HTML imprimable au format ticket 80mm.
// Specs :
//   - TOUT le texte en NOIR (#000) sur fond blanc
//   - Prix et TOTAL en GRAS et plus grand (18px TOTAL, 14px prix)
//   - Police monospace (ticket thermique)
//   - PAS d'infos client (retiré sur demande utilisateur)
//   - QR code en bas (pointe vers Business.qrCodeUrl)
//   - Message bas de ticket (Business.ticketFooterMessage)
//   - Ligne promo si une promo a été appliquée à la commande
//   - Auto-print au chargement (setTimeout 250ms)
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Espèces',
  wave: 'Wave',
  orange_money: 'Orange Money',
  cb: 'Carte bancaire',
  cheque: 'Chèque',
  virement: 'Virement',
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: 'Sur place',
  takeaway: 'À emporter',
  delivery: 'Livraison',
}

const DEFAULT_QR_URL = 'https://yonukom.qrtags.pro/'

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
            product: { select: { id: true, name: true } },
          },
        },
        payments: true,
      },
    })

    if (!order) {
      return new NextResponse(
        '<!doctype html><html lang="fr"><body style="font-family: monospace; padding: 16px;"><h1>Commande introuvable</h1><p>Aucune commande trouvée pour cet identifiant.</p></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Charger business + caissier + promo éventuelle en parallèle
    const [business, cashier, promo] = await Promise.all([
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
          qrCodeUrl: true,
          ticketFooterMessage: true,
        },
      }),
      order.createdBy
        ? db.user.findUnique({
            where: { id: order.createdBy },
            select: { name: true },
          })
        : Promise.resolve(null),
      order.promoId
        ? db.promo.findUnique({
            where: { id: order.promoId },
            select: {
              id: true,
              name: true,
              percentage: true,
              type: true,
              ticketMessage: true,
            },
          })
        : Promise.resolve(null),
    ])

    // Premier paiement → méthode principale
    const mainPayment = order.payments[0]
    const paymentLabel = mainPayment
      ? (PAYMENT_LABELS[mainPayment.method] ?? mainPayment.method)
      : 'Non spécifié'

    // Type de commande + frais de livraison
    const orderTypeLabel =
      ORDER_TYPE_LABELS[order.orderType] ??
      (order.orderType === 'delivery' ? 'Livraison' : 'Sur place')
    const deliveryFee =
      typeof order.deliveryFee === 'number' ? order.deliveryFee : 0
    const showDeliveryLine = order.orderType === 'delivery' && deliveryFee > 0

    // Calcul de la remise promo (pour l'afficher sur le ticket)
    // On recalcule à partir de la promo pour cohérence (le total order.totalAmount inclut déjà la remise)
    let promoDiscount = 0
    if (promo) {
      const pct = promo.percentage ?? 0
      if (promo.type === 'global') {
        promoDiscount = Math.round((order.subtotal * pct) / 100)
      } else if (promo.type === 'amount') {
        // Si on a appliqué la promo (order.promoId set), c'est que le seuil était atteint
        promoDiscount = Math.round((order.subtotal * pct) / 100)
      } else if (promo.type === 'product') {
        // Somme des items du panier correspondant au productId
        const matchingItemsTotal = order.orderItems
          .filter((it) => it.productId === promo.productId)
          .reduce((sum, it) => sum + it.totalPrice, 0)
        promoDiscount = Math.round((matchingItemsTotal * pct) / 100)
      }
    }
    const showPromoLine = Boolean(promo) && promoDiscount > 0

    // Construction des lignes d'articles (format ticket thermique)
    const itemsRows = order.orderItems
      .map((item) => {
        const name = escapeHtml(item.product?.name ?? 'Article')
        const qty = item.quantity
        const unit = formatFCFA(item.unitPrice)
        const lineTotal = formatFCFA(item.totalPrice)
        return `
          <tr class="item-row">
            <td class="item-name" colspan="3">${name}</td>
          </tr>
          <tr class="item-line">
            <td class="qty">x${qty}</td>
            <td class="unit">${escapeHtml(unit)}</td>
            <td class="line-total">${escapeHtml(lineTotal)}</td>
          </tr>
        `
      })
      .join('')

    // Truncated order id (8 chars) — pour lisibilité sur ticket
    const shortId = order.id.slice(-8).toUpperCase()

    // Logo HTML
    const logoHtml = business?.logoUrl
      ? `<img src="${escapeHtml(business.logoUrl)}" alt="logo" style="max-width: 60mm; max-height: 30mm; object-fit: contain;" />`
      : ''

    // Adresse complète (avec ville)
    const addressParts = [
      business?.address,
      business?.city,
    ].filter(Boolean)
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : null

    // QR code URL (avec fallback sur l'URL par défaut)
    const qrTargetUrl = business?.qrCodeUrl?.trim() || DEFAULT_QR_URL
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrTargetUrl)}`

    // Footer message personnalisé
    const footerMessage = business?.ticketFooterMessage?.trim() || ''

    // Construction du HTML final (80mm, monospace, NOIR sur BLANC, prix en GRAS)
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
    color: #000000;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .price { font-weight: 700; font-size: 14px; color: #000; }
  .muted { color: #000; }
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
    font-size: 16px;
    font-weight: 700;
    margin: 2px 0;
    letter-spacing: 0.5px;
    color: #000;
  }
  .header .meta {
    font-size: 12px;
    color: #000;
    margin: 1px 0;
  }
  .section { margin: 6px 0; font-size: 12px; color: #000; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 1px 0; color: #000; }
  .item-row .item-name { font-weight: 600; padding-top: 4px; color: #000; }
  .item-line td { padding: 0 0 2px 0; color: #000; }
  .qty { width: 18%; color: #000; }
  .unit { width: 42%; text-align: left; color: #000; }
  .line-total { width: 40%; text-align: right; font-weight: 700; color: #000; }
  .totals { margin-top: 4px; color: #000; }
  .totals .row {
    display: flex;
    justify-content: space-between;
    padding: 1px 0;
    color: #000;
  }
  .totals .row .price-inline {
    font-weight: 700;
    font-size: 14px;
    color: #000;
  }
  .totals .row.promo {
    color: #000;
    font-weight: 700;
  }
  .totals .row.total {
    font-weight: 700;
    font-size: 18px;
    color: #000;
    border-top: 2px solid #000;
    padding-top: 6px;
    margin-top: 6px;
  }
  .qr-wrap {
    text-align: center;
    margin-top: 10px;
  }
  .qr-wrap img {
    width: 38mm;
    height: 38mm;
  }
  .qr-caption {
    font-size: 10px;
    text-align: center;
    color: #000;
    margin-top: 4px;
  }
  .footer-msg {
    text-align: center;
    font-size: 11px;
    color: #000;
    margin-top: 8px;
    font-style: italic;
  }
  .thanks {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #000;
    margin-top: 10px;
  }
  @media print {
    @page { margin: 0; size: 80mm auto; }
    html, body { width: 80mm; background: #ffffff; }
    .no-print { display: none; }
  }
  .print-btn {
    display: block;
    margin: 12px auto 0;
    padding: 8px 16px;
    background: #000000;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    font-family: inherit;
  }
</style>
</head>
<body>
  <div class="receipt">
    <!-- 1. Header / Business -->
    <div class="header center">
      ${logoHtml ? `<div class="logo-wrap">${logoHtml}</div>` : ''}
      <h1>${escapeHtml(business?.name ?? 'YonuKom')}</h1>
      ${addressLine ? `<div class="meta">${escapeHtml(addressLine)}</div>` : ''}
      ${business?.phone ? `<div class="meta">Tél: ${escapeHtml(business.phone)}</div>` : ''}
      ${business?.email ? `<div class="meta">${escapeHtml(business.email)}</div>` : ''}
    </div>

    <hr />

    <!-- 2. Date + ticket number -->
    <div class="section">
      <div style="display:flex;justify-content:space-between;">
        <span>${escapeHtml(formatDate(order.createdAt))}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Ticket N°</span>
        <span class="bold">${escapeHtml(order.orderNumber || shortId)}</span>
      </div>
      ${cashier ? `<div style="display:flex;justify-content:space-between;"><span>Caissier</span><span>${escapeHtml(cashier.name)}</span></div>` : ''}
    </div>

    <hr />

    <!-- 3. Articles -->
    <table>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <hr />

    <!-- 4. Totaux (prix en GRAS, plus grand) -->
    <div class="totals">
      <div class="row">
        <span>Sous-total</span>
        <span class="price-inline">${escapeHtml(formatFCFA(order.subtotal))}</span>
      </div>
      ${showDeliveryLine ? `<div class="row"><span>Livraison</span><span class="price-inline">${escapeHtml(formatFCFA(deliveryFee))}</span></div>` : ''}
      ${showPromoLine && promo ? `
        <div class="row promo">
          <span>Promo (${escapeHtml(promo.name)} -${promo.percentage}%)</span>
          <span class="price-inline">-${escapeHtml(formatFCFA(promoDiscount))}</span>
        </div>
      ` : ''}
      <div class="row total">
        <span>TOTAL</span>
        <span>${escapeHtml(formatFCFA(order.totalAmount))}</span>
      </div>
    </div>

    <hr />

    <!-- 5. Payment method -->
    <div class="section">
      <div style="display:flex;justify-content:space-between;">
        <span>Paiement</span>
        <span class="bold">${escapeHtml(paymentLabel)}</span>
      </div>
      ${mainPayment ? `<div style="display:flex;justify-content:space-between;"><span>Montant reçu</span><span>${escapeHtml(formatFCFA(mainPayment.amount))}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;">
        <span>Type</span>
        <span class="bold">${escapeHtml(orderTypeLabel)}</span>
      </div>
    </div>

    <hr />

    <!-- 6. QR code (rating / link) -->
    <div class="qr-wrap">
      <img src="${escapeHtml(qrImgUrl)}" alt="QR code" />
      <div class="qr-caption">Scannez pour noter notre service</div>
    </div>

    <!-- 7. Footer message personnalisé -->
    ${footerMessage ? `<div class="footer-msg">${escapeHtml(footerMessage)}</div>` : ''}

    <!-- 8. Thanks -->
    <div class="thanks">Merci de votre visite !</div>

    <button class="print-btn no-print" onclick="window.print()">Imprimer</button>
  </div>

  <script>
    // Auto-print au chargement (après rendu, délai pour les images)
    window.onload = function () {
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
