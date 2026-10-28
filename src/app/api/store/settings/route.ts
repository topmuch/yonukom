import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/store/settings?businessId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) return NextResponse.json({ error: "businessId requis" }, { status: 400 });

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { tenantId: true },
    });
    if (!business?.tenantId) return NextResponse.json({ error: "Aucun tenant" }, { status: 404 });

    const tenant = await db.tenant.findUnique({
      where: { id: business.tenantId },
      select: {
        id: true, name: true, storeSlug: true, isStoreActive: true,
        storeLogoUrl: true, storeBannerUrl: true, storePrimaryColor: true,
        allowPickup: true, allowDelivery: true, deliveryFee: true,
      },
    });
    if (!tenant) return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    return NextResponse.json({ store: tenant });
  } catch (error) {
    console.error("[GET /api/store/settings] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/store/settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, storeSlug, isStoreActive, storePrimaryColor, allowPickup, allowDelivery, deliveryFee } = body;
    if (!businessId) return NextResponse.json({ error: "businessId requis" }, { status: 400 });

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { tenantId: true },
    });
    if (!business?.tenantId) return NextResponse.json({ error: "Aucun tenant" }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (typeof storeSlug === "string") {
      const slug = storeSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      if (slug) {
        const existing = await db.tenant.findFirst({
          where: { storeSlug: slug, NOT: { id: business.tenantId! } },
          select: { id: true },
        });
        if (existing) return NextResponse.json({ error: "Ce slug est déjà utilisé" }, { status: 409 });
        data.storeSlug = slug;
      } else {
        data.storeSlug = null;
      }
    }
    if (typeof isStoreActive === "boolean") data.isStoreActive = isStoreActive;
    if (typeof storePrimaryColor === "string") data.storePrimaryColor = storePrimaryColor;
    if (typeof allowPickup === "boolean") data.allowPickup = allowPickup;
    if (typeof allowDelivery === "boolean") data.allowDelivery = allowDelivery;
    if (typeof deliveryFee === "number") data.deliveryFee = Math.max(0, Math.floor(deliveryFee));

    if (Object.keys(data).length === 0) return NextResponse.json({ error: "Aucune mise à jour" }, { status: 400 });

    const updated = await db.tenant.update({
      where: { id: business.tenantId },
      data,
      select: { id: true, name: true, storeSlug: true, isStoreActive: true, storePrimaryColor: true, allowPickup: true, allowDelivery: true, deliveryFee: true },
    });
    return NextResponse.json({ success: true, store: updated });
  } catch (error) {
    console.error("[PUT /api/store/settings] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
