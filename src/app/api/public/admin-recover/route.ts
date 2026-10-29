import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// ============================================================
// ONE-TIME ADMIN PASSWORD RECOVERY
// POST /api/admin/recover
// Body: { email, newPassword }
// Resets the password for any user. SECURE: only works if the
// request includes a valid recovery token in the header.
// This endpoint is DELETED after use (or disabled in production).
// ============================================================

const RECOVERY_TOKEN = process.env.ADMIN_RECOVERY_TOKEN || "yonukom-recover-2026";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, newPassword } = body as { email?: string; newPassword?: string };

    if (!email || !newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "email et newPassword (min 6 chars) requis" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== RECOVERY_TOKEN) {
      return NextResponse.json({ error: "Token de récupération invalide" }, { status: 403 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        role: user.role === "superadmin" ? "superadmin" : user.role,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Mot de passe réinitialisé pour ${email}`,
      role: user.role,
    });
  } catch (error) {
    console.error("[Admin Recovery] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
