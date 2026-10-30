import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Récupère les infos d'une boutique par son slug
// GET /api/public/store?slug=fatou-jus
//
// Pas d'authentification requise (page publique)
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Slug requis" },
        { status: 400 }
      );
    }

    // Récupérer le tenant par son slug
    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: {
        id: true,
        name: true,
        storeSlug: true,
        isStoreActive: true,
        storeLogoUrl: true,
        storeBannerUrl: true,
        storeSliderImages: true,
        storePrimaryColor: true,
        allowPickup: true,
        allowDelivery: true,
        deliveryFee: true,
        ownerPhone: true,
        businesses: { select: { logoUrl: true } },
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Boutique introuvable" },
        { status: 404 }
      );
    }

    // Si storeLogoUrl est null, utiliser le logo du premier Business du tenant
    const businessLogo = tenant.businesses?.[0]?.logoUrl || null;
    const storeLogoUrl = tenant.storeLogoUrl || businessLogo;

    // Retirer la relation businesses de la réponse
    const { businesses, ...tenantClean } = tenant;

    if (!tenant.isStoreActive) {
      return NextResponse.json({
        store: {
          ...tenantClean,
          storeLogoUrl,
          ownerPhone: undefined,
        },
        products: [],
        featuredProducts: [],
        activePromos: [],
        reviewsSummary: { average: 0, count: 0 },
        isClosed: true,
      });
    }

    // Récupérer les produits du tenant (via Business.tenantId)
    const products = await db.product.findMany({
      where: {
        business: { tenantId: tenant.id },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        salePrice: true,
        compareAtPrice: true,
        isFeatured: true,
        quantity: true,
        reservedQuantity: true,
        category: true,
        imageUrl: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    // Calculer le stock disponible pour chaque produit
    const productsWithAvailability = products.map((p) => ({
      ...p,
      availableQuantity: p.quantity - p.reservedQuantity,
      // promo active si compareAtPrice renseigné ET > salePrice
      hasPromo: p.compareAtPrice !== null && p.compareAtPrice > p.salePrice,
      discountPercent:
        p.compareAtPrice !== null && p.compareAtPrice > p.salePrice
          ? Math.round(((p.compareAtPrice - p.salePrice) / p.compareAtPrice) * 100)
          : 0,
    }));

    // Produits vedettes (isFeatured=true), triés en tête
    const featuredProducts = productsWithAvailability
      .filter((p) => p.isFeatured)
      .slice(0, 8);

    // Promos actives (modèle Promo par business) — 1 seule active à la fois par business
    const businessIds = await db.business.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    });
    const bIds = businessIds.map((b) => b.id);
    const activePromos = await db.promo.findMany({
      where: {
        businessId: { in: bIds },
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        percentage: true,
        ticketMessage: true,
        minAmount: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    // Résumé des avis approuvés (moyenne + count) sur la boutique
    const reviewsAgg = await db.review.aggregate({
      where: { tenantId: tenant.id, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const reviewsSummary = {
      average: reviewsAgg._avg.rating ? Math.round(reviewsAgg._avg.rating * 10) / 10 : 0,
      count: reviewsAgg._count.rating || 0,
    };

    return NextResponse.json({
      store: {
        ...tenantClean,
        storeLogoUrl,
      },
      products: productsWithAvailability,
      featuredProducts,
      activePromos,
      reviewsSummary,
      isClosed: false,
    });
  } catch (error) {
    console.error("[GET /api/public/store] error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
