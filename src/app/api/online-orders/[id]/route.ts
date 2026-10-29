import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/online-orders/[id]
// Body: { status: "CONFIRMED" | "CANCELLED" | "COMPLETED" }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Statut invalide. Utilisez CONFIRMED, CANCELLED ou COMPLETED" },
        { status: 400 }
      );
    }

    // Récupérer la commande actuelle
    const order = await db.onlineOrder.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // --- TRANSACTION pour gérer le stock ---
    const result = await db.$transaction(async (tx) => {
      // Si on annule la commande → libérer le stock réservé
      if (status === "CANCELLED" && order.status === "PENDING") {
        const items = JSON.parse(order.items || "[]");
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { reservedQuantity: true },
          });
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                reservedQuantity: Math.max(0, product.reservedQuantity - item.quantity),
              },
            });
          }
        }
      }

      // Si on complète la commande → déduire le stock physique
      if (status === "COMPLETED" && order.status === "CONFIRMED") {
        const items = JSON.parse(order.items || "[]");
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantity: true, reservedQuantity: true },
          });
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                quantity: Math.max(0, product.quantity - item.quantity),
                reservedQuantity: Math.max(0, product.reservedQuantity - item.quantity),
              },
            });
          }
        }
      }

      // Mettre à jour le statut
      return await tx.onlineOrder.update({
        where: { id },
        data: { status },
      });
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error("[PATCH /api/online-orders/[id]] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
