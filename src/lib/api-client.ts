// ============================================================
// YonuKom — Client-side fetch wrapper
// Automatically injects the JWT token (stored in localStorage
// as `yonukom_token`) into the Authorization header for any
// request made through `apiFetch`.
//
// Usage:
//   import { apiFetch } from "@/lib/api-client";
//   const res = await apiFetch("/api/products", { method: "POST", ... });
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
  }
  return fetch(url, options);
}
