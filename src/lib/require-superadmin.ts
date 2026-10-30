import { NextRequest, NextResponse } from "next/server";

/**
 * Vérifie que l'appelant est superadmin. Le middleware injecte l'en-tête
 * `x-user-role` depuis le JWT. Cette fonction est une défense en profondeur :
 * même si le middleware était contourné, chaque route superadmin vérifie
 * son propre rôle.
 * Retourne null si OK, sinon une Response 403 à retourner immédiatement.
 */
export function requireSuperadmin(request: NextRequest): NextResponse | null {
  const role = request.headers.get("x-user-role");
  if (role !== "superadmin") {
    return NextResponse.json(
      { error: "Accès réservé au superadministrateur" },
      { status: 403 }
    );
  }
  return null;
}
