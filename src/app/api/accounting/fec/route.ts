// ============================================================
// YonuKom — API FEC (Fichier des Écritures Comptables)
// GET /api/accounting/fec?businessId=xxx&year=YYYY
//
// Génère un fichier FEC au format tabulé (TSV) compatible avec
// les logiciels comptables français et sénégalais (Sage, Cegid, EBP, etc.).
//
// Format FEC (norme française — applicable au Sénégal pour les entreprises
// tenues à produire une comptabilité d'engagement) :
// 17 colonnes séparées par tabulation (\t) :
//   1.  JournalCode    Code journal (VT=ventes, AC=achats)
//   2.  JournalLib     Libellé journal (Ventes, Achats)
//   3.  EcritureNum    Numéro d'écriture (séquentiel)
//   4.  EcritureDate   Date d'écriture (YYYYMMDD)
//   5.  CompteNum      Numéro de compte (PCG : 411 clients, 707 ventes, 607 achats, 401 frs, 44566 TVA déductible, 44571 TVA collectée, 512 banque/cash)
//   6.  CompteLib      Libellé du compte
//   7.  CompAuxNum     Numéro compte auxiliaire (client/fournisseur) — vide ici
//   8.  CompAuxLib     Libellé compte auxiliaire — vide ici
//   9.  PieceRef       Référence de la pièce (numéro commande/facture)
//  10.  PieceDate      Date de la pièce (YYYYMMDD)
//  11.  EcritureLib    Libellé de l'écriture
//  12.  Debit          Montant débit (centimes — sans virgule)
//  13.  Credit         Montant crédit (centimes — sans virgule)
//  14.  EcritureLet    Lettrage (vide)
//  15.  DateLet        Date de lettrage (vide)
//  16.  ValidDate      Date de validation (YYYYMMDD)
//  17.  Idevise        Devise (vide = EUR/par défaut, on utilise XOF)
//
// Pour chaque vente, on génère 3 lignes d'écriture :
//   - Débit 411xxx (Client) pour le montant TTC
//   - Crédit 707xxx (Ventes) pour le montant HT
//   - Crédit 44571x (TVA collectée) pour la TVA
//
// Pour chaque achat reçu, on génère 3 lignes d'écriture :
//   - Débit 607xxx (Achats) pour le montant HT
//   - Débit 44566x (TVA déductible) pour la TVA
//   - Crédit 401xxx (Fournisseur) pour le montant TTC
//
// Content-Type: text/plain; charset=utf-8
// Content-Disposition: attachment; filename="FEC-YYYY.txt"
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const VAT_RATE_SN = 0.18;

// Plan Comptable Général (simplifié pour le commerce)
const ACCOUNTS = {
  client: { num: "411000", lib: "Clients" },
  sales: { num: "707000", lib: "Ventes de marchandises" },
  vatCollected: { num: "445710", lib: "TVA collectée" },
  supplier: { num: "401000", lib: "Fournisseurs" },
  purchases: { num: "607000", lib: "Achats de marchandises" },
  vatDeductible: { num: "445660", lib: "TVA déductible" },
  cash: { num: "530000", lib: "Caisse" },
  bank: { num: "512000", lib: "Banque" },
};

function formatFecDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function escapeFecField(value: string | null | undefined): string {
  if (!value) return "";
  // Pas de tabulation ni de saut de ligne dans les champs
  return value.replace(/[\t\n\r]/g, " ").trim();
}

