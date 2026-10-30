// ============================================================
// YonuKom — API Invoice by ID
// GET    /api/invoices/:id — détail facture (avec customer + order)
// PATCH  /api/invoices/:id — màj status, paidAmount, notes
// DELETE /api/invoices/:id — supprime la facture
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invoices/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: {
          include: {
            orderItems: { include: { product: true } },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("[Invoices/:id] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération de la facture" },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/:id
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { businessId, status, paidAmount, notes } = body as {
      businessId?: string;
      status?: string;
      paidAmount?: number | string;
      notes?: string;
    };

    // Vérifier que la facture existe ET appartient au business
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    if (businessId && existing.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : cette facture n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      const allowedStatuses = ["draft", "sent", "paid", "partial", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Statut invalide. Valeurs acceptées: ${allowedStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Si on passe en "paid", on met paidAmount = totalAmount automatiquement
      if (status === "paid") {
        updateData.paidAmount = existing.totalAmount;
      }
    }

    if (paidAmount !== undefined) {
      const newPaid = Number(paidAmount) || 0;
      updateData.paidAmount = newPaid;
      // Auto-statut basé sur le montant payé
      if (newPaid <= 0) {
        updateData.status = "draft";
      } else if (newPaid >= existing.totalAmount) {
        updateData.status = "paid";
      } else {
        updateData.status = "partial";
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updated = await db.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Invoices/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la facture" },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Facture introuvable" },
        { status: 404 }
      );
    }

    if (businessId && existing.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    await db.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[Invoices/:id] DELETE error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression de la facture" },
      { status: 500 }
    );
  }
}
