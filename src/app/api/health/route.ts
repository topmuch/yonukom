// ============================================================
// YonuKom — API Health Check
// Utilisé par le store de connectivité pour vérifier
// que le serveur est joignable (pas seulement navigator.onLine)
// ============================================================

import { NextResponse } from "next/server";

export async function HEAD() {
  return NextResponse.json({ status: "ok" });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "YonuKom",
  });
}