// Les montants FEC sont en CENTIMES (entiers, sans virgule)
function formatFecAmount(amount: number): string {
  return String(Math.round(Math.abs(amount)));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const yearParam = searchParams.get("year");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = yearParam
      ? parseInt(yearParam, 10)
      : now.getFullYear();
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: "Année invalide" },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
      },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // --- Bornes de l'année ---
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year + 1, 0, 1, 0, 0, 0, 0);

    // --- Récupérer les ventes et achats de l'année ---
    const [orders, purchases] = await Promise.all([
      db.order.findMany({
        where: {
          businessId,
          isCancelled: false,
          createdAt: { gte: yearStart, lt: yearEnd },
        },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      db.purchase.findMany({
        where: {
          businessId,
          status: { in: ["received", "paid"] },
          receivedDate: { gte: yearStart, lt: yearEnd },
        },
        select: {
          id: true,
          reference: true,
          totalAmount: true,
          receivedDate: true,
          orderDate: true,
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { receivedDate: "asc" },
      }),
    ]);

    // --- Entête FEC ---
    const header = [
      "JournalCode",
      "JournalLib",
      "EcritureNum",
      "EcritureDate",
      "CompteNum",
      "CompteLib",
      "CompAuxNum",
      "CompAuxLib",
      "PieceRef",
      "PieceDate",
      "EcritureLib",
      "Debit",
      "Credit",
      "EcritureLet",
      "DateLet",
      "ValidDate",
      "Montantdevise",
      "Idevise",
    ].join("\t");

    const lines: string[] = [header];
    let ecritureNum = 1;

    // --- Écritures de VENTES ---
    // Pour chaque vente, 3 lignes : débit client / crédit vente HT / crédit TVA
    for (const order of orders) {
      const pieceDate = formatFecDate(order.createdAt);
      const pieceRef = escapeFecField(order.orderNumber);
      const customerName = escapeFecField(order.customer?.name) || "Client comptoir";
      const ecritureLib = escapeFecField(
        `Vente ${order.orderNumber} ${customerName}`.slice(0, 50)
      );
      const amountTTC = order.totalAmount;
      const amountHT = Math.round(amountTTC / (1 + VAT_RATE_SN));
      const amountTVA = amountTTC - amountHT;

      // Ligne 1 : débit client (TTC)
      lines.push(
        [
          "VT",
          "Ventes",
          String(ecritureNum++),
          pieceDate,
          ACCOUNTS.client.num,
          ACCOUNTS.client.lib,
          escapeFecField(order.customer?.id) || "",
          customerName,
          pieceRef,
          pieceDate,
          ecritureLib,
          formatFecAmount(amountTTC), // débit
          "0", // crédit
          "",
          "",
          pieceDate,
          "",
          "XOF",
        ].join("\t")
      );

      // Ligne 2 : crédit ventes (HT)
      lines.push(
        [
          "VT",
          "Ventes",
          String(ecritureNum++),
          pieceDate,
          ACCOUNTS.sales.num,
          ACCOUNTS.sales.lib,
          "",
          "",
          pieceRef,
          pieceDate,
          ecritureLib,
          "0",
          formatFecAmount(amountHT),
          "",
          "",
          pieceDate,
          "",
          "XOF",
        ].join("\t")
      );

      // Ligne 3 : crédit TVA collectée (TVA)
      if (amountTVA > 0) {
        lines.push(
          [
            "VT",
            "Ventes",
            String(ecritureNum++),
            pieceDate,
            ACCOUNTS.vatCollected.num,
            ACCOUNTS.vatCollected.lib,
            "",
            "",
            pieceRef,
            pieceDate,
            ecritureLib,
            "0",
            formatFecAmount(amountTVA),
            "",
            "",
            pieceDate,
            "",
            "XOF",
          ].join("\t")
        );
      }
    }

    // --- Écritures d'ACHATS ---
    // Pour chaque achat reçu, 3 lignes : débit achat HT / débit TVA / crédit fournisseur TTC
    for (const purchase of purchases) {
      const receivedDate = purchase.receivedDate || purchase.orderDate;
      const pieceDate = formatFecDate(receivedDate);
      const pieceRef = escapeFecField(purchase.reference);
      const supplierName =
        escapeFecField(purchase.supplier?.name) || "Fournisseur inconnu";
      const ecritureLib = escapeFecField(
        `Achat ${purchase.reference} ${supplierName}`.slice(0, 50)
      );
      const amountTTC = purchase.totalAmount;
      const amountHT = Math.round(amountTTC / (1 + VAT_RATE_SN));
      const amountTVA = amountTTC - amountHT;

      // Ligne 1 : débit achats (HT)
      lines.push(
        [
          "AC",
          "Achats",
          String(ecritureNum++),
          pieceDate,
          ACCOUNTS.purchases.num,
          ACCOUNTS.purchases.lib,
          "",
          "",
          pieceRef,
          pieceDate,
          ecritureLib,
          formatFecAmount(amountHT),
          "0",
          "",
          "",
          pieceDate,
          "",
          "XOF",
        ].join("\t")
      );

      // Ligne 2 : débit TVA déductible
      if (amountTVA > 0) {
        lines.push(
          [
            "AC",
            "Achats",
            String(ecritureNum++),
            pieceDate,
            ACCOUNTS.vatDeductible.num,
            ACCOUNTS.vatDeductible.lib,
            "",
            "",
            pieceRef,
            pieceDate,
            ecritureLib,
            formatFecAmount(amountTVA),
            "0",
            "",
            "",
            pieceDate,
            "",
            "XOF",
          ].join("\t")
        );
      }

      // Ligne 3 : crédit fournisseur (TTC)
      lines.push(
        [
          "AC",
          "Achats",
          String(ecritureNum++),
          pieceDate,
          ACCOUNTS.supplier.num,
          ACCOUNTS.supplier.lib,
          escapeFecField(purchase.supplier?.id) || "",
          supplierName,
          pieceRef,
          pieceDate,
          ecritureLib,
          "0",
          formatFecAmount(amountTTC),
          "",
          "",
          pieceDate,
          "",
          "XOF",
        ].join("\t")
      );
    }

    // --- Concaténer le contenu ---
    const fecContent = lines.join("\n") + "\n";

    // --- Stats pour en-tête de réponse (debug) ---
    const stats = {
      year,
      businessName: business.name,
      salesCount: orders.length,
      purchasesCount: purchases.length,
      totalLines: lines.length - 1, // sans l'entête
      totalSalesTTC: orders.reduce((s, o) => s + o.totalAmount, 0),
      totalPurchasesTTC: purchases.reduce((s, p) => s + p.totalAmount, 0),
    };

    console.info("[Accounting/FEC] generated:", stats);

    return new NextResponse(fecContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="FEC-${year}.txt"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-FEC-Stats": JSON.stringify(stats),
      },
    });
  } catch (error) {
    console.error("[Accounting/FEC] error:", error);
    return NextResponse.json(
      { error: "Échec de la génération du FEC" },
      { status: 500 }
    );
  }
}
