import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";
import {
  normalizeModules,
  toggleModule,
  type ModuleId,
} from "@/lib/modules/module-utils";
import { MODULE_IDS } from "@/lib/modules/module-config";

// ============================================================
// YonuKom — API Modules du Tenant (côté client)
// GET  /api/tenant/modules?businessId=xxx — récupère les modules
// PUT  /api/tenant/modules — met à jour (enabled uniquement, pas locked)
//   Body: { businessId, moduleId, enabled }
// Le client ne peut PAS changer le flag locked (réservé au superadmin).
// Le client ne peut PAS désactiver un module verrouillé (locked=true).
// ============================================================

// GET — récupère les modules du tenant (normalisés avec les defaults)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    if (!businessId) {
      return NextResponse.json({ error: "businessId requis" }, { status: 400 });
    }

    // Trouver le tenant via le business
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { tenantId: true },
    });
    if (!business?.tenantId) {
      return NextResponse.json({ error: "Aucun tenant" }, { status: 404 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: business.tenantId },
      select: { modules: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    // Normaliser (remplit les defaults si null/incomplet)
    const normalized = normalizeModules(tenant.modules);
    return NextResponse.json({ modules: normalized });
  } catch (error) {
    console.error("[GET /api/tenant/modules] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT — le client active/désactive un module (non-verrouillé seulement)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, moduleId, enabled } = body as {
      businessId?: string;
      moduleId?: string;
      enabled?: boolean;
    };

    if (!businessId || !moduleId) {
      return NextResponse.json(
        { error: "businessId et moduleId sont obligatoires" },
        { status: 400 }
      );
    }
    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled (bool) requis" }, { status: 400 });
    }
    if (!MODULE_IDS.includes(moduleId as ModuleId)) {
      return NextResponse.json({ error: "moduleId invalide" }, { status: 400 });
    }

    // Trouver le tenant via le business
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { tenantId: true },
    });
    if (!business?.tenantId) {
      return NextResponse.json({ error: "Aucun tenant" }, { status: 404 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: business.tenantId },
      select: { id: true, modules: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    // Vérifier que le module n'est PAS verrouillé (le client ne peut pas
    // modifier un module locked — réservé au superadmin)
    const normalized = normalizeModules(tenant.modules);
    const currentModule = normalized[moduleId as ModuleId];
    if (currentModule?.locked) {
      return NextResponse.json(
        {
          error:
            "Ce module est verrouillé par l'administrateur. Contactez-nous pour le modifier.",
        },
        { status: 403 }
      );
    }

    // Mettre à jour le module (enabled uniquement, locked inchangé)
    const updatedModules = toggleModule(normalized, moduleId as ModuleId, enabled);

    await db.tenant.update({
      where: { id: tenant.id },
      data: { modules: updatedModules as any },
    });

    return NextResponse.json({
      success: true,
      modules: updatedModules,
    });
  } catch (error) {
    console.error("[PUT /api/tenant/modules] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
