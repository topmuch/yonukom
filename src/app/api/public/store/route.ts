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
        storePrimaryColor: true,
        allowPickup: true,
        allowDelivery: true,
        deliveryFee: true,
        ownerPhone: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Boutique introuvable" },
        { status: 404 }
      );
    }

    if (!tenant.isStoreActive) {
      return NextResponse.json({
        store: {
          ...tenant,
          // Ne pas exposer le ownerPhone si boutique fermée
          ownerPhone: undefined,
        },
        products: [],
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
    }));

    return NextResponse.json({
      store: tenant,
      products: productsWithAvailability,
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
