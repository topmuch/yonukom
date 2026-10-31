// ============================================================
// YonuKom — JWT Authentication helpers
// Sign / verify / extract JWT tokens for stateless auth.
// The token is sent by the client in the Authorization header
// ("Bearer <token>") and verified by API routes that opt-in
// to auth via the `withAuth` middleware.
// ============================================================

import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "yonukom-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  businessId: string | null;
}

/**
 * Sign a JWT for a given user payload.
 * Used by /api/auth/login after successful password verification.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT and return the payload if valid, otherwise null.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract the JWT payload from a standard Request's Authorization header.
 * Returns null if the header is missing, malformed, or the token is invalid.
 */
export function getTokenFromRequest(request: Request): JwtPayload | null {
  // Check Authorization header: "Bearer <token>"
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }
  return null;
}
