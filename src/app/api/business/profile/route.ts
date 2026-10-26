import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/business/profile?businessId=xxx — retourne le profil du commerce
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        currency: true,
        logoUrl: true,
      },
    });
    if (!business) {
      return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
    }
    return NextResponse.json(business);
  } catch (error) {
    console.error("[GET /api/business/profile] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/business/profile — met à jour le profil du commerce
// Body: { businessId, name?, phone?, email?, address?, city?, country?, logoUrl? }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, name, phone, email, address, city, country, logoUrl } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    // Vérifier que le business existe
    const existing = await db.business.findUnique({ where: { id: businessId } });
    if (!existing) {
      return NextResponse.json({ error: "Commerce introuvable" }, { status: 404 });
    }

    // Construire l'objet de mise à jour (uniquement les champs fournis)
    const data: Record<string, string | null> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 200);
    if (typeof phone === "string") data.phone = phone.trim().slice(0, 50) || null;
    if (typeof email === "string") data.email = email.trim().slice(0, 200) || null;
    if (typeof address === "string") data.address = address.trim().slice(0, 500) || null;
    if (typeof city === "string") data.city = city.trim().slice(0, 100) || null;
    if (typeof country === "string" && country.trim()) data.country = country.trim().slice(0, 10);
    if (typeof logoUrl === "string") {
      // Logo peut être long (base64 si upload direct) — on limite à 5MB en base64
      data.logoUrl = logoUrl.slice(0, 7_000_000) || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune mise à jour fournie" }, { status: 400 });
    }

    const updated = await db.business.update({
      where: { id: businessId },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        country: true,
        currency: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({ success: true, business: updated });
  } catch (error) {
    console.error("[PUT /api/business/profile] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
