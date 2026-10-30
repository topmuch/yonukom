// ============================================================
// YonuKom — API Onboarding
// Sauvegarde la configuration générée par l'onboarding
//
// IMPORTANT : cette API ne crée PLUS de nouveau business ni de nouvel
// utilisateur. L'utilisateur est déjà connecté (via /api/auth/register +
// /api/auth/login), donc on met simplement à jour SON business existant
// avec la config d'onboarding.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getDefaultCategories } from "@/config/default-categories";
import { buildModulesForBusinessType } from "@/lib/modules/module-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessType, team, payments, stock, equipment, config, businessId } = body as {
      businessType: Record<string, unknown>;
      team: Record<string, unknown>;
      payments: Record<string, unknown>;
      stock: Record<string, unknown>;
      equipment: Record<string, unknown>;
      config: Record<string, unknown>;
      businessId?: string;
    };

    // businessId est requis — l'utilisateur doit être connecté
    if (!businessId) {
      return NextResponse.json(
        { error: "businessId requis. L'utilisateur doit être connecté avant l'onboarding." },
        { status: 400 }
      );
    }

    // Vérifier que le business existe
    const existingBusiness = await db.business.findUnique({
      where: { id: businessId },
    });
    if (!existingBusiness) {
      return NextResponse.json(
        { error: "Commerce introuvable. Veuillez vous reconnecter." },
        { status: 404 }
      );
    }

    // Mettre à jour le business existant avec la config d'onboarding
    const updatedBusiness = await db.business.update({
      where: { id: businessId },
      data: {
        name: existingBusiness.name || "Mon Commerce",
        type: (businessType.type as string) || existingBusiness.type || "mixte",
        onboardingConfig: JSON.stringify(config),
        onboardingCompleted: true,
      },
    });

    // Mettre à jour le tenant.businessType pour cohérence superadmin
    // (sinon tous les tenants self-inscrits apparaissent comme "retail_shop"
    // dans le dashboard superadmin). Map le type d'onboarding → TenantBusinessType.
    if (existingBusiness.tenantId) {
      const onboardingType = (businessType.type as string) || "mixte";
      // Les 8 nouveaux métiers (retail_shop, fast_food, restaurant, salon,
      // cosmetics, wholesaler, tiktok_seller, mobile_vendor) + les legacy
      // (ecommerce_social, mixte) sont des TenantBusinessType valides →
      // mapping direct. Seul "pipeline_b2b" (legacy) nécessite une traduction
      // vers "wholesaler".
      const tenantBusinessType: string =
        onboardingType === "pipeline_b2b" ? "wholesaler"
        : onboardingType;
      await db.tenant.update({
        where: { id: existingBusiness.tenantId },
        data: { businessType: tenantBusinessType },
      }).catch(() => {
        // Non-bloquant — la mise à jour du business suffit pour l'app marchand
      });
    }

    // --- Pré-remplir les catégories par défaut selon le métier ---
    // Le marchand démarre avec un catalogue structuré (ex: salon → Tresses,
    // Tissage, Soins…). Idempotent : ne crée que les catégories qui n'existent
    // pas déjà (par nom + businessId, via la contrainte @@unique).
    try {
      const existingCats = await db.category.findMany({
        where: { businessId },
        select: { name: true },
      });
      const existingNames = new Set(existingCats.map((c) => c.name));
      const defaults = getDefaultCategories(
        (businessType.type as string) || "mixte"
      );
      const toCreate = defaults.filter((d) => !existingNames.has(d.name));
      // createMany n'est pas supporté de façon fiable sur SQLite ici → on crée
      // les catégories individuellement (max ~5, perf négligeable).
      for (let i = 0; i < toCreate.length; i++) {
        try {
          await db.category.create({
            data: {
              businessId,
              name: toCreate[i].name,
              color: toCreate[i].color,
              sortOrder: i,
              isActive: true,
            },
          });
        } catch {
          // Ignore les doublons (contrainte @@unique [businessId, name]) —
          // rend l'opération idempotente si l'onboarding est rejoué.
        }
      }
    } catch (catErr) {
      console.error("[Onboarding] category creation failed:", catErr);
    }

    // --- Définir les modules activables selon le métier ---
    // Un restaurant ne voit pas les modules salon, un salon ne voit pas
    // wholesale, etc. Seuls les modules pertinents sont enabled=true.
    // Le superadmin peut override (activer n'importe quel module).
    if (existingBusiness.tenantId) {
      try {
        const bt = (businessType.type as string) || "mixte";
        const modules = buildModulesForBusinessType(bt);
        await db.tenant.update({
          where: { id: existingBusiness.tenantId },
          data: { modules: modules as any },
        }).catch(() => {});
      } catch {
        /* non-bloquant */
      }
    }

    // Journal d'audit : onboarding terminé
    await db.auditLog.create({
      data: {
        action: "login",
        entityType: "user",
        details: JSON.stringify({
          event: "onboarding_completed",
          businessType: businessType.type,
          modulesActivated: Object.entries(config)
            .filter(([_, v]) => v === true)
            .map(([k]) => k),
        }),
        businessId: businessId,
      },
    });

    return NextResponse.json({
      success: true,
      businessId: updatedBusiness.id,
      config,
      // Pas de user retourné — l'utilisateur est déjà connecté via /api/auth/login
      // et ne doit PAS être remplacé par un faux utilisateur.
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[YonuKom] Erreur onboarding:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
