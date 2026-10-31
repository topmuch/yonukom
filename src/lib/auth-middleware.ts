// ============================================================
// YonuKom — Auth middleware wrapper for API routes
// Usage:
//   export const POST = withAuth(async (req, user) => { ... })
// The wrapper extracts the Bearer token from the Authorization
// header, verifies it, and passes the JwtPayload as `user` to
// the handler. Returns 401 if missing/invalid.
//
// NOTE: Backward compatible — existing API routes that do NOT
// use this wrapper continue to work unchanged. The wrapper is
// available for new routes that require authentication.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JwtPayload } from "@/lib/auth";

// Wrapper for API routes that require authentication
export function withAuth(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }
    return handler(req, user);
  };
}
