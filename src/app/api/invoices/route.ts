// ============================================================
// YonuKom — API Invoices
// GET  /api/invoices?businessId=xxx — liste les factures du business
// POST /api/invoices — crée une nouvelle facture (numéro auto FAC-YYYY-NNNN)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/invoices?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const invoices = await db.invoice.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("[Invoices] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des factures" },
      { status: 500 }
    );
  }
}

// POST /api/invoices — crée une nouvelle facture
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      customerId,
      orderId,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      notes,
      itemsJson,
      dueDate,
      status,
      paidAmount,
    } = body as {
      businessId?: string;
      customerId?: string;
      orderId?: string;
      subtotal?: number | string;
      taxRate?: number | string;
      taxAmount?: number | string;
      totalAmount?: number | string;
      notes?: string;
      itemsJson?: string;
      dueDate?: string;
      status?: string;
      paidAmount?: number | string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (subtotal === undefined || totalAmount === undefined) {
      return NextResponse.json(
        { error: "subtotal et totalAmount sont obligatoires" },
        { status: 400 }
      );
    }

    // --- Génération du numéro de facture FAC-YYYY-NNNN ---
    const year = new Date().getFullYear();
    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const countThisYear = await db.invoice.count({
      where: {
        businessId,
        createdAt: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
    });

    const seq = String(countThisYear + 1).padStart(4, "0");
    const number = `FAC-${year}-${seq}`;

    // Vérifier l'unicité (au cas où) — si collision, incrémenter
    let finalNumber = number;
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db.invoice.findUnique({
        where: {
          businessId_number: { businessId, number: finalNumber },
        },
        select: { id: true },
      });
      if (!existing) break;
      attempts += 1;
      const altSeq = String(countThisYear + 1 + attempts).padStart(4, "0");
      finalNumber = `FAC-${year}-${altSeq}`;
    }

    const invoice = await db.invoice.create({
      data: {
        businessId,
        number: finalNumber,
        orderId: orderId || null,
        customerId: customerId || null,
        subtotal: Number(subtotal) || 0,
        taxRate: Number(taxRate) || 0,
        taxAmount: Number(taxAmount) || 0,
        totalAmount: Number(totalAmount) || 0,
        paidAmount: Number(paidAmount) || 0,
        status: status || "draft",
        notes: notes || null,
        itemsJson:
          typeof itemsJson === "string" ? itemsJson : JSON.stringify(itemsJson || []),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("[Invoices] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de la facture" },
      { status: 500 }
    );
  }
}
