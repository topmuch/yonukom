// ============================================================
// YonuKom — Store Zustand : Configuration Modules
// Charge la config générée par l'onboarding et active/masque
// dynamiquement les modules de l'interface
// ============================================================

import { create } from "zustand";
import type { ModuleConfig } from "@/types/onboarding";
import type { PaymentMethod } from "@/types";

export interface ConfigState {
  // --- ÉTAT ---
  /** Configuration complète des modules */
  config: ModuleConfig | null;
  /** L'onboarding est-il terminé ? */
  isOnboarded: boolean;
  /** La config est-elle chargée ? */
  isLoaded: boolean;

  // --- ACTIONS ---
  /** Charger la config (depuis Business.onboardingConfig) */
  loadConfig: (configJson: string) => void;
  /** Sauvegarder la config (fin d'onboarding) */
  saveConfig: (config: ModuleConfig) => void;
  /** Réinitialiser (pour refaire l'onboarding) */
  resetConfig: () => void;
  /**
   * Rafraîchir la config depuis le serveur (après modification des settings
   * business). Re-fetch /api/business/profile et recharge onboardingConfig.
   * Corrige la staleness : avant, la config n'était jamais re-fetchée après
   * login, donc un changement côté serveur n'était pas répercuté jusqu'à
   * déconnexion/reconnexion.
   */
  refreshFromServer: (businessId: string) => Promise<void>;

  // --- SÉLECTEURS DE MODULES ---
  /** Le module E-Commerce Social est-il actif ? */
  isEcommerceActive: () => boolean;
  /** Le module Pipeline B2B est-il actif ? */
  isB2BActive: () => boolean;
  /** Le module Restaurant est-il actif ? */
  isRestaurantActive: () => boolean;
  /** La gestion de stock est-elle activée ? */
  isStockEnabled: () => boolean;
  /** Les réservations B2B sont-elles gérées ? */
  isReservationManaged: () => boolean;
  /** La clôture de caisse est-elle nécessaire ? */
  needsCashRegister: () => boolean;
  /** Quels moyens de paiement sont acceptés ? */
  getPaymentMethods: () => PaymentMethod[];
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  isOnboarded: false,
  isLoaded: false,

  loadConfig: (configJson) => {
    try {
      const config = JSON.parse(configJson) as ModuleConfig;
      set({ config, isOnboarded: true, isLoaded: true });
      if (typeof window !== "undefined") {
        localStorage.setItem("yonukom_config", JSON.stringify(config));
      }
    } catch {
      set({ isOnboarded: false, isLoaded: true });
    }
  },

  saveConfig: (config) => {
    set({ config, isOnboarded: true, isLoaded: true });

    // Persister dans localStorage (cache local)
    if (typeof window !== "undefined") {
      localStorage.setItem("yonukom_config", JSON.stringify(config));
    }
  },

  resetConfig: () => {
    set({ config: null, isOnboarded: false, isLoaded: true });
    if (typeof window !== "undefined") {
      localStorage.removeItem("yonukom_config");
    }
  },

  refreshFromServer: async (businessId: string) => {
    if (typeof window === "undefined" || !businessId) return;
    try {
      const token = localStorage.getItem("yonukom_token");
      const res = await fetch(
        `/api/business/profile?businessId=${encodeURIComponent(businessId)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        }
      );
      if (!res.ok) return;
      const data = await res.json();
      // Si le business a une config d'onboarding, la recharger dans le store.
      // Si onboardingCompleted=false, on marque isOnboarded=false pour
      // forcer le wizard à se réafficher.
      if (data.onboardingConfig) {
        get().loadConfig(data.onboardingConfig);
      } else if (data.onboardingCompleted === false) {
        set({ isOnboarded: false, isLoaded: true });
      }
    } catch {
      // Silencieux — le refresh ne doit pas casser l'UI
    }
  },

  // --- SÉLECTEURS ---
  isEcommerceActive: () => get().config?.ecommerce_social ?? false,
  isB2BActive: () => get().config?.pipeline_b2b ?? false,
  isRestaurantActive: () => get().config?.restaurant ?? false,
  isStockEnabled: () => get().config?.stock.enabled ?? false,
  isReservationManaged: () => get().config?.stock.manageReservations ?? false,
  needsCashRegister: () => get().config?.team.needCashRegister ?? false,
  getPaymentMethods: () => get().config?.payments.methods ?? ["cash"],
}));

// --- HYDRATATION AUTO au chargement ---
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("yonukom_config");
  if (stored) {
    try {
      const config = JSON.parse(stored) as ModuleConfig;
      useConfigStore.getState().saveConfig(config);
    } catch {
      localStorage.removeItem("yonukom_config");
    }
  } else {
    // Pas de config stockée → onboarding pas encore fait, mais store est prêt
    useConfigStore.setState({ isLoaded: true });
  }
}
