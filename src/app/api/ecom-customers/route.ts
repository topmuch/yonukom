// ============================================================
// YonuKom — API E-Commerce Customers
// Compat endpoint : conserve la forme { customers, total } mais
// interroge la DB réelle (comme /api/customers).
// Nouveau business = liste vide (pas de données démo).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/ecom-customers?businessId=xxx&search=yyy
// Si businessId absent ou "demo" → liste vide.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const search = searchParams.get("search");

    if (!businessId || businessId === "demo") {
      return NextResponse.json({ customers: [], total: 0 });
    }

    const where: Record<string, unknown> = {
      businessId,
      isB2B: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const customers = await db.customer.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customers, total: customers.length });
  } catch (error) {
    console.error("[ecom-customers] GET error:", error);
    return NextResponse.json({ customers: [], total: 0 });
  }
}

// POST /api/ecom-customers — crée un nouveau client B2B
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      businessId,
      email,
      address,
      paymentMethod,
      isB2B,
      creditLimit,
    } = body as {
      name?: string;
      phone?: string;
      businessId?: string;
      email?: string;
      address?: string;
      paymentMethod?: string;
      isB2B?: boolean;
      creditLimit?: number;
    };

    if (!name || !phone || !businessId || businessId === "demo") {
      return NextResponse.json(
        { error: "Champs obligatoires manquants : name, phone, businessId" },
        { status: 400 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        businessId: String(businessId),
        email: email || null,
        address: address || null,
        paymentMethod: paymentMethod || "cash",
        isB2B: isB2B ?? true,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("[ecom-customers] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
