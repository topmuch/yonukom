// ============================================================
// YonuKom — Client-side fetch wrapper
// Automatically injects the JWT token (stored in localStorage
// as `yonukom_token`) into the Authorization header for any
// request made through `apiFetch`.
//
// Also patches window.fetch globally to always include credentials
// and the Authorization header, so all existing fetch() calls
// in the app automatically send the JWT cookie.
//
// Usage:
//   import { apiFetch } from "@/lib/api-client";
//   const res = await apiFetch("/api/products", { method: "POST", ... });
//
// OR just use fetch() normally — the global patch handles it.
// ============================================================

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yonukom_token");
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    // Always include credentials (cookies)
    options.credentials = "include";
  }
  return fetch(url, options);
}

/**
 * Patches window.fetch globally so that ALL fetch() calls in the app
 * automatically include:
 * 1. credentials: "include" — sends the yonukom_token cookie
 * 2. Authorization: Bearer <token> — sends the JWT from localStorage
 *
 * This is called once at app startup (in layout.tsx or a client component).
 * It does NOT modify requests to other domains (only same-origin /api/ requests).
 */
export function patchGlobalFetch() {
  if (typeof window === "undefined") return;
  if ((window as any).__fetchPatched) return; // Only patch once

  const originalFetch = window.fetch;
  (window as any).__fetchPatched = true;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only patch same-origin API requests
    const url = typeof input === "string" ? input : (input as Request).url;
    const isApiCall = url.startsWith("/api/") || url.startsWith(window.location.origin + "/api/");

    if (isApiCall && init) {
      // Add credentials: include (sends cookies)
      init.credentials = "include";

      // Add Authorization header if we have a token in localStorage
      const token = localStorage.getItem("yonukom_token");
      if (token) {
        const headers = new Headers(init.headers);
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        init.headers = headers;
      }
    } else if (isApiCall && !init) {
      // Create init object if none provided
      init = { credentials: "include" };
      const token = localStorage.getItem("yonukom_token");
      if (token) {
        init.headers = { Authorization: `Bearer ${token}` };
      }
    }

    const response = await originalFetch.call(this, input, init);

    // --- Intercepteur 401 : session expirée ---
    // ATTENTION : on NE clear PAS localStorage ni redirige automatiquement.
    // L'ancien comportement (clear + redirect sur tout 401) causait une cascade
    // d'échecs : un seul 401 sur une route superadmin effaçait le token, et
    // TOUS les appels suivants échouaient avec "Authentification requise".
    // Désormais, on laisse le composant gérer l'erreur (il affiche son propre
    // message d'erreur). Le logout manuel reste disponible via le bouton
    // Déconnexion.
    // On exclut aussi les routes d'auth (login/register) qui retournent 401
    // pour "mauvais mot de passe" — pas une session expirée.
    if (response.status === 401 && isApiCall) {
      const urlStr = typeof input === "string" ? input : (input as Request).url;
      if (
        !urlStr.includes("/api/auth/login") &&
        !urlStr.includes("/api/auth/register") &&
        !urlStr.includes("/api/superadmin/")
      ) {
        // Pour les routes NON-auth NON-superadmin : on logout seulement si
        // on n'est pas déjà sur le landing (évite les boucles).
        if (window.location.pathname !== "/") {
          try {
            localStorage.removeItem("yonukom_token");
            localStorage.removeItem("yonukom_user");
            localStorage.removeItem("yonukom_config");
          } catch {
            /* ignore */
          }
          window.location.href = "/";
        }
      }
      // Pour /api/superadmin/* : on NE clear PAS le token. Le composant
      // gère l'erreur (affiche "Erreur lors du chargement"). Le superadmin
      // garde sa session et peut réessayer.
    }

    return response;
  };
}

