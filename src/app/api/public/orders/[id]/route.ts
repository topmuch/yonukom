import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Suivi de commande
// GET /api/public/orders/[id]?slug=teranga
//   → retourne le statut + détail d'une commande en ligne
//   Le slug est requis pour éviter l'énumération d'IDs :
//   on ne retourne la commande que si elle appartient au tenant
//   dont le storeSlug correspond.
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!id) {
      return NextResponse.json({ error: "ID commande requis" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json({ error: "slug requis" }, { status: 400 });
    }

    // Vérifier le tenant
    const tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: { id: true, name: true, storePrimaryColor: true, ownerPhone: true, deliveryFee: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    // Récupérer la commande — on accepte l'ID complet (cuid) ou un code court (8 premiers caractères)
    const order = await db.onlineOrder.findFirst({
      where: {
        OR: [{ id }, { id: { startsWith: id } }],
        tenantId: tenant.id,
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        deliveryAddress: true,
        deliveryMethod: true,
        deliveryFee: true,
        totalAmount: true,
        paymentMethod: true,
        status: true,
        items: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Parser les items JSON
    let parsedItems: Array<{
      name?: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      productId?: string;
    }> = [];
    try {
      parsedItems = JSON.parse(order.items || "[]");
    } catch {
      parsedItems = [];
    }

    // Timeline de suivi basée sur le statut
    const timeline = buildTimeline(order.status, order.createdAt, order.updatedAt);

    // Numéro lisible court (8 premiers caractères de l'ID)
    const orderNumber = `CMD-${order.id.slice(-6).toUpperCase()}`;

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        deliveryMethod: order.deliveryMethod,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        status: order.status,
        items: parsedItems,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      store: {
        name: tenant.name,
        primaryColor: tenant.storePrimaryColor,
        ownerPhone: tenant.ownerPhone,
      },
      timeline,
    });
  } catch (error) {
    console.error("[GET /api/public/orders/[id]] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Construit la timeline de suivi selon le statut de la commande
function buildTimeline(status: string, createdAt: Date, updatedAt: Date) {
  const steps = [
    { key: "PENDING", label: "Commande reçue", desc: "Le vendeur a reçu votre commande", icon: "clipboard" },
    { key: "CONFIRMED", label: "Commande confirmée", desc: "Le vendeur a confirmé votre commande", icon: "check" },
    { key: "COMPLETED", label: "Commande terminée", desc: "Votre commande est prête/livrée", icon: "truck" },
  ];
  const cancelled = status === "CANCELLED";

  if (cancelled) {
    return {
      steps,
      cancelled: true,
      currentStep: -1,
      createdAt,
      updatedAt,
    };
  }

  const order_keys = ["PENDING", "CONFIRMED", "COMPLETED"];
  const currentStep = Math.max(0, order_keys.indexOf(status));
  return {
    steps,
    cancelled: false,
    currentStep,
    createdAt,
    updatedAt,
  };
}
