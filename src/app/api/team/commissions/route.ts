// ============================================================
// YonuKom — API Team Commissions
// GET  /api/team/commissions?businessId=xxx&userId=xxx&status=xxx
// POST /api/team/commissions — crée une commission (auto-calc amount)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    if (!businessId) {
      return NextResponse.json(
        { error: "Paramètre businessId requis" },
        { status: 400 }
      );
    }

    const commissions = await db.commission.findMany({
      where: {
        businessId,
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: { select: { id: true, name: true, role: true } },
        order: {
          select: { id: true, orderNumber: true, totalAmount: true },
        },
      },
    });

    return NextResponse.json(commissions);
  } catch (error) {
    console.error("[Commissions] GET error:", error);
    return NextResponse.json(
      { error: "Échec de récupération des commissions" },
      { status: 500 }
    );
  }
}

// POST /api/team/commissions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      businessId,
      userId,
      type,
      value,
      orderId,
      amount,
      status,
    } = body as {
      businessId?: string;
      userId?: string;
      type?: string;
      value?: number;
      orderId?: string;
      amount?: number;
      status?: string;
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

    const commissionType =
      type === "fixed" ? "fixed" : "percentage";
    const numericValue = Number(value) || 0;

    let finalAmount: number;

    if (commissionType === "fixed") {
      finalAmount = numericValue;
    } else {
      // Percentage : on a besoin de l'order pour calculer
      if (!orderId) {
        return NextResponse.json(
          {
            error:
              "orderId est obligatoire pour une commission en pourcentage",
          },
          { status: 400 }
        );
      }
      // Vérifier ownership de la commande
      const order = await db.order.findFirst({
        where: { id: orderId, businessId },
        select: { id: true, totalAmount: true },
      });
      if (!order) {
        return NextResponse.json(
          { error: "Commande introuvable ou accès refusé" },
          { status: 404 }
        );
      }
      // amount = round(value% * order.totalAmount)
      finalAmount = Math.round((numericValue / 100) * order.totalAmount);
    }

    // Si un montant est explicitement fourni (override), on l'utilise
    if (typeof amount === "number" && amount > 0) {
      finalAmount = amount;
    }

    const commission = await db.commission.create({
      data: {
        businessId,
        userId,
        type: commissionType,
        value: numericValue,
        orderId: orderId || null,
        amount: finalAmount,
        status: status === "paid" ? "paid" : "due",
        paidAt: status === "paid" ? new Date() : null,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        order: {
          select: { id: true, orderNumber: true, totalAmount: true },
        },
      },
    });

    return NextResponse.json(commission, { status: 201 });
  } catch (error) {
    console.error("[Commissions] POST error:", error);
    return NextResponse.json(
      { error: "Échec de la création de la commission" },
      { status: 500 }
    );
  }
}
