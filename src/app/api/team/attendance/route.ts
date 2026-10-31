// ============================================================
// YonuKom — API Team Attendance (Présences)
// GET  /api/team/attendance?businessId=xxx&userId=xxx&from&to
// POST /api/team/attendance — check-in (today)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

// GET /api/team/attendance
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const dateFilter: { gte?: Date; lt?: Date } = {};
    if (fromStr) dateFilter.gte = new Date(fromStr);
    if (toStr) {
      // Inclure tout le jour "to"
      dateFilter.lt = new Date(new Date(toStr).getTime() + 24 * 60 * 60 * 1000);
    }

    const records = await db.attendance.findMany({
      where: {
        businessId,
        ...(userId ? { userId } : {}),
        ...(fromStr || toStr ? { date: dateFilter } : {}),
      },
      orderBy: { date: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("[Attendance] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des présences" },
      { status: 500 }
    );
  }
}

// POST /api/team/attendance — check-in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { businessId, userId, date } = body as {
      businessId?: string;
      userId?: string;
      date?: string;
    };

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId est obligatoire" },
        { status: 400 }
      );
    }
    if (!userId) {
      return NextResponse.json(
        { error: "userId est obligatoire" },
        { status: 400 }
      );
    }

    // Vérifier ownership du user
    const user = await db.user.findFirst({
      where: { id: userId, businessId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable dans ce commerce" },
        { status: 404 }
      );
    }

    // Déterminer le jour (par défaut aujourd'hui)
    const day = date ? new Date(date) : new Date();
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    // Vérifier qu'il n'y a pas déjà un pointage ce jour
    const existing = await db.attendance.findFirst({
      where: {
        userId,
        businessId,
        date: { gte: dayStart, lte: dayEnd },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Déjà pointé pour ce jour" },
        { status: 409 }
      );
    }

    const now = new Date();
    const attendance = await db.attendance.create({
      data: {
        businessId,
        userId,
        date: dayStart,
        checkInTime: now,
        checkOutTime: null,
        workedMinutes: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error) {
    console.error("[Attendance] POST error:", error);
    return NextResponse.json(
      { error: "Échec du pointage d'arrivée" },
      { status: 500 }
    );
  }
}
