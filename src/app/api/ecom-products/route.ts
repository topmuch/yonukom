// ============================================================
// YonuKom — API E-Commerce Products
// Compat endpoint : conserve la forme { products, total } mais
// interroge la DB réelle (comme /api/products).
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/ecom-products?businessId=xxx&category=yyy
// Si businessId absent ou "demo" → liste vide.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const category = searchParams.get("category");

    if (!businessId || businessId === "demo") {
      // Pas de businessId valide → liste vide.
      return NextResponse.json({ products: [], total: 0 });
    }

    const where: Record<string, unknown> = {
      businessId,
    };
    if (category) {
      where.category = category;
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products, total: products.length });
  } catch (error) {
    console.error("[ecom-products] GET error:", error);
    // En cas d'erreur DB (ex: table absente), retourner une liste vide
    // pour ne pas casser l'UI côté client.
    return NextResponse.json({ products: [], total: 0 });
  }
}

// POST /api/ecom-products — crée un nouveau produit (délègue à db.product)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      businessId,
      salePrice,
      purchasePrice,
      sku,
      category,
      description,
      imageUrl,
      quantity,
      minStockAlert,
      productType,
      unitType,
    } = body as {
      name?: string;
      businessId?: string;
      salePrice?: number | string;
      purchasePrice?: number | string;
      sku?: string;
      category?: string;
      description?: string;
      imageUrl?: string;
      quantity?: number | string;
      minStockAlert?: number | string;
      productType?: string;
      unitType?: string;
    };

    if (!name || !businessId || businessId === "demo" || salePrice === undefined || salePrice === null) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : name, businessId, salePrice" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name: String(name).trim(),
        businessId: String(businessId),
        salePrice: Number(salePrice) || 0,
        purchasePrice: Number(purchasePrice) || 0,
        sku: sku ? String(sku).trim() : null,
        category: category ? String(category) : null,
        description: description ? String(description) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        quantity: Number(quantity) || 0,
        minStockAlert: Number(minStockAlert) || 5,
        productType: productType || "standard",
        unitType: unitType || "piece",
        isActive: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("[ecom-products] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création du produit" },
      { status: 500 }
    );
  }
}

// PUT /api/ecom-products — met à jour un produit existant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id?: string } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json(
        { error: "id est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier l'existence avant mise à jour
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Ne pas permettre le changement de businessId
    const { businessId: _ignored, ...safeUpdates } = updates as { businessId?: string };
    void _ignored;

    const updated = await db.product.update({
      where: { id },
      data: safeUpdates,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ecom-products] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
