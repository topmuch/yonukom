// ============================================================
// YonuKom — API Stock Movements (pertes / ajustements)
// POST /api/stock-movements — enregistre une perte de stock
//   Body: { businessId, productId, quantity, reason, type? }
//   - type "loss" (défaut) : déduit le stock physique, n'impacte PAS le CA
//   - type "adjustment"   : ajustement manuel (reason obligatoire)
// Crée un StockMovement ET déduit la quantité du produit (transaction).
// Vérifie que le produit appartient bien au business.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, productId, quantity, reason, type } = body as {
      businessId?: string;
      productId?: string;
      quantity?: number;
      reason?: string;
      type?: string;
    };

    if (!businessId || !productId) {
      return NextResponse.json(
        { error: "businessId et productId sont obligatoires" },
        { status: 400 }
      );
    }
    const qty = parseInt(String(quantity), 10);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Quantité invalide (doit être > 0)" },
        { status: 400 }
      );
    }
    const moveType = type === "adjustment" ? "adjustment" : "loss";
    if ((moveType === "loss" || moveType === "adjustment") && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: "Un motif est obligatoire pour une perte / un ajustement" },
        { status: 400 }
      );
    }

    // userId depuis le JWT (pour traçabilité)
    const tokenPayload = getTokenFromRequest(request);
    const userId = tokenPayload?.userId ?? null;

    // Transaction atomique : vérifier le produit + créer le mouvement + déduire
    const result = await db.$transaction(async (tx) => {
      // Vérifier que le produit appartient au business
      const product = await tx.product.findFirst({
        where: { id: productId, businessId },
        select: { id: true, name: true, quantity: true },
      });
      if (!product) {
        throw new Error("Produit introuvable dans ce commerce");
      }
      // Empêcher une quantité négative
      if (product.quantity < qty) {
        // Pour une perte, on autorise à descendre à 0 si la quantité demandée
        // dépasse le stock (cas d'une perte découverte tardivement), mais on
        // clamp à 0 pour ne pas avoir de stock négatif.
      }

      // Créer le mouvement de stock
      const movement = await tx.stockMovement.create({
        data: {
          type: moveType,
          quantity: qty,
          reason: reason?.trim() || null,
          isLoss: moveType === "loss",
          productId: product.id,
          userId,
        },
      });

      // Déduire le stock physique (clampé à 0)
      const newQuantity = Math.max(0, product.quantity - qty);
      const updated = await tx.product.update({
        where: { id: product.id },
        data: { quantity: newQuantity },
        select: { id: true, name: true, quantity: true },
      });

      return { movement, product: updated };
    });

    return NextResponse.json(
      {
        success: true,
        movement: result.movement,
        product: result.product,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/stock-movements] error:", error);
    if (error.message?.includes("Produit introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Échec de l'enregistrement du mouvement de stock" },
      { status: 500 }
    );
  }
}
