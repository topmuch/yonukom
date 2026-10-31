// ============================================================
// YonuKom — API WhatsApp (custom message + log)
// POST /api/notifications/whatsapp — génère un message WhatsApp + log
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Normalise un numéro de téléphone sénégalais.
 * - Strip tout ce qui n'est pas un chiffre
 * - Si commence par 7/8/9 et 9 chiffres → préfixer 221
 * - Si commence par 221 → conserver
 */
export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");

  if (digits.length === 0) return "";

  // Format international déjà (221 + 9 chiffres = 12 chiffres)
  if (digits.startsWith("221") && digits.length === 12) {
    return digits;
  }
  // Numéro local sénégalais (9 chiffres commençant par 7/8/9)
  if (digits.length === 9 && /^[789]/.test(digits)) {
    return `221${digits}`;
  }
  // Sinon, retourner tel quel (pourrait être déjà international)
  return digits;
}

// POST /api/notifications/whatsapp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      recipient,
      type,
      message,
      metadata,
    } = body as {
      businessId?: string;
      recipient?: string;
      type?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (!recipient || typeof recipient !== "string") {
      return NextResponse.json(
        { error: "Destinataire (recipient) est obligatoire" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message est obligatoire" },
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
        type: type || "custom",
        message,
        channel: "wa_me_link",
        status: "pending",
        waMeUrl,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(
      { waMeUrl, logId: log.id, recipient: normalizedPhone },
      { status: 201 }
    );
  } catch (error) {
    console.error("[WhatsApp] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la génération du lien WhatsApp" },
      { status: 500 }
    );
  }
}
