import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/require-superadmin";

// PATCH /api/superadmin/messages/[messageId]
// Body: { status?: "new"|"read"|"archived", adminNote?: string }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const { messageId } = await params;
    const body = await request.json();
    const data: any = {};

    if (body.status && ["new", "read", "archived"].includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.adminNote === "string") {
      data.adminNote = body.adminNote.slice(0, 2000);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Aucune mise à jour valide fournie" },
        { status: 400 }
      );
    }

    const updated = await (prisma as any).contactMessage.update({
      where: { id: messageId },
      data,
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (err: any) {
    console.error("[PATCH /api/superadmin/messages/[id]] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/superadmin/messages/[messageId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const forbidden = requireSuperadmin(request);
    if (forbidden) return forbidden;

    const { messageId } = await params;
    await (prisma as any).contactMessage.delete({
      where: { id: messageId },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/superadmin/messages/[id]] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
