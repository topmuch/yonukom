// ============================================================
// YonuKom — API E-Commerce Orders
// Compat endpoint : conserve la forme { orders, total } mais
// interroge la DB réelle (comme /api/orders).
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/ecom-orders?businessId=xxx&status=yyy
// Si businessId absent ou "demo" → liste vide.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");

    if (!businessId || businessId === "demo") {
      return NextResponse.json({ orders: [], total: 0 });
    }

    const where: Record<string, unknown> = {
      businessId,
    };

    if (status) {
      where.status = status;
    }

    const orders = await db.order.findMany({
      where,
      include: {
        customer: true,
        orderItems: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Adapter au format attendu par l'UI e-commerce (ecomOrders).
    // L'UI consomme `orderItems` avec `productName`/`unitPrice`/`totalPrice`.
    const adapted = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      totalAmount: o.totalAmount,
      paidAmount: o.paidAmount,
      remainingAmount: o.remainingAmount,
      customerId: o.customerId,
      customer: o.customer
        ? {
            id: o.customer.id,
            name: o.customer.name,
            phone: o.customer.phone,
          }
        : null,
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
        createdAt: p.createdAt?.toISOString?.() ?? String(p.createdAt),
      })),
      paymentMethod:
        (o.payments && o.payments[0]?.method) || null,
      whatsappSent: false,
      createdAt: o.createdAt?.toISOString?.() ?? String(o.createdAt),
    }));

    return NextResponse.json({ orders: adapted, total: adapted.length });
  } catch (error) {
    console.error("[ecom-orders] GET error:", error);
    return NextResponse.json({ orders: [], total: 0 });
  }
}

// PUT /api/ecom-orders — met à jour le statut d'une commande
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body as { id?: string; status?: string };

    if (!id || !status) {
      return NextResponse.json(
        { error: "id et status sont obligatoires" },
        { status: 400 }
      );
    }

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Si on passe à to_ship ou shipped, on marque la commande comme payée
    const data: Record<string, unknown> = { status };
    if (status === "to_ship" || status === "shipped") {
      data.paidAmount = existing.totalAmount;
      data.remainingAmount = 0;
    }

    const updated = await db.order.update({
      where: { id },
      data,
      include: {
        customer: true,
        orderItems: true,
        payments: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ecom-orders] PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
