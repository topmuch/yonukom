// ============================================================
// YonuKom — API Categories
// GET  /api/categories?businessId=xxx — liste les catégories du business
// POST /api/categories — crée une nouvelle catégorie
// Permet au commerçant de créer ses propres catégories de produits
// (remplace les listes hardcoded "Plats, Boissons, etc.").
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const categories = await db.category.findMany({
      where: { businessId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[Categories] GET error:", error);
    return NextResponse.json(
      { error: "Échec du chargement des catégories" },
      { status: 500 }
    );
  }
}

// POST /api/categories — crée une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, name, color, sortOrder } = body as {
      businessId?: string;
      name?: string;
      color?: string;
      sortOrder?: number;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom de la catégorie est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier que le business existe
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // Valider la couleur si fournie (format hex simple)
    const trimmedName = name.trim();
    const trimmedColor = color?.trim() || null;
    if (
      trimmedColor &&
      !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmedColor)
    ) {
      return NextResponse.json(
        { error: "Couleur invalide (format hex attendu, ex: #F59E0B)" },
        { status: 400 }
      );
    }

    // Créer la catégorie — l'unicité [businessId, name] est garantie par le schéma.
    // Si une catégorie existe déjà avec ce nom, Prisma lèvera P2002 → 409.
    try {
      const category = await db.category.create({
        data: {
          businessId,
          name: trimmedName,
          color: trimmedColor,
          sortOrder: Number(sortOrder) || 0,
          isActive: true,
        },
      });
      return NextResponse.json(category, { status: 201 });
    } catch (err: unknown) {
      // Prisma P2002 = unique constraint violation
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          {
            error: `Une catégorie nommée « ${trimmedName} » existe déjà.`,
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("[Categories] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de la catégorie" },
      { status: 500 }
    );
  }
}
