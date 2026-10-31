// ============================================================
// YonuKom — API Team (Gestion d'équipe avancée)
// GET /api/team?businessId=xxx — liste les users avec stats du mois courant
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getTokenFromRequest } from "@/lib/auth";

interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  stats: {
    totalCommissions: number;
    paidCommissions: number;
    dueCommissions: number;
    totalAdvances: number;
    totalWorkedMinutes: number;
    attendanceDays: number;
  };
}

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

    // Récupérer tous les utilisateurs du business (exclure superadmin)
    const users = await db.user.findMany({
      where: {
        businessId,
        role: { not: "superadmin" },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    // Calculer la période du mois courant
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Pour chaque user, agréger les stats du mois
    const members: TeamMemberStats[] = await Promise.all(
      users.map(async (u) => {
        const [commissions, payroll, attendance] = await Promise.all([
          db.commission.aggregate({
            where: {
              userId: u.id,
              businessId,
              createdAt: { gte: monthStart, lt: monthEnd },
            },
            _sum: { amount: true },
          }),
          db.payrollEntry.aggregate({
            where: {
              userId: u.id,
              businessId,
              type: "advance",
              createdAt: { gte: monthStart, lt: monthEnd },
            },
            _sum: { amount: true },
          }),
          db.attendance.aggregate({
            where: {
              userId: u.id,
              businessId,
              date: { gte: monthStart, lt: monthEnd },
            },
            _sum: { workedMinutes: true },
            _count: true,
          }),
        ]);

        // Commissions dues et payées
        const [dueAgg, paidAgg] = await Promise.all([
          db.commission.aggregate({
            where: {
              userId: u.id,
              businessId,
              status: "due",
              createdAt: { gte: monthStart, lt: monthEnd },
            },
            _sum: { amount: true },
          }),
          db.commission.aggregate({
            where: {
              userId: u.id,
              businessId,
              status: "paid",
              createdAt: { gte: monthStart, lt: monthEnd },
            },
            _sum: { amount: true },
          }),
        ]);

        return {
          ...u,
          stats: {
            totalCommissions: commissions._sum.amount || 0,
            paidCommissions: paidAgg._sum.amount || 0,
            dueCommissions: dueAgg._sum.amount || 0,
            totalAdvances: payroll._sum.amount || 0,
            totalWorkedMinutes: attendance._sum.workedMinutes || 0,
            attendanceDays: attendance._count,
          },
        };
      })
    );

    return NextResponse.json(members);
  } catch (error) {
    console.error("[Team] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération de l'équipe" },
      { status: 500 }
    );
  }
}

// POST /api/team — ajoute un membre à l'équipe (vendeur/gérant)
// Body: { businessId, name, email, phone?, role, password }
// ⚠️ Seul le patron/gérant peut ajouter des membres. Le rôle superadmin est
// interdit ici (réservé à la plateforme).
export async function POST(request: NextRequest) {
  try {
    // Auth : récupère le businessId + rôle depuis le JWT (middleware a déjà
    // vérifié l'authentification).
    const tokenPayload = getTokenFromRequest(request);
    const callerRole = tokenPayload?.role;
    // On autorise patron et gérant à ajouter des membres. Les vendeurs ne
    // peuvent pas créer de comptes.
    if (callerRole && callerRole !== "patron" && callerRole !== "gerant") {
      return NextResponse.json(
        { error: "Seul le patron ou le gérant peut ajouter des membres" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { businessId, name, email, phone, role, password } = body as {
      businessId?: string;
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      password?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Le nom est obligatoire" },
        { status: 400 }
      );
    }
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "L'email est obligatoire" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Valider le rôle (vendeur ou gérant uniquement — jamais patron/superadmin
    // via cette route : le patron est créé à l'inscription, le superadmin via
    // le seed plateforme).
    const finalRole = role === "gerant" ? "gerant" : "vendeur";

    // Vérifier que le business existe + récupérer le tenantId
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { id: true, tenantId: true },
    });
    if (!business) {
      return NextResponse.json(
        { error: "Commerce introuvable" },
        { status: 404 }
      );
    }

    // Email unique (contrainte @unique sur User.email)
    const existing = await db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        phone: phone ? String(phone).trim() : null,
        password: hashedPassword,
        role: finalRole,
        isActive: true,
        businessId,
        tenantId: business.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[Team] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création du membre" },
      { status: 500 }
    );
  }
}
