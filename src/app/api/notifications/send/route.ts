// ============================================================
// YonuKom — API Notifications Send (scénarios pré-construits)
// POST /api/notifications/send — génère le bon message selon le scénario
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "../whatsapp/route";

type Scenario = "sale_receipt" | "debt_reminder" | "stock_alert" | "daily_summary";

interface SendBody {
  businessId?: string;
  scenario?: Scenario;
  recipient?: string;
  context?: Record<string, unknown>;
}

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SendBody;

    const { businessId, scenario, recipient, context = {} } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (!scenario) {
      return NextResponse.json(
        { error: "scenario est obligatoire" },
        { status: 400 }
      );
    }

    if (!recipient || typeof recipient !== "string") {
      return NextResponse.json(
        { error: "recipient (téléphone) est obligatoire" },
        { status: 400 }
      );
    }

    // Charger le business + settings pour les templates
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, phone: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    const businessName = business.name;
    let message = "";
    let type = scenario;
    let metadata: Record<string, unknown> = { scenario };

    switch (scenario) {
      case "sale_receipt": {
        const orderId = context.orderId as string | undefined;
        const total = Number(context.total ?? 0);
        if (!orderId) {
          return NextResponse.json(
            { error: "context.orderId est requis pour sale_receipt" },
            { status: 400 }
          );
        }
        message = `Merci pour votre achat chez ${businessName} ! Total: ${total.toLocaleString(
          "fr-FR"
        )} FCFA. Reçu: ${orderId}. Merci de votre confiance.`;
        metadata = { ...metadata, orderId, total };
        break;
      }
      case "debt_reminder": {
        const customerName = context.customerName as string | undefined;
        const totalDebt = Number(context.totalDebt ?? 0);
        const oldestDateRaw = context.oldestDate as string | undefined;
        if (!customerName || !oldestDateRaw) {
          return NextResponse.json(
            {
              error:
                "context.customerName et context.oldestDate sont requis pour debt_reminder",
            },
            { status: 400 }
          );
        }
        const oldestDate = fmtDate(new Date(oldestDateRaw));
        message = `Bonjour ${customerName}, c'est ${businessName}. Vous avez une créance de ${totalDebt.toLocaleString(
          "fr-FR"
        )} FCFA datant du ${oldestDate}. Merci de régulariser.`;
        metadata = { ...metadata, customerName, totalDebt, oldestDate };
        break;
      }
      case "stock_alert": {
        const productName = context.productName as string | undefined;
        const currentQty = Number(context.currentQty ?? 0);
        const threshold = Number(context.threshold ?? 5);
        if (!productName) {
          return NextResponse.json(
            { error: "context.productName est requis pour stock_alert" },
            { status: 400 }
          );
        }
        message = `⚠️ Alerte stock — ${businessName}. Le produit "${productName}" est en rupture imminente : ${currentQty} unité(s) restante(s) (seuil: ${threshold}). Pensez à réapprovisionner.`;
        metadata = { ...metadata, productName, currentQty, threshold };
        break;
      }
      case "daily_summary": {
        const totalSales = Number(context.totalSales ?? 0);
        const orderCount = Number(context.orderCount ?? 0);
        const topProduct = (context.topProduct as string | undefined) || "—";
        const today = fmtDate(new Date());
        message = `📊 Récap quotidien ${businessName} (${today}). Ventes: ${totalSales.toLocaleString(
          "fr-FR"
        )} FCFA sur ${orderCount} commande(s). Top produit: ${topProduct}. Bonne soirée !`;
        metadata = { ...metadata, totalSales, orderCount, topProduct };
        break;
      }
      default:
        return NextResponse.json(
          { error: `Scénario inconnu: ${scenario}` },
          { status: 400 }
        );
    }

    const normalizedPhone = normalizePhone(recipient);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide" },
        { status: 400 }
      );
    }

    const waMeUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;

    const log = await db.notificationLog.create({
      data: {
        businessId,
        recipient: normalizedPhone,
        type,
        message,
        channel: "wa_me_link",
        status: "pending",
        waMeUrl,
        metadata: JSON.stringify(metadata),
      },
    });

    return NextResponse.json(
      { waMeUrl, logId: log.id, message, recipient: normalizedPhone },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Notifications/Send] POST error:", error);
    return NextResponse.json(
      { error: "Échec de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
