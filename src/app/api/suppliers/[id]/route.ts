// ============================================================
// YonuKom — API Supplier (single)
// GET    /api/suppliers/[id]    — fetch single supplier
// PATCH  /api/suppliers/[id]    — update supplier fields
// DELETE /api/suppliers/[id]    — soft delete (isActive=false) or hard delete if no purchases
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

// GET /api/suppliers/[id]?businessId=xxx
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

    const supplier = await db.supplier.findFirst({
      where: { id, businessId },
      include: {
        purchases: {
          orderBy: { orderDate: "desc" },
          take: 20,
          select: {
            id: true,
            reference: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            orderDate: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Fournisseur introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("[Supplier] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération du fournisseur" },
      { status: 500 }
    );
  }
}

// PATCH /api/suppliers/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      businessId,
      name,
      phone,
      email,
      address,
      notes,
      isActive,
      outstandingBalance,
    } = body as {
      businessId?: string;
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      notes?: string | null;
      isActive?: boolean;
      outstandingBalance?: number;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier que le fournisseur appartient bien au business
    const existing = await db.supplier.findFirst({
      where: { id, businessId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Fournisseur introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    const updated = await db.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(outstandingBalance !== undefined && {
          outstandingBalance: Number(outstandingBalance) || 0,
        }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Supplier] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour du fournisseur" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id]?businessId=xxx
export async function DELETE(request: NextRequest, { params }: Params) {
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

    // Vérifier ownership
    const existing = await db.supplier.findFirst({
      where: { id, businessId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Fournisseur introuvable ou accès refusé" },
        { status: 404 }
      );
    }

    // Vérifier s'il y a des achats liés
    const purchaseCount = await db.purchase.count({
      where: { supplierId: id },
    });

    if (purchaseCount > 0) {
      // Soft delete — on garde les achats historiques liés
      const softDeleted = await db.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        action: "soft_delete",
        supplier: softDeleted,
        message: `Fournisseur désactivé (${purchaseCount} achat(s) historique(s) conservé(s)).`,
      });
    }

    // Hard delete si aucune dépendance
    await db.supplier.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      action: "hard_delete",
      message: "Fournisseur supprimé définitivement.",
    });
  } catch (error) {
    console.error("[Supplier] DELETE error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression du fournisseur" },
      { status: 500 }
    );
  }
}
