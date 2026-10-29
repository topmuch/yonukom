import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Avis / notations boutique
// GET  /api/public/reviews?slug=teranga&productId=xxx
//      → liste des avis approuvés (pour la boutique ou un produit)
// POST /api/public/reviews
//      → soumet un nouvel avis (en attente de modération)
// ============================================================

// GET — avis approuvés
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const productId = searchParams.get("productId");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);

    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }

    // Récupérer le tenant par slug
    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    const where: { tenantId: string; isApproved: boolean; productId?: string | null } = {
      tenantId: tenant.id,
      isApproved: true,
    };
    if (productId) {
      where.productId = productId;
    }

    const reviews = await db.review.findMany({
      where,
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        productId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Agrégat (moyenne + count) sur le même périmètre
    const agg = await db.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      reviews,
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : 0,
      count: agg._count.rating || 0,
    });
  } catch (error) {
    console.error("[GET /api/public/reviews] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST — soumettre un avis (en attente de modération)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, productId, customerName, customerPhone, rating, comment } = body as {
      slug?: string;
      productId?: string;
      customerName?: string;
      customerPhone?: string;
      rating?: number;
      comment?: string;
    };

    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }
    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
      return NextResponse.json({ error: "Nom requis (min 2 caractères)" }, { status: 400 });
    }
    const ratingNum = parseInt(String(rating), 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Note invalide (1 à 5)" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: { id: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Si productId fourni, vérifier qu'il appartient bien à ce tenant
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { id: true, business: { select: { tenantId: true } } },
      });
      if (!product || product.business.tenantId !== tenant.id) {
        return NextResponse.json({ error: "Produit invalide pour cette boutique" }, { status: 400 });
      }
    }

    const review = await db.review.create({
      data: {
        tenantId: tenant.id,
        productId: productId || null,
        customerName: customerName.trim().slice(0, 80),
        customerPhone: customerPhone ? String(customerPhone).slice(0, 20) : null,
        rating: ratingNum,
        comment: comment ? String(comment).trim().slice(0, 1000) : null,
        isApproved: false, // modération requise
      },
    });

    return NextResponse.json(
      {
        success: true,
        reviewId: review.id,
        message: "Merci pour votre avis ! Il sera visible après modération.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/public/reviews] error:", error);
    return NextResponse.json({ error: "Erreur lors du dépôt de l'avis" }, { status: 500 });
  }
}
