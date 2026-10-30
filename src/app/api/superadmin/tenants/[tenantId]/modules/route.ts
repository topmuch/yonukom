import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/require-superadmin";
import { normalizeModules, toggleModule, lockModule } from "@/lib/modules/module-utils";
import { MODULE_IDS, type ModuleId } from "@/lib/modules/module-config";

// ============================================================
// YonuKom — API Superadmin : Modules d'un tenant
// GET  /api/superadmin/tenants/[tenantId]/modules — liste les modules
// PUT  /api/superadmin/tenants/[tenantId]/modules — met à jour (enabled + locked)
//   Body: { moduleId, enabled?, locked? }
// Le superadmin peut changer enabled ET locked (contrairement au client
// qui ne peut changer que enabled sur les non-locked).
// ============================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const forbidden = requireSuperadmin(request);
  if (forbidden) return forbidden;

  try {
    const { tenantId } = await params;
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { modules: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }
    const normalized = normalizeModules(tenant.modules);
    return NextResponse.json({ modules: normalized });
  } catch (error) {
    console.error("[GET /api/superadmin/tenants/[tenantId]/modules] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const forbidden = requireSuperadmin(request);
  if (forbidden) return forbidden;

  try {
    const { tenantId } = await params;
    const body = await request.json();
    const { moduleId, enabled, locked } = body as {
      moduleId?: string;
      enabled?: boolean;
      locked?: boolean;
    };

    if (!moduleId || !MODULE_IDS.includes(moduleId as ModuleId)) {
      return NextResponse.json({ error: "moduleId invalide" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, modules: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant introuvable" }, { status: 404 });
    }

    let modules = normalizeModules(tenant.modules);

    // Le superadmin peut changer enabled ET locked
    if (typeof enabled === "boolean") {
      modules = toggleModule(modules, moduleId as ModuleId, enabled);
    }
    if (typeof locked === "boolean") {
      modules = lockModule(modules, moduleId as ModuleId, locked);
    }

    await db.tenant.update({
      where: { id: tenantId },
      data: { modules: modules as any },
    });

    return NextResponse.json({ success: true, modules });
  } catch (error) {
    console.error("[PUT /api/superadmin/tenants/[tenantId]/modules] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
