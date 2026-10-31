// ============================================================
// YonuKom — API Suppliers (Fournisseurs)
// GET  /api/suppliers?businessId=xxx — liste tous les fournisseurs
// POST /api/suppliers — crée un nouveau fournisseur
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/suppliers?businessId=xxx
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

    const suppliers = await db.supplier.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        businessId: true,
        name: true,
        phone: true,
        email: true,
        address: true,
        outstandingBalance: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("[Suppliers] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des fournisseurs" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers — crée un nouveau fournisseur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      name,
      phone,
      email,
      address,
      notes,
    } = body as {
      businessId?: string;
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du fournisseur est obligatoire" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.create({
      data: {
        businessId,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("[Suppliers] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création du fournisseur" },
      { status: 500 }
    );
  }
}
