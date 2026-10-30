// ============================================================
// YonuKom — API Purchase (single)
// GET   /api/purchases/[id]?businessId=xxx  — single purchase with items
// PATCH /api/purchases/[id]                 — update status, restock on received
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/purchases/[id]?businessId=xxx
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const purchase = await db.purchase.findFirst({
      where: { id, businessId },
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, unitType: true },
            },
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "Achat introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(purchase);
  } catch (error) {
    console.error("[Purchase] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération de l'achat" },
      { status: 500 }
    );
  }
}

// PATCH /api/purchases/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      businessId,
      status,
      paidAmount,
      notes,
      receivedDate,
      supplierId,
    } = body as {
      businessId?: string;
      status?: string;
      paidAmount?: number;
      notes?: string;
      receivedDate?: string | null;
      supplierId?: string | null;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier ownership
    const existing = await db.purchase.findFirst({
      where: { id, businessId },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Achat introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    const allowedStatuses = [
      "draft",
      "ordered",
      "received",
      "paid",
      "cancelled",
    ];
    const newStatus =
      status && allowedStatuses.includes(status) ? status : existing.status;

    // Déterminer si on doit effectuer le restock
    const willBecomeReceived =
      newStatus === "received" && existing.status !== "received";

    const updated = await db.$transaction(async (tx) => {
      // Restock des produits si on passe à "received"
      if (willBecomeReceived) {
        for (const item of existing.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      // Si devient "paid" : solder le solde dû du fournisseur
      if (newStatus === "paid" && existing.status !== "paid" && existing.supplierId) {
        const remainingToPay = existing.totalAmount - existing.paidAmount;
        if (remainingToPay > 0 && existing.supplierId) {
          await tx.supplier.update({
            where: { id: existing.supplierId },
            data: { outstandingBalance: { decrement: remainingToPay } },
          });
        }
      }

      const result = await tx.purchase.update({
        where: { id },
        data: {
          ...(status !== undefined && { status: newStatus }),
          ...(paidAmount !== undefined && {
            paidAmount: Number(paidAmount) || 0,
          }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
          ...(receivedDate !== undefined && {
            receivedDate: receivedDate ? new Date(receivedDate) : null,
          }),
          ...(willBecomeReceived &&
            !existing.receivedDate && { receivedDate: new Date() }),
          ...(supplierId !== undefined && {
            supplierId: supplierId || null,
          }),
        },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: true,
        },
      });

      return result;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Purchase] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de l'achat" },
      { status: 500 }
    );
  }
}
