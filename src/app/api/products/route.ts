// ============================================================
// YonuKom — API Products
// GET  /api/products?businessId=xxx — retourne les produits du business
// POST /api/products — crée un nouveau produit
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products?businessId=xxx&category=yyy
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const category = searchParams.get("category");

    if (!businessId) {
      // Pas de businessId → on retourne une liste vide (au lieu d'une erreur)
      // Permet à l'app de s'afficher même avant la connexion.
      return NextResponse.json({ products: [], total: 0 });
    }

    const where: Record<string, unknown> = {
      businessId,
      isActive: true,
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
    console.error("[Products] GET error:", error);
    // En cas d'erreur DB (ex: table absente), retourner une liste vide
    // pour ne pas casser l'UI côté client.
    return NextResponse.json({ products: [], total: 0 });
  }
}

// POST /api/products — crée un nouveau produit
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
      categoryId,
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
      categoryId?: string;
      description?: string;
      imageUrl?: string;
      quantity?: number | string;
      minStockAlert?: number | string;
      productType?: string;
      unitType?: string;
    };

    // Validation : name + price + businessId sont obligatoires
    if (!name || !businessId || salePrice === undefined || salePrice === null) {
      return NextResponse.json(
        {
          error: "Champs obligatoires manquants : name, businessId, salePrice",
        },
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
        categoryId: categoryId ? String(categoryId) : null,
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
    console.error("[Products] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création du produit" },
      { status: 500 }
    );
  }
}
