// ============================================================
// YonuKom — Next.js Edge Middleware
// Protège TOUTES les routes /api/* avec vérification JWT
// Sauf les routes publiques (login, register, health, contact)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// --- Secret JWT (même que src/lib/auth.ts mais en format Uint8Array pour jose) ---
const JWT_SECRET = process.env.JWT_SECRET || "yonukom-dev-secret-change-in-production";
const secret = new TextEncoder().encode(JWT_SECRET);

// --- Routes publiques (pas besoin d'auth) ---
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/health",
  "/api/contact/messages", // POST formulaire de contact public
  "/api/onboarding", // POST crée le compte (avant login)
  "/api/uploads", // GET sert les images uploadées (publique pour les reçus/tickets)
];

// --- Routes dont le contenu est public mais qui doivent accepter un token optionnel ---
// (reçus imprimables, clôture de caisse, factures PDF — accessibles via URL directe)
const OPTIONAL_AUTH_ROUTES = [
  "/api/orders/", // /api/orders/[id]/receipt — le reçu est public
  "/api/invoices/", // /api/invoices/[id]/pdf — la facture est publique
  "/api/cash-sessions/", // /api/cash-sessions/[id]/closure-book — le livre de clôture est public
];

// --- Rate limiting pour /api/auth/login (anti brute-force) ---
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 60_000; // 1 minute

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

function isOptionalAuthRoute(pathname: string): boolean {
  // Les routes avec auth optionnel sont celles qui finissent par /receipt, /pdf, /closure-book
  return OPTIONAL_AUTH_ROUTES.some((route) => {
    if (!pathname.startsWith(route)) return false;
    return pathname.endsWith("/receipt") 
      || pathname.endsWith("/pdf") 
      || pathname.endsWith("/closure-book");
  });
}

async function verifyToken(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Ne pas intercepter les requêtes non-API ---
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // --- Rate limiting sur /api/auth/login ---
  if (pathname === "/api/auth/login" && request.method === "POST") {
    const clientIp = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const entry = loginAttempts.get(clientIp);

    if (entry) {
      if (now < entry.resetTime) {
        if (entry.count >= MAX_LOGIN_ATTEMPTS) {
          return NextResponse.json(
            { error: "Trop de tentatives de connexion. Réessayez dans 1 minute." },
            { status: 429 }
          );
        }
        entry.count++;
      } else {
        // Reset window
        entry.count = 1;
        entry.resetTime = now + LOGIN_WINDOW_MS;
      }
    } else {
      loginAttempts.set(clientIp, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
    }
  }

  // --- Routes publiques : pas besoin d'auth ---
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // --- Routes avec auth optionnel (reçus, factures, clôtures) ---
  // Ces routes sont accessibles sans token (pour impression directe)
  // mais si un token est présent, on l'injecte dans les headers
  if (isOptionalAuthRoute(pathname)) {
    const authHeader = request.headers.get("authorization");
    const token = request.cookies.get("yonukom_token")?.value 
      || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-id", payload.userId || "");
        requestHeaders.set("x-user-email", payload.email || "");
        requestHeaders.set("x-user-role", payload.role || "");
        requestHeaders.set("x-business-id", payload.businessId || "");
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
    }
    return NextResponse.next(); // Pas de token → on laisse passer (route publique d'impression)
  }

  // --- Vérifier le token JWT (depuis le cookie ou le header) ---
  // Le cookie HTTP-only est automatiquement envoyé par le navigateur
  // Le header Authorization est utilisé par les appels explicites (apiFetch)
  const authHeader = request.headers.get("authorization");
  const token = request.cookies.get("yonukom_token")?.value 
    || (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
  
  if (!token) {
    return NextResponse.json(
      { error: "Authentification requise. Connectez-vous pour continuer." },
      { status: 401 }
    );
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: "Session expirée ou invalide. Veuillez vous reconnecter." },
      { status: 401 }
    );
  }

  // --- Injecter les infos utilisateur dans les headers pour les routes ---
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId || "");
  requestHeaders.set("x-user-email", payload.email || "");
  requestHeaders.set("x-user-role", payload.role || "");
  requestHeaders.set("x-business-id", payload.businessId || "");

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  // Intercepter toutes les routes /api/* sauf les fichiers statiques
  matcher: ["/api/:path*"],
};
