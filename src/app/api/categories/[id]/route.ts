// ============================================================
// YonuKom — API Category by id
// PATCH  /api/categories/:id — met à jour une catégorie
// DELETE /api/categories/:id — supprime une catégorie
//
// ⚠️ Validation : on vérifie que la catégorie appartient bien au business
// passé en query (?businessId=xxx) — empêche tout cross-tenant.
//
// Lors de la suppression, on NE BLOQUE PAS les produits qui référencent
// la catégorie : on passe simplement leur `categoryId` à NULL.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Helper : vérifie que la catégorie appartient bien au business indiqué.
async function findOwnedCategory(id: string, businessId: string) {
  return db.category.findFirst({
    where: { id, businessId },
  });
}

// PATCH /api/categories/:id?businessId=xxx
// Body: { name?, color?, sortOrder?, isActive? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const existing = await findOwnedCategory(id, businessId);
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, color, imageUrl, sortOrder, isActive } = body as {
      name?: string;
      color?: string;
      imageUrl?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    };

    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) {
      data.name = name.trim();
    }
    // Image : accepte une URL (string non vide) ou null/"" pour l'effacer.
    if (imageUrl !== undefined) {
      if (typeof imageUrl === "string" && imageUrl.trim()) {
        data.imageUrl = imageUrl.trim();
      } else {
        data.imageUrl = null;
      }
    }
    if (color !== undefined) {
      const trimmedColor = (color || "").trim();
      if (trimmedColor) {
        if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmedColor)) {
          return NextResponse.json(
            { error: "Couleur invalide (format hex attendu, ex: #F59E0B)" },
            { status: 400 }
          );
        }
        data.color = trimmedColor;
      } else {
        // Chaîne vide → on efface la couleur
        data.color = null;
      }
    }
    if (sortOrder !== undefined) {
      data.sortOrder = Number(sortOrder) || 0;
    }
    if (isActive !== undefined) {
      data.isActive = Boolean(isActive);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucun champ à mettre à jour" },
        { status: 400 }
      );
    }

    try {
      const updated = await db.category.update({
        where: { id },
        data,
      });
      return NextResponse.json(updated);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        err.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Une catégorie avec ce nom existe déjà." },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error("[Categories] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la catégorie" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id?businessId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const existing = await findOwnedCategory(id, businessId);
    if (!existing) {
      return NextResponse.json(
        { error: "Catégorie introuvable" },
        { status: 404 }
      );
    }

    // Détacher les produits qui référencent cette catégorie (categoryId = null)
    // plutôt que de bloquer la suppression.
    await db.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Categories] DELETE error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression de la catégorie" },
      { status: 500 }
    );
  }
}
