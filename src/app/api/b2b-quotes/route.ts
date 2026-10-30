// ============================================================
// YonuKom — API B2B Quotes (Pipeline B2B)
// Retourne les devis/commandes B2B du commerce (filtré par businessId).
// Statuts B2B : "draft" | "quote_validated" | "delivery_note" | "invoiced"
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const B2B_STATUSES = ["draft", "quote_validated", "delivery_note", "invoiced"];

// GET /api/b2b-quotes?businessId=xxx
// Si businessId absent ou "demo" → liste vide.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId || businessId === "demo") {
      return NextResponse.json([]);
    }

    const orders = await db.order.findMany({
      where: {
        businessId,
        status: { in: B2B_STATUSES },
      },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Adapter au format B2BQuote attendu par l'UI Pipeline.
    const adapted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      subtotal: o.subtotal,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      remainingAmount: o.remainingAmount,
      deliveryAddress: o.deliveryAddress ?? undefined,
      deliveryDate: o.deliveryDate?.toISOString?.() ?? null,
      isDelivered: o.isDelivered,
      isCancelled: o.isCancelled,
      whatsappSent: o.whatsappSent,
      isOfflineCreated: o.isOfflineCreated,
      businessId: o.businessId,
      customerId: o.customerId,
      customer: o.customer
        ? {
            id: o.customer.id,
            name: o.customer.name,
            phone: o.customer.phone,
            isB2B: o.customer.isB2B,
            creditLimit: o.customer.creditLimit ?? undefined,
          }
        : { id: "", name: "Client", phone: "", isB2B: true },
      orderItems: o.orderItems.map((oi) => ({
        id: oi.id,
        productName: oi.product?.name ?? "Article",
        quantity: oi.quantity,
        unitPrice: oi.unitPrice,
        totalPrice: oi.totalPrice,
      })),
      payments: (o.payments ?? []).map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        paidAt: p.createdAt?.toISOString?.() ?? null,
      })),
      createdAt: o.createdAt?.toISOString?.() ?? String(o.createdAt),
      updatedAt: o.updatedAt?.toISOString?.() ?? String(o.updatedAt),
    }));

    return NextResponse.json(adapted);
  } catch (error) {
    console.error("[b2b-quotes] GET error:", error);
    return NextResponse.json([]);
  }
}
