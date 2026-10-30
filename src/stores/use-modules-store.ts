// ============================================================
// YonuKom — Store Zustand : Modules du Tenant (cache partagé)
// Fetch une fois après login → partagé par ModuleGuard + app-shell nav.
// ============================================================

import { create } from "zustand";
import { normalizeModules, type ModulesJson } from "@/lib/modules/module-utils";
import { MODULES_CONFIG, type ModuleId } from "@/lib/modules/module-config";

interface ModulesState {
  /** JSON des modules du tenant (normalisé avec defaults) */
  modules: ModulesJson | null;
  /** true après le premier fetch (réussi ou échoué) */
  isLoaded: boolean;
  /** Fetch les modules depuis l'API (à appeler après login / on dashboard mount) */
  fetchModules: (businessId: string) => Promise<void>;
  /** Vérifie si un module est activé (fallback sur defaultEnabled si pas chargé) */
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  /** Vérifie si un module est verrouillé */
  isModuleLocked: (moduleId: ModuleId) => boolean;
}

export const useModulesStore = create<ModulesState>((set, get) => ({
  modules: null,
  isLoaded: false,

  fetchModules: async (businessId: string) => {
    if (!businessId) {
      set({ modules: normalizeModules(null), isLoaded: true });
      return;
    }
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(
        `/api/tenant/modules?businessId=${encodeURIComponent(businessId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        set({ modules: data.modules, isLoaded: true });
      } else {
        set({ modules: normalizeModules(null), isLoaded: true });
      }
    } catch {
      set({ modules: normalizeModules(null), isLoaded: true });
    }
  },

  isModuleEnabled: (moduleId: ModuleId) => {
    const { modules } = get();
    if (!modules) return MODULES_CONFIG[moduleId]?.defaultEnabled ?? false;
    return modules[moduleId]?.enabled === true;
  },

  isModuleLocked: (moduleId: ModuleId) => {
    const { modules } = get();
    if (!modules) return false;
    return modules[moduleId]?.locked === true;
  },
}));
