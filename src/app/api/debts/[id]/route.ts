// ============================================================
// YonuKom — API Dette individuelle
// GET    /api/debts/:id            → dette seule (avec client)
// PATCH  /api/debts/:id            → ajout d'un paiement OU mise à jour des champs
// DELETE /api/debts/:id            → supprime la dette
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method: string;
  reference?: string;
}

function parsePaymentHistory(raw: string | null | undefined): PaymentHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PaymentHistoryEntry[];
  } catch {
    return [];
  }
}

function serializePaymentHistory(entries: PaymentHistoryEntry[]): string {
  return JSON.stringify(entries);
}

// GET /api/debts/:id?businessId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est requis" },
        { status: 400 }
      );
    }

    const debt = await db.debt.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            isB2B: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paidAmount: true,
          },
        },
      },
    });

    if (!debt) {
      return NextResponse.json(
        { error: "Dette introuvable" },
        { status: 404 }
      );
    }

    if (debt.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : cette dette n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error("[Debts/:id] GET error:", error);
    return NextResponse.json(
      { error: "Échec de la récupération de la dette" },
      { status: 500 }
    );
  }
}

// PATCH /api/debts/:id
// Body pour encaisser un paiement : { businessId, paidAmount, paymentMethod, paymentDate?, reference? }
// Body pour mise à jour simple : { businessId, amount?, debtDate?, expectedPaymentDate?, notes?, status? }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      businessId,
      // Mode "paiement" :
      paidAmount,
      paymentMethod,
      paymentDate,
      reference,
      // Mode "mise à jour" :
      amount,
      debtDate,
      expectedPaymentDate,
      notes,
      status,
    } = body as {
      businessId?: string;
      paidAmount?: number | string;
      paymentMethod?: string;
      paymentDate?: string;
      reference?: string;
      amount?: number | string;
      debtDate?: string;
      expectedPaymentDate?: string | null;
      notes?: string | null;
      status?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    const existing = await db.debt.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Dette introuvable" },
        { status: 404 }
      );
    }

    if (existing.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : cette dette n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    // --- Mode "Encaisser un paiement" : paidAmount + paymentMethod ---
    // On regarde explicitement paidAmount pour distinguer un vrai paiement
    if (paidAmount !== undefined) {
      const paymentAmt = Number(paidAmount);
      if (!Number.isFinite(paymentAmt) || paymentAmt <= 0) {
        return NextResponse.json(
          { error: "paidAmount doit être un entier positif (FCFA)" },
          { status: 400 }
        );
      }
      const method = paymentMethod && typeof paymentMethod === "string" ? paymentMethod : "cash";

      const newPaidAmount = Math.min(
        existing.amount,
        existing.paidAmount + Math.floor(paymentAmt)
      );
      const newStatus =
        newPaidAmount >= existing.amount
          ? "paid"
          : newPaidAmount > 0
          ? "partial"
          : "active";

      const history = parsePaymentHistory(existing.paymentHistory);
      history.push({
        date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        amount: Math.floor(paymentAmt),
        method,
        reference: reference || undefined,
      });

      const updated = await db.debt.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
          paymentHistory: serializePaymentHistory(history),
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
              isB2B: true,
            },
          },
        },
      });

      return NextResponse.json({
        ...updated,
        paymentApplied: Math.floor(paymentAmt),
        newStatus,
      });
    }

    // --- Mode "mise à jour des champs" ---
    const updateData: Record<string, unknown> = {};

    if (amount !== undefined) {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        return NextResponse.json(
          { error: "amount doit être un entier positif (FCFA)" },
          { status: 400 }
        );
      }
      updateData.amount = Math.floor(amt);
    }

    if (debtDate !== undefined) {
      const d = new Date(debtDate);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "debtDate invalide" },
          { status: 400 }
        );
      }
      updateData.debtDate = d;
    }

    if (expectedPaymentDate !== undefined) {
      if (expectedPaymentDate === null || expectedPaymentDate === "") {
        updateData.expectedPaymentDate = null;
      } else {
        const d = new Date(expectedPaymentDate);
        if (!isNaN(d.getTime())) {
          updateData.expectedPaymentDate = d;
        }
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes ? String(notes).slice(0, 1000) : null;
    }

    if (status !== undefined) {
      if (!["active", "partial", "paid"].includes(status)) {
        return NextResponse.json(
          { error: "status invalide (active | partial | paid)" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const updated = await db.debt.update({
      where: { id },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            address: true,
            isB2B: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Debts/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Échec de la mise à jour de la dette" },
      { status: 500 }
    );
  }
}

// DELETE /api/debts/:id?businessId=xxx
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
        { error: "businessId est requis" },
        { status: 400 }
      );
    }

    const existing = await db.debt.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Dette introuvable" },
        { status: 404 }
      );
    }

    if (existing.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : cette dette n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    await db.debt.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("[Debts/:id] DELETE error:", error);
    return NextResponse.json(
      { error: "Échec de la suppression de la dette" },
      { status: 500 }
    );
  }
}
