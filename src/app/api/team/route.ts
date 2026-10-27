// ============================================================
// YonuKom — API Team (Gestion d'équipe avancée)
// GET /api/team?businessId=xxx — liste les users avec stats du mois courant
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
