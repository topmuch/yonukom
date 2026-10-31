// ============================================================
// YonuKom — API Purchases (Achats / Bons de commande)
// GET  /api/purchases?businessId=xxx&status=xxx — liste les achats
// POST /api/purchases — crée un nouvel achat (référence auto BC-YYYY-NNNN)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/purchases?businessId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const status = searchParams.get("status");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const purchases = await db.purchase.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
      },
      orderBy: { orderDate: "desc" },
      take: 100,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("[Purchases] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des achats" },
      { status: 500 }
    );
  }
}

// POST /api/purchases — crée un nouvel achat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      supplierId,
      reference,
      items,
      notes,
      orderDate,
      status,
    } = body as {
      businessId?: string;
      supplierId?: string;
      reference?: string;
      items?: Array<{
        productId?: string;
        productName?: string;
        quantity?: number;
        unitPrice?: number;
      }>;
      notes?: string;
      orderDate?: string;
      status?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Au moins un article est requis" },
        { status: 400 }
      );
    }

    // Valider et normaliser les items
    const normalizedItems = items.map((it) => {
      const quantity = Number(it.quantity) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      const totalPrice = quantity * unitPrice;
      return {
        productId: it.productId?.trim() || null,
        productName: (it.productName?.trim() || "Produit sans nom").slice(0, 200),
        quantity,
        unitPrice,
        totalPrice,
      };
    });

    // Valider que tous les items ont une quantité positive
    if (normalizedItems.some((it) => it.quantity <= 0)) {
      return NextResponse.json(
        { error: "Tous les articles doivent avoir une quantité positive" },
        { status: 400 }
      );
    }

    const totalAmount = normalizedItems.reduce(
      (sum, it) => sum + it.totalPrice,
      0
    );

    // --- Génération de la référence BC-YYYY-NNNN ---
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const countThisYear = await db.purchase.count({
      where: {
        businessId,
        orderDate: { gte: yearStart, lt: yearEnd },
      },
    });

    let finalReference =
      typeof reference === "string" && reference.trim().length > 0
        ? reference.trim()
        : `BC-${year}-${String(countThisYear + 1).padStart(4, "0")}`;

    // Vérifier l'unicité (au cas où) — si collision, incrémenter
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.purchase.findUnique({
        where: {
          businessId_reference: { businessId, reference: finalReference },
        },
        select: { id: true },
      });
      if (!existing) break;
      attempts += 1;
      const altSeq = String(countThisYear + 1 + attempts).padStart(4, "0");
      finalReference = `BC-${year}-${altSeq}`;
    }

    // Si supplierId fourni, vérifier qu'il appartient bien au business
    if (supplierId) {
      const supplier = await db.supplier.findFirst({
        where: { id: supplierId, businessId },
        select: { id: true },
      });
      if (!supplier) {
        return NextResponse.json(
          { error: "Fournisseur invalide ou accès refusé" },
          { status: 400 }
        );
      }
    }

    // --- Création transactionnelle de l'achat + items ---
    const purchase = await db.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          businessId,
          supplierId: supplierId || null,
          reference: finalReference,
          status: status || "ordered",
          totalAmount,
          paidAmount: 0,
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          receivedDate: null,
          notes: notes?.trim() || null,
          items: {
            create: normalizedItems.map((it) => ({
              productId: it.productId || null,
              productName: it.productName,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
            })),
          },
        },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: true,
        },
      });

      // Mettre à jour le solde dû du fournisseur
      if (supplierId && totalAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { outstandingBalance: { increment: totalAmount } },
        });
      }

      return created;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("[Purchases] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de l'achat" },
      { status: 500 }
    );
  }
}
