import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================
// API PUBLIQUE — Création de commande depuis la boutique en ligne
// POST /api/public/orders
//
// ⚠️ RÈGLE CRITIQUE : Réservation de stock ATOMIQUE
// Pour chaque produit commandé :
//   1. Vérifier que available_quantity >= quantity demandée
//   2. Déduire de available_quantity
//   3. Ajouter à reserved_quantity
//   4. Tout dans une transaction (si un produit échoue, tout est annulé)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryMethod, // "PICKUP" ou "DELIVERY"
      paymentMethod, // "CASH_ON_DELIVERY" ou "WAVE_OM_LINK"
      items: rawItems, // [{ productId, quantity }]
    } = body;

    // --- Validation ---
    if (!tenantId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "tenantId, customerName et customerPhone sont obligatoires" },
        { status: 400 }
      );
    }

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json(
        { error: "Le panier ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Valider le téléphone (au moins 9 chiffres)
    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (phoneDigits.length < 9) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide" },
        { status: 400 }
      );
    }

    // --- Récupérer le tenant + vérifier que la boutique est active ---
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        ownerPhone: true,
        isStoreActive: true,
        allowPickup: true,
        allowDelivery: true,
        deliveryFee: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Boutique introuvable" },
        { status: 404 }
      );
    }

    if (!tenant.isStoreActive) {
      return NextResponse.json(
        { error: "Cette boutique est temporairement fermée" },
        { status: 403 }
      );
    }

    // Valider le mode de livraison
    if (deliveryMethod === "DELIVERY" && !tenant.allowDelivery) {
      return NextResponse.json(
        { error: "La livraison n'est pas disponible pour cette boutique" },
        { status: 400 }
      );
    }
    if (deliveryMethod === "PICKUP" && !tenant.allowPickup) {
      return NextResponse.json(
        { error: "Le retrait en boutique n'est pas disponible" },
        { status: 400 }
      );
    }

    // --- TRANSACTION ATOMIQUE : réservation du stock ---
    const result = await db.$transaction(async (tx) => {
      // 1. Récupérer tous les produits demandés + vérifier le stock
      const productIds = rawItems.map((item: any) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          // Les produits appartiennent à un business du tenant
          business: { tenantId },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          salePrice: true,
          quantity: true,
          reservedQuantity: true,
        },
      });

      // 2. Vérifier que tous les produits existent et ont assez de stock
      const productMap = new Map(products.map((p) => [p.id, p]));
      const orderItems: Array<{
        productId: string;
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }> = [];

      let productsTotal = 0;

      for (const item of rawItems) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Produit introuvable: ${item.productId}`);
        }

        const requestedQty = parseInt(item.quantity, 10);
        if (isNaN(requestedQty) || requestedQty <= 0) {
          throw new Error(`Quantité invalide pour ${product.name}`);
        }

        // available = quantity - reservedQuantity
        const available = product.quantity - product.reservedQuantity;
        if (available < requestedQty) {
          throw new Error(
            `Stock insuffisant pour "${product.name}". Disponible: ${available}, demandé: ${requestedQty}`
          );
        }

        const lineTotal = product.salePrice * requestedQty;
        productsTotal += lineTotal;

        orderItems.push({
          productId: product.id,
          name: product.name,
          quantity: requestedQty,
          unitPrice: product.salePrice,
          totalPrice: lineTotal,
        });

        // 3. Réserver le stock : déduire de available, ajouter à reserved
        await tx.product.update({
          where: { id: product.id },
          data: {
            reservedQuantity: product.reservedQuantity + requestedQty,
          },
        });
      }

      // 4. Calculer le total avec frais de livraison
      const deliveryFee =
        deliveryMethod === "DELIVERY" ? tenant.deliveryFee : 0;
      const totalAmount = productsTotal + deliveryFee;

      // 5. Créer l'OnlineOrder
      const onlineOrder = await tx.onlineOrder.create({
        data: {
          tenantId,
          customerName,
          customerPhone,
          deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress : null,
          deliveryMethod,
          deliveryFee,
          totalAmount,
          paymentMethod,
          status: "PENDING",
          items: JSON.stringify(orderItems),
        },
      });

      return { onlineOrder, totalAmount, orderItems };
    });

    // --- Notification WhatsApp au vendeur (optionnel V1) ---
    // Génère un lien wa.me vers le propriétaire du tenant
    const ownerPhone = tenant.ownerPhone.replace(/\D/g, "");
    const normalizedOwnerPhone = ownerPhone.startsWith("221")
      ? ownerPhone
      : ownerPhone.length === 9 && /^[789]/.test(ownerPhone)
      ? "221" + ownerPhone
      : ownerPhone;

    const notificationMessage = `🛒 Nouvelle commande en ligne!\n\nClient: ${customerName}\nTéléphone: ${customerPhone}\nArticles: ${result.orderItems.length}\nTotal: ${result.totalAmount} FCFA\nMode: ${deliveryMethod === "DELIVERY" ? "Livraison" : "Retrait"}\n\nConnectez-vous à YonuKom pour confirmer.`;

    const waMeUrl = `https://wa.me/${normalizedOwnerPhone}?text=${encodeURIComponent(notificationMessage)}`;

    // Logger la notification (non-bloquant)
    try {
      await db.notificationLog.create({
        data: {
          businessId: tenant.id, // utilise tenantId comme businessId pour le log
          recipient: normalizedOwnerPhone,
          type: "online_order",
          message: notificationMessage,
          channel: "wa_me_link",
          status: "pending",
          waMeUrl,
          metadata: JSON.stringify({
            onlineOrderId: result.onlineOrder.id,
            totalAmount: result.totalAmount,
          }),
        },
      });
    } catch {
      // Non-bloquant — le log ne doit pas faire échouer la commande
    }

    return NextResponse.json({
      success: true,
      orderId: result.onlineOrder.id,
      totalAmount: result.totalAmount,
      waMeUrl, // Lien WhatsApp pour notifier le vendeur
      message: "Commande créée avec succès. Le vendeur va vous contacter.",
    });
  } catch (error: any) {
    console.error("[POST /api/public/orders] error:", error);

    // Si c'est une erreur de stock, retourner un message clair
    if (error.message?.includes("Stock insuffisant")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error.message?.includes("Produit introuvable")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 }
    );
  }
}
