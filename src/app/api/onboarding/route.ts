// ============================================================
// YonuKom — API Onboarding
// Sauvegarde la configuration générée par l'onboarding
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createCuid } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessType, team, payments, stock, equipment, config } = body as {
      businessType: Record<string, unknown>;
      team: Record<string, unknown>;
      payments: Record<string, unknown>;
      stock: Record<string, unknown>;
      equipment: Record<string, unknown>;
      config: Record<string, unknown>;
    };

    // Créer une Business avec la config
    const business = await db.business.create({
      data: {
        name: "Mon Business", // Sera mis à jour plus tard
        type: (businessType.type as string) || "mixte",
        onboardingConfig: JSON.stringify(config),
        onboardingCompleted: true,
        currency: "XOF",
        country: "SN",
      },
    });

    // Créer le patron par défaut avec un email unique basé sur le business ID
    await db.user.create({
      data: {
        email: `patron.${business.id}@yonukom.com`,
        name: "Patron",
        role: "patron",
        password: "temp", // ⚠️ Phase 4 : remplacer par vrai auth
        businessId: business.id,
      },
    });

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
        businessId: business.id,
      },
    });

    return NextResponse.json({
      success: true,
      businessId: business.id,
      config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[YonuKom] Erreur onboarding:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
