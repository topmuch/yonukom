import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Analytics (tracking visiteur boutique)
// POST /api/public/track
//   { slug, type, path?, productId?, sessionId? }
//   → enregistre un événement analytics anonyme pour la boutique.
//   Types: "page_view" | "product_view" | "add_to_cart" | "checkout" | "purchase" | "whatsapp_click"
// ============================================================

const VALID_TYPES = new Set([
  "page_view",
  "product_view",
  "add_to_cart",
  "checkout",
  "purchase",
  "whatsapp_click",
  "newsletter_subscribe",
  "review_submit",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, type, path, productId, sessionId } = body as {
      slug?: string;
      type?: string;
      path?: string;
      productId?: string;
      sessionId?: string;
    };

    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }
    if (!type || !VALID_TYPES.has(type)) {
      return NextResponse.json({ error: "type invalide" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: { id: true },
    });
    if (!tenant) {
      // Silencieux : ne pas révéler l'existence de la boutique
      return NextResponse.json({ success: true });
    }

    await db.analyticsEvent.create({
      data: {
        tenantId: tenant.id,
        type,
        path: path ? String(path).slice(0, 255) : null,
        productId: productId || null,
        sessionId: sessionId ? String(sessionId).slice(0, 64) : null,
        meta: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/public/track] error:", error);
    // Non-bloquant : le tracking ne doit jamais casser l'UX
    return NextResponse.json({ success: true });
  }
}
