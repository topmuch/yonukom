// ============================================================
// YonuKom — API Sync Endpoint
// Reçoit les actions en attente de synchronisation
// et les rejoue sur la base de données serveur
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, entityType, entityId, payload } = body as {
      action: "create" | "update" | "delete";
      entityType: string;
      entityId?: string;
      payload: string;
    };

    // Parser le payload JSON
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(payload);
    } catch {
      return NextResponse.json(
        { error: "Payload JSON invalide" },
        { status: 400 }
      );
    }

    // Rejouer l'action sur la base de données serveur
    switch (entityType) {
      case "order":
        await syncOrder(action, entityId, data);
        break;
      case "payment":
        await syncPayment(action, entityId, data);
        break;
      case "stock_movement":
        await syncStockMovement(action, entityId, data);
        break;
      case "customer":
        await syncCustomer(action, entityId, data);
        break;
      case "product":
        await syncProduct(action, entityId, data);
        break;
      default:
        return NextResponse.json(
          { error: `Type d'entité inconnu: ${entityType}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      entityType,
      entityId,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// --- SYNC HELPERS PAR ENTITÉ ---

async function syncOrder(
  action: string,
  entityId: string | undefined,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create":
      await db.order.create({
        data: {
          id: entityId,
          orderNumber: data.orderNumber as string,
          status: (data.status as string) || "draft",
          subtotal: (data.subtotal as number) || 0,
          totalAmount: (data.totalAmount as number) || 0,
          paidAmount: (data.paidAmount as number) || 0,
          remainingAmount: (data.remainingAmount as number) || 0,
          customerId: data.customerId as string,
          businessId: data.businessId as string,
          createdBy: data.createdBy as string,
          isOfflineCreated: true,
          syncedAt: new Date(),
        },
      });
      break;
    case "update":
      if (!entityId) throw new Error("entityId requis pour update");
      await db.order.update({
        where: { id: entityId },
        data: { ...data, syncedAt: new Date() },
      });
      break;
    case "delete":
      if (!entityId) throw new Error("entityId requis pour delete");
      await db.order.delete({ where: { id: entityId } });
      break;
  }
}

async function syncPayment(
  action: string,
  entityId: string | undefined,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create":
      await db.payment.create({
        data: {
          id: entityId,
          amount: data.amount as number,
          method: data.method as string,
          reference: data.reference as string,
          isDeposit: (data.isDeposit as boolean) || false,
          orderId: data.orderId as string,
          receivedBy: data.receivedBy as string,
          isOfflineCreated: true,
          syncedAt: new Date(),
        },
      });
      break;
    case "update":
      if (!entityId) throw new Error("entityId requis pour update");
      await db.payment.update({
        where: { id: entityId },
        data: { ...data, syncedAt: new Date() },
      });
      break;
    case "delete":
      if (!entityId) throw new Error("entityId requis pour delete");
      await db.payment.delete({ where: { id: entityId } });
      break;
  }
}

async function syncStockMovement(
  action: string,
  entityId: string | undefined,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create":
      await db.stockMovement.create({
        data: {
          id: entityId,
          type: data.type as string,
          quantity: data.quantity as number,
          reason: data.reason as string,
          isLoss: (data.isLoss as boolean) || false,
          productId: data.productId as string,
          orderId: data.orderId as string,
          userId: data.userId as string,
          isOfflineCreated: true,
          syncedAt: new Date(),
        },
      });
      break;
    // update et delete similaires — omis pour la phase 1
  }
}

async function syncCustomer(
  action: string,
  entityId: string | undefined,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create":
      await db.customer.create({
        data: {
          id: entityId,
          name: data.name as string,
          phone: data.phone as string,
          email: data.email as string,
          address: data.address as string,
          paymentMethod: data.paymentMethod as string,
          isB2B: (data.isB2B as boolean) || false,
          creditLimit: data.creditLimit as number,
          businessId: data.businessId as string,
        },
      });
      break;
    case "update":
      if (!entityId) throw new Error("entityId requis pour update");
      await db.customer.update({
        where: { id: entityId },
        data,
      });
      break;
  }
}

async function syncProduct(
  action: string,
  entityId: string | undefined,
  data: Record<string, unknown>
) {
  switch (action) {
    case "create":
      await db.product.create({
        data: {
          id: entityId,
          name: data.name as string,
          sku: data.sku as string,
          salePrice: data.salePrice as number,
          purchasePrice: (data.purchasePrice as number) || 0,
          quantity: (data.quantity as number) || 0,
          reservedQuantity: (data.reservedQuantity as number) || 0,
          productType: (data.productType as string) || "standard",
          unitType: (data.unitType as string) || "piece",
          businessId: data.businessId as string,
        },
      });
      break;
    case "update":
      if (!entityId) throw new Error("entityId requis pour update");
      await db.product.update({
        where: { id: entityId },
        data,
      });
      break;
  }
}
