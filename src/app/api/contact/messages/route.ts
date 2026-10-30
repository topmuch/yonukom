import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// POST /api/contact/messages — soumis par le formulaire de la page /contact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Champs requis manquants (name, email, message)" },
        { status: 400 }
      );
    }

    const created = await (prisma as any).contactMessage.create({
      data: {
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 200),
        message: String(message).slice(0, 5000),
        status: "new",
      },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (err: any) {
    console.error("[POST /api/contact/messages] error:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement du message" },
      { status: 500 }
    );
  }
}
