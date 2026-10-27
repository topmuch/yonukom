// ============================================================
// YonuKom — Store Zustand : Auth & Rôle courant
// Gère l'utilisateur connecté et ses permissions
// ============================================================

import { create } from "zustand";
import type { UserRole, PermissionSet } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";

export interface AuthState {
  // --- ÉTAT ---
  /** Utilisateur connecté */
  user: {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: UserRole;
    businessId: string;
    businessName: string;
  } | null;
  /** Permissions calculées à partir du rôle */
  permissions: PermissionSet | null;
  /** Session chargée ? */
  isLoaded: boolean;
  /** JWT token (stateless auth). Stored in localStorage as `yonukom_token`. */
  token: string | null;

  // --- ACTIONS ---
  /** Connecter un utilisateur (+ stocker le token JWT si fourni) */
  login: (
    user: NonNullable<AuthState["user"]>,
    token?: string | null
  ) => void;
  /** Déconnecter */
  logout: () => void;
  /** Vérifier une permission spécifique */
  can: (permission: keyof PermissionSet) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: null,
  isLoaded: false,
  token: null,

  login: (user, token) => {
    const permissions = ROLE_PERMISSIONS[user.role];
    set({ user, permissions, isLoaded: true, token: token ?? null });

    // Persister dans localStorage pour survie au rechargement
    if (typeof window !== "undefined") {
      localStorage.setItem("yonukom_user", JSON.stringify(user));
      if (token) {
        localStorage.setItem("yonukom_token", token);
      } else {
        localStorage.removeItem("yonukom_token");
      }
    }
  },

  logout: () => {
    // Synchronously clear state + storage, no async work, no delay
    set({ user: null, permissions: null, isLoaded: true, token: null });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("yonukom_user");
        localStorage.removeItem("yonukom_token");
        // Vider aussi la config d'onboarding pour qu'au prochain login
        // on la recharge depuis le serveur (et pas depuis l'ancienne session).
        localStorage.removeItem("yonukom_config");
      } catch {
        /* ignore */
      }
      // Reset du config store aussi (sinon isOnboarded reste true en mémoire)
      try {
        const { useConfigStore } = require("@/stores/use-config-store");
        useConfigStore.getState().resetConfig();
      } catch {
        /* ignore — peut échouer si config store pas encore chargé */
      }
    }
  },

  can: (permission) => {
    const { permissions } = get();
    if (!permissions) return false;
    return permissions[permission] === true;
  },
}));

// --- HYDRATATION AUTO au chargement ---
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("yonukom_user");
  const storedToken = localStorage.getItem("yonukom_token");
  if (stored) {
    try {
      const user = JSON.parse(stored);
      useAuthStore.getState().login(user, storedToken);
    } catch {
      localStorage.removeItem("yonukom_user");
      localStorage.removeItem("yonukom_token");
      // Marquer comme chargé même si le localStorage est corrompu
      useAuthStore.setState({ isLoaded: true });
    }
  } else {
    // Pas d'utilisateur stocké → marquer quand même comme chargé
    // pour ne pas bloquer sur l'écran de chargement
    useAuthStore.setState({ isLoaded: true });
  }
}
