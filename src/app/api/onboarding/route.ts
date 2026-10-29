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
      const tenantBusinessType: string =
        onboardingType === "pipeline_b2b" ? "wholesaler"
        : onboardingType === "ecommerce_social" ? "ecommerce_social"
        : onboardingType === "restaurant" ? "restaurant"
        : "mixte";
      await db.tenant.update({
        where: { id: existingBusiness.tenantId },
        data: { businessType: tenantBusinessType },
      }).catch(() => {
        // Non-bloquant — la mise à jour du business suffit pour l'app marchand
      });
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
