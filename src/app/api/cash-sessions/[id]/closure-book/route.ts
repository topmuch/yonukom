// ============================================================
// YonuKom — Livre de clôture de caisse (Closure Book)
// GET /api/cash-sessions/[id]/closure-book
// Renvoie une page HTML imprimable A4 portrait résumant la session :
//   - En-tête business (logo, nom, adresse, tél)
//   - Titre "LIVRE DE CLÔTURE DE CAISSE"
//   - Date + heures d'ouverture/fermeture + caissier
//   - Tableau récapitulatif : nb commandes, CA total, ventes par moyen
//     de paiement, montant théorique espèces, montant déclaré, écart
//   - 10 dernières transactions
//   - Ligne de signature caissier
//   - Auto-print au chargement
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

function formatDateTime(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('fr-FR', {
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

    const session = await db.cashSession.findUnique({
      where: { id },
    })

    if (!session) {
      return new NextResponse(
        '<!doctype html><html lang="fr"><body style="font-family: monospace; padding: 16px;"><h1>Session introuvable</h1></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Récupérer business + caissier (ouvre + ferme) en parallèle
    const [business, openedByUser, closedByUser] = await Promise.all([
      db.business.findUnique({
        where: { id: session.businessId },
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          logoUrl: true,
        },
      }),
      db.user.findUnique({
        where: { id: session.openedBy },
        select: { name: true },
      }).catch(() => null),
      session.closedBy
        ? db.user.findUnique({
            where: { id: session.closedBy },
            select: { name: true },
          }).catch(() => null)
        : Promise.resolve(null),
    ])

    // Calcul du CA et de la répartition par moyen de paiement sur la période de la session
    // (entre openedAt et closedAt / now si toujours ouvert)
    const sessionEnd = session.closedAt ?? new Date()

    const orders = await db.order.findMany({
      where: {
        businessId: session.businessId,
        createdAt: { gte: session.openedAt, lte: sessionEnd },
        isCancelled: false,
      },
      include: {
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // safety cap
    })

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const orderCount = orders.length

    // Répartition par moyen de paiement (somme des Payment)
    const paymentBreakdown: Record<string, number> = {}
    for (const o of orders) {
      for (const p of o.payments) {
        paymentBreakdown[p.method] = (paymentBreakdown[p.method] ?? 0) + p.amount
      }
    }

    const cashSales = paymentBreakdown['cash'] ?? 0
    const waveSales = paymentBreakdown['wave'] ?? 0
    const omSales = paymentBreakdown['orange_money'] ?? 0
    const cbSales = paymentBreakdown['cb'] ?? 0

    // Montant théorique espèces = somme des paiements cash (théorique total, en général égal à session.theoreticalTotal)
    const theoreticalCash = cashSales
    const theoreticalTotal = session.theoreticalTotal ?? 0
    const declaredTotal = session.declaredTotal ?? 0
    const difference = session.difference ?? 0
    const hasDifference = difference !== 0

    // 10 dernières transactions (les plus récentes)
    const lastTransactions = orders.slice(0, 10)

    // Construction des lignes du tableau transactions
    const txRows = lastTransactions
      .map((o, idx) => {
        const method = o.payments[0]?.method ?? 'cash'
        const methodLabel = PAYMENT_LABELS[method] ?? method
        const statusLabel = o.isCancelled ? 'Annulée' : 'Validée'
        return `
          <tr>
            <td class="num">${idx + 1}</td>
            <td>${escapeHtml(o.orderNumber ?? o.id.slice(-6).toUpperCase())}</td>
            <td>${escapeHtml(formatDateTime(o.createdAt))}</td>
            <td class="num">${formatFCFA(o.totalAmount)}</td>
            <td>${escapeHtml(methodLabel)}</td>
            <td>${escapeHtml(statusLabel)}</td>
          </tr>
        `
      })
      .join('')

    const openedByName = openedByUser?.name ?? '—'
    const closedByName = closedByUser?.name ?? '—'

    const logoHtml = business?.logoUrl
      ? `<img src="${escapeHtml(business.logoUrl)}" alt="logo" style="max-height: 24mm; max-width: 40mm; object-fit: contain;" />`
      : ''

    const addressParts = [business?.address, business?.city].filter(Boolean)
    const addressLine = addressParts.length > 0 ? addressParts.join(', ') : ''

    const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Livre de clôture — ${escapeHtml(business?.name ?? 'YonuKom')}</title>
<style>
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 14mm 16mm;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .header .logo { flex-shrink: 0; }
  .header .info { flex: 1; }
  .header h1 { font-size: 18px; margin: 0 0 2px 0; color: #000; }
  .header .meta { font-size: 11px; color: #000; margin: 0; }
  .title {
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
    margin: 10px 0 18px 0;
    text-transform: uppercase;
    color: #000;
  }
  .meta-block {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 32px;
    margin-bottom: 14px;
  }
  .meta-block .item { font-size: 12px; color: #000; }
  .meta-block .item span.label {
    color: #000;
    font-weight: 600;
    display: inline-block;
    margin-right: 6px;
  }
  table.summary {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 18px 0;
  }
  table.summary th, table.summary td {
    border: 1px solid #000;
    padding: 8px 12px;
    color: #000;
  }
  table.summary th {
    background: #f0f0f0;
    text-align: left;
    font-weight: 700;
  }
  table.summary td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
  table.summary tr.diff td {
    font-size: 14px;
  }
  table.summary tr.diff-nonzero td {
    color: #cc0000;
    font-weight: 700;
  }
  h2 {
    font-size: 14px;
    margin: 18px 0 6px 0;
    border-bottom: 1px solid #000;
    padding-bottom: 4px;
  }
  table.tx {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }
  table.tx th, table.tx td {
    border: 1px solid #000;
    padding: 5px 8px;
    color: #000;
  }
  table.tx th {
    background: #f0f0f0;
    text-align: left;
    font-weight: 700;
  }
  table.tx td.num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .signature {
    margin-top: 28px;
    display: flex;
    justify-content: space-between;
    gap: 32px;
  }
  .signature .sign-box {
    flex: 1;
    text-align: center;
  }
  .signature .sign-line {
    border-top: 1px solid #000;
    margin-top: 32px;
    padding-top: 6px;
    font-size: 11px;
    color: #000;
  }
  .footer {
    margin-top: 24px;
    font-size: 10px;
    color: #000;
    text-align: center;
    border-top: 1px solid #000;
    padding-top: 8px;
  }
  @media print {
    @page { margin: 0; size: A4 portrait; }
    html, body { width: 210mm; }
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
  <div class="page">
    <!-- Header -->
    <div class="header">
      ${logoHtml ? `<div class="logo">${logoHtml}</div>` : ''}
      <div class="info">
        <h1>${escapeHtml(business?.name ?? 'YonuKom')}</h1>
        ${addressLine ? `<p class="meta">${escapeHtml(addressLine)}</p>` : ''}
        ${business?.phone ? `<p class="meta">Tél: ${escapeHtml(business.phone)}</p>` : ''}
        ${business?.email ? `<p class="meta">${escapeHtml(business.email)}</p>` : ''}
      </div>
    </div>

    <!-- Title -->
    <div class="title">Livre de clôture de caisse</div>

    <!-- Meta block -->
    <div class="meta-block">
      <div class="item"><span class="label">Date:</span> ${escapeHtml(formatDateTime(session.openedAt))}</div>
      <div class="item"><span class="label">Ouverture:</span> ${escapeHtml(formatTime(session.openedAt))}</div>
      <div class="item"><span class="label">Clôture:</span> ${escapeHtml(session.closedAt ? formatTime(session.closedAt) : '—')}</div>
      <div class="item"><span class="label">Caissier:</span> ${escapeHtml(openedByName)}</div>
      ${session.closedAt ? `<div class="item"><span class="label">Clôturé par:</span> ${escapeHtml(closedByName)}</div>` : ''}
    </div>

    <!-- Summary table -->
    <table class="summary">
      <tr>
        <th>Nombre de commandes</th>
        <td class="num">${orderCount}</td>
      </tr>
      <tr>
        <th>Chiffre d&apos;affaires total</th>
        <td class="num">${formatFCFA(totalRevenue)}</td>
      </tr>
      <tr>
        <th>Ventes Espèces</th>
        <td class="num">${formatFCFA(cashSales)}</td>
      </tr>
      <tr>
        <th>Ventes Wave</th>
        <td class="num">${formatFCFA(waveSales)}</td>
      </tr>
      <tr>
        <th>Ventes Orange Money</th>
        <td class="num">${formatFCFA(omSales)}</td>
      </tr>
      <tr>
        <th>Ventes Carte bancaire</th>
        <td class="num">${formatFCFA(cbSales)}</td>
      </tr>
      <tr>
        <th>Montant théorique en espèces</th>
        <td class="num">${formatFCFA(theoreticalCash)}</td>
      </tr>
      <tr>
        <th>Montant théorique total (tous moyens)</th>
        <td class="num">${formatFCFA(theoreticalTotal)}</td>
      </tr>
      <tr>
        <th>Montant déclaré en caisse</th>
        <td class="num">${formatFCFA(declaredTotal)}</td>
      </tr>
      <tr class="diff ${hasDifference ? 'diff-nonzero' : ''}">
        <th>Écart (déclaré - théorique)</th>
        <td class="num">${difference === 0 ? '0 FCFA' : (difference > 0 ? '+' : '') + formatFCFA(difference)}</td>
      </tr>
    </table>

    <!-- Last transactions -->
    <h2>10 dernières transactions</h2>
    <table class="tx">
      <thead>
        <tr>
          <th>#</th>
          <th>N° ticket</th>
          <th>Date / heure</th>
          <th>Montant</th>
          <th>Paiement</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        ${txRows || `<tr><td colspan="6" style="text-align:center;">Aucune transaction sur cette session.</td></tr>`}
      </tbody>
    </table>

    <!-- Signature -->
    <div class="signature">
      <div class="sign-box">
        <div class="sign-line">Signature du caissier</div>
      </div>
      <div class="sign-box">
        <div class="sign-line">Signature du responsable</div>
      </div>
    </div>

    <div class="footer">
      Document généré par YonuKom le ${escapeHtml(formatDateTime(new Date()))} — Document à conserver pour la comptabilité.
    </div>

    <button class="print-btn no-print" onclick="window.print()">Imprimer</button>
  </div>

  <script>
    // Auto-print au chargement
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
    console.error('[GET /api/cash-sessions/[id]/closure-book] error:', error)
    return new NextResponse(
      '<!doctype html><html lang="fr"><body style="font-family: monospace; padding: 16px;"><h1>Erreur</h1><p>Impossible de générer le livre de clôture.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}
