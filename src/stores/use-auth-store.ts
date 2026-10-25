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

  // --- ACTIONS ---
  /** Connecter un utilisateur */
  login: (user: NonNullable<AuthState["user"]>) => void;
  /** Déconnecter */
  logout: () => void;
  /** Vérifier une permission spécifique */
  can: (permission: keyof PermissionSet) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: null,
  isLoaded: false,

  login: (user) => {
    const permissions = ROLE_PERMISSIONS[user.role];
    set({ user, permissions, isLoaded: true });

    // Persister dans localStorage pour survie au rechargement
    if (typeof window !== "undefined") {
      localStorage.setItem("yonukom_user", JSON.stringify(user));
    }
  },

  logout: () => {
    set({ user: null, permissions: null, isLoaded: true });
    if (typeof window !== "undefined") {
      localStorage.removeItem("yonukom_user");
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
  if (stored) {
    try {
      const user = JSON.parse(stored);
      useAuthStore.getState().login(user);
    } catch {
      localStorage.removeItem("yonukom_user");
      // Marquer comme chargé même si le localStorage est corrompu
      useAuthStore.setState({ isLoaded: true });
    }
  } else {
    // Pas d'utilisateur stocké → marquer quand même comme chargé
    // pour ne pas bloquer sur l'écran de chargement
    useAuthStore.setState({ isLoaded: true });
  }
}
