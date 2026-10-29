import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Newsletter (abonnement boutique)
// POST /api/public/newsletter
//   { slug, email, phone? }
//   → abonne un visiteur à la newsletter d'une boutique.
//   L'email est unique par tenant. Si déjà abonné + actif → 200 "déjà abonné".
//   Si désabonné (isActive=false) → réabonné.
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, email, phone } = body as {
      slug?: string;
      email?: string;
      phone?: string;
    };

    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email requis" }, { status: 400 });
    }
    // Validation email basique
    const normalizedEmail = email.trim().toLowerCase();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!emailOk) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Upsert : si déjà abonné, on réactive
    const existing = await db.newsletterSubscriber.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: normalizedEmail } },
    });

    if (existing) {
      if (!existing.isActive) {
        await db.newsletterSubscriber.update({
          where: { id: existing.id },
          data: { isActive: true, phone: phone || existing.phone },
        });
        return NextResponse.json({
          success: true,
          message: "Vous êtes de nouveau abonné à la newsletter 📨",
        });
      }
      return NextResponse.json({
        success: true,
        message: "Vous êtes déjà abonné à cette newsletter ✅",
      });
    }

    await db.newsletterSubscriber.create({
      data: {
        tenantId: tenant.id,
        email: normalizedEmail,
        phone: phone ? String(phone).slice(0, 20) : null,
        source: "store",
        isActive: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Merci ! Vous êtes abonné à la newsletter 🎉",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/public/newsletter] error:", error);
    return NextResponse.json({ error: "Erreur lors de l'abonnement" }, { status: 500 });
  }
}
