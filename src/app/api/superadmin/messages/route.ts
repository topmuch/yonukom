import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// GET /api/superadmin/messages — liste tous les messages de contact
// Query params: ?status=new|read|archived (optionnel)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const where: any = {};
    if (status && ["new", "read", "archived"].includes(status)) {
      where.status = status;
    }

    const messages = await (prisma as any).contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const counts = await (prisma as any).contactMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const countMap: Record<string, number> = {
      new: 0,
      read: 0,
      archived: 0,
    };
    for (const row of counts) {
      countMap[row.status] = row._count._all;
    }

    return NextResponse.json({
      messages,
      counts: countMap,
      total: countMap.new + countMap.read + countMap.archived,
    });
  } catch (err: any) {
    console.error("[GET /api/superadmin/messages] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
