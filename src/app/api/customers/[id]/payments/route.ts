// ============================================================
// YonuKom — API Customer Payments (encaissement sur dette)
// POST /api/customers/:id/payments
// Body: { businessId, amount, paymentMethod, orderId?, reference? }
// Si orderId fourni → applique à cette commande, sinon répartit sur
// la plus ancienne commande non soldée en premier.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface PaymentResult {
  orderId: string;
  orderNumber: string;
  appliedAmount: number;
  newPaidAmount: number;
  newRemaining: number;
}

// POST /api/customers/:id/payments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      businessId,
      amount,
      paymentMethod,
      orderId,
      reference,
      receivedBy,
    } = body as {
      businessId?: string;
      amount?: number | string;
      paymentMethod?: string;
      orderId?: string;
      reference?: string;
      receivedBy?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "amount est obligatoire" },
        { status: 400 }
      );
    }

    const numericAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (numericAmount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }

    const method = paymentMethod || "cash";
    const allowedMethods = [
      "cash",
      "wave",
      "orange_money",
      "cb",
      "cheque",
      "virement",
    ];
    if (!allowedMethods.includes(method)) {
      return NextResponse.json(
        { error: `Moyen de paiement invalide. Acceptés: ${allowedMethods.join(", ")}` },
        { status: 400 }
      );
    }

    // 1. Vérifier que le client existe et appartient au business
    const customer = await db.customer.findUnique({
      where: { id },
      select: { id: true, name: true, businessId: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Client introuvable" },
        { status: 404 }
      );
    }

    if (customer.businessId !== businessId) {
      return NextResponse.json(
        { error: "Accès refusé : ce client n'appartient pas à votre business" },
        { status: 403 }
      );
    }

    // 2. Déterminer l'ordre d'application
    let targetOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      paidAmount: number;
      status: string;
    }> = [];

    if (orderId) {
      const order = await db.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
          customerId: true,
          businessId: true,
          isCancelled: true,
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable" },
          { status: 404 }
        );
      }

      if (order.businessId !== businessId || order.customerId !== id) {
        return NextResponse.json(
          { error: "Cette commande n'appartient pas à ce client/business" },
          { status: 403 }
        );
      }

      if (order.isCancelled) {
        return NextResponse.json(
          { error: "Impossible d'encaisser sur une commande annulée" },
          { status: 400 }
        );
      }

      targetOrders = [order];
    } else {
      // Récupère toutes les commandes non annulées avec reste > 0, de la plus ancienne à la plus récente
      const orders = await db.order.findMany({
        where: {
          customerId: id,
          businessId,
          isCancelled: false,
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          paidAmount: true,
          status: true,
        },
      });

      targetOrders = orders.filter(
        (o) => o.totalAmount - o.paidAmount > 0
      );
    }

    if (targetOrders.length === 0) {
      return NextResponse.json(
        { error: "Aucune commande à régler pour ce client" },
        { status: 400 }
      );
    }

    // 3. Transaction : appliquer le paiement aux commandes
    const paymentsCreated: PaymentResult[] = [];
    let remainingAmount = numericAmount;

    await db.$transaction(async (tx) => {
      for (const order of targetOrders) {
        if (remainingAmount <= 0) break;

        const orderRemaining = order.totalAmount - order.paidAmount;
        if (orderRemaining <= 0) continue;

        const applied = Math.min(remainingAmount, orderRemaining);

        // Créer le paiement
        await tx.payment.create({
          data: {
            amount: applied,
            method,
            orderId: order.id,
            reference: reference || null,
            isDeposit: applied < orderRemaining,
            receivedBy: receivedBy || null,
          },
        });

        const newPaid = order.paidAmount + applied;
        const newRemaining = order.totalAmount - newPaid;

        // Update order paidAmount + remainingAmount + status si soldé
        const updateData: Record<string, unknown> = {
          paidAmount: newPaid,
          remainingAmount: newRemaining,
        };

        // Auto-transition : si plus de reste à payer et statut "to_pay" → "to_ship"
        if (newRemaining <= 0 && order.status === "to_pay") {
          updateData.status = "to_ship";
        }

        await tx.order.update({
          where: { id: order.id },
          data: updateData,
        });

        paymentsCreated.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          appliedAmount: applied,
          newPaidAmount: newPaid,
          newRemaining,
        });

        remainingAmount -= applied;
      }
    });

    // 4. Calculer le résumé de dette mis à jour
    const allRemainingOrders = await db.order.findMany({
      where: { customerId: id, isCancelled: false },
      select: { totalAmount: true, paidAmount: true, createdAt: true },
    });

    const stillDebts = allRemainingOrders.filter(
      (o) => o.totalAmount - o.paidAmount > 0
    );
    const remainingTotalDebt = stillDebts.reduce(
      (sum, o) => sum + (o.totalAmount - o.paidAmount),
      0
    );
    const oldestDebtDays =
      stillDebts.length > 0
        ? Math.floor(
            (Date.now() - new Date(stillDebts[0].createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;

    const excessAmount = remainingAmount > 0 ? remainingAmount : 0;

    return NextResponse.json(
      {
        success: true,
        customerId: id,
        customerName: customer.name,
        amountRequested: numericAmount,
        amountApplied: numericAmount - remainingAmount,
        excessAmount,
        payments: paymentsCreated,
        debtSummary: {
          totalDebt: remainingTotalDebt,
          debtCount: stillDebts.length,
          oldestDebtDays,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Customers/:id/payments] POST error:", error);
    return NextResponse.json(
      { error: "Échec de l'enregistrement du paiement" },
      { status: 500 }
    );
  }
}
