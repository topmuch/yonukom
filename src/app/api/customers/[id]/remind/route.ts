// ============================================================
// YonuKom — API Customer Remind (relance WhatsApp)
// POST /api/customers/:id/remind
// Body: { businessId, message? }
// Crée un NotificationLog type="debt_reminder" + génère un lien wa.me
// Retourne { waMeUrl, logId, message }
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function formatFCFA(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatted} FCFA`;
}

function formatDateFR(dateInput: string | Date): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(dateInput));
  } catch {
    return String(dateInput);
  }
}

/** Strip tous les caractères non-numériques d'un numéro de téléphone */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  // Si commence déjà par 221 (Sénégal), OK. Sinon si 9 chiffres locales, préfixer 221.
  if (digits.startsWith("221")) return digits;
  if (digits.length === 9) return `221${digits}`;
  return digits;
}

// POST /api/customers/:id/remind
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { businessId, message: customMessage } = body as {
      businessId?: string;
      message?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    // 1. Charger client + business + dettes
    const customer = await db.customer.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        businessId: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    if (customer.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : ce client n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, phone: true },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business introuvable" },
        { status: 404 }
      );
    }

    // 2. Calculer total dette + plus ancienne date
    const orders = await db.order.findMany({
      where: {
        customerId: id,
        isCancelled: false,
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        totalAmount: true,
        paidAmount: true,
        createdAt: true,
      },
    });

    const debts = orders.filter((o) => o.totalAmount - o.paidAmount > 0);
    const totalDebt = debts.reduce(
      (sum, o) => sum + (o.totalAmount - o.paidAmount),
      0
    );
    const oldestDate = debts.length > 0 ? debts[0].createdAt : null;

    if (totalDebt <= 0) {
      return NextResponse.json(
        { error: "Ce client n'a aucune dette en cours" },
        { status: 400 }
      );
    }

    // 3. Déterminer numéro destinataire (client → fallback business)
    const recipientPhone =
      normalizePhone(customer.phone) || normalizePhone(business.phone);

    if (!recipientPhone) {
      return NextResponse.json(
        {
          error:
            "Aucun numéro de téléphone valide pour ce client ni pour le business",
        },
        { status: 400 }
      );
    }

    // 4. Construire le message par défaut si non fourni
    const message =
      customMessage && customMessage.trim().length > 0
        ? customMessage
        : `Bonjour ${customer.name}, c'est ${business.name}. Vous avez une créance de ${formatFCFA(
            totalDebt
          )} datant du ${
            oldestDate ? formatDateFR(oldestDate) : "récemment"
          }. Merci de régulariser. WhatsApp: ${business.phone || "N/A"}`;

    const encoded = encodeURIComponent(message);
    const waMeUrl = `https://wa.me/${recipientPhone}?text=${encoded}`;

    // 5. Enregistrer dans NotificationLog
    const log = await db.notificationLog.create({
      data: {
        businessId,
        recipient: recipientPhone,
        type: "debt_reminder",
        message,
        channel: "wa_me_link",
        status: "pending",
        waMeUrl,
        metadata: JSON.stringify({
          customerId: customer.id,
          customerName: customer.name,
          totalDebt,
          oldestDebtDate: oldestDate ? oldestDate.toISOString() : null,
        }),
      },
    });

    return NextResponse.json(
      {
        waMeUrl,
        logId: log.id,
        message,
        recipient: recipientPhone,
        totalDebt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Customers/:id/remind] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la génération de la relance" },
      { status: 500 }
    );
  }
}
