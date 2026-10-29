// ============================================================
// YonuKom — Store Zustand : Onboarding Wizard
// Gère la navigation entre les 5 étapes et les réponses
// ============================================================

import { create } from "zustand";
import type {
  OnboardingStep,
  OnboardingBusinessType,
  OnboardingTeam,
  OnboardingPayments,
  OnboardingStock,
  OnboardingEquipment,
  ModuleConfig,
} from "@/types/onboarding";
import { ONBOARDING_STEPS } from "@/types/onboarding";
import type { BusinessType } from "@/types";

export interface OnboardingStoreState {
  // --- ÉTAT ---
  currentStepIndex: number; // 0-4
  isCompleted: boolean;
  isSubmitting: boolean;
  submitError: string | null;

  // --- RÉPONSES PAR ÉTAPE ---
  businessType: OnboardingBusinessType | null;
  team: OnboardingTeam | null;
  payments: OnboardingPayments | null;
  stock: OnboardingStock | null;
  equipment: OnboardingEquipment | null;

  // --- CONFIG GÉNÉRÉE ---
  generatedConfig: ModuleConfig | null;

  // --- ACTIONS ---
  goToStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setBusinessType: (data: OnboardingBusinessType) => void;
  setTeam: (data: OnboardingTeam) => void;
  setPayments: (data: OnboardingPayments) => void;
  setStock: (data: OnboardingStock) => void;
  setEquipment: (data: OnboardingEquipment) => void;
  submit: () => Promise<void>;
  reset: () => void;

  // --- DÉRIVÉS ---
  currentStep: () => OnboardingStep;
  canGoNext: () => boolean;
  canGoPrev: () => boolean;
  progress: () => number; // 0-100
}

const TOTAL_STEPS = ONBOARDING_STEPS.length;

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  currentStepIndex: 0,
  isCompleted: false,
  isSubmitting: false,
  submitError: null,
  businessType: null,
  // Valeurs par défaut pour les étapes 2-5 — évite les setState pendant le render
  team: { teamSize: 1, roles: ["patron"], needCashRegister: false },
  payments: { methods: ["cash"], primaryMethod: "cash", waveNumber: "", orangeMoneyNumber: "" },
  stock: { trackStock: true, lowStockAlert: true, alertThreshold: 5, manageReservations: false },
  equipment: { useReceiptPrinter: false, useBarcodeScanner: false, language: "fr" as const, currency: "XOF" as const },
  generatedConfig: null,

  goToStep: (index) => {
    if (index >= 0 && index < TOTAL_STEPS) {
      set({ currentStepIndex: index });
    }
  },

  nextStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex < TOTAL_STEPS - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  setBusinessType: (data) => set({ businessType: data }),
  setTeam: (data) => set({ team: data }),
  setPayments: (data) => set({ payments: data }),
  setStock: (data) => set({ stock: data }),
  setEquipment: (data) => set({ equipment: data }),

  submit: async () => {
    const state = get();
    set({ isSubmitting: true, submitError: null });

    try {
      // Générer la config à partir des réponses
      const { generateModuleConfig } = await import("@/config/modules");
      const config = generateModuleConfig({
        businessType: (state.businessType?.type ?? "mixte") as BusinessType,
        paymentMethods: state.payments?.methods ?? ["cash"],
        primaryPaymentMethod: state.payments?.primaryMethod ?? "cash",
        trackStock: state.stock?.trackStock ?? true,
        lowStockAlert: state.stock?.lowStockAlert ?? true,
        alertThreshold: state.stock?.alertThreshold ?? 5,
        teamRoles: state.team?.roles ?? ["patron"],
        needCashRegister: state.team?.needCashRegister ?? false,
        language: state.equipment?.language ?? "fr",
        useReceiptPrinter: state.equipment?.useReceiptPrinter ?? false,
        useBarcodeScanner: state.equipment?.useBarcodeScanner ?? false,
        waveNumber: state.payments?.waveNumber,
        orangeMoneyNumber: state.payments?.orangeMoneyNumber,
        manageReservations: state.stock?.manageReservations,
      });

      // Récupérer le businessId de l'utilisateur actuellement connecté.
      // L'utilisateur DOIT être connecté avant de faire l'onboarding
      // (flux : signup → login → onboarding).
      const { useAuthStore } = await import("@/stores/use-auth-store");
      const currentUser = useAuthStore.getState().user;
      if (!currentUser?.businessId) {
        throw new Error(
          "Vous devez être connecté pour configurer votre commerce. Veuillez vous reconnecter."
        );
      }

      // Envoyer au serveur avec le businessId du user connecté
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: state.businessType,
          team: state.team,
          payments: state.payments,
          stock: state.stock,
          equipment: state.equipment,
          config,
          businessId: currentUser.businessId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as any)?.error || "Erreur lors de la sauvegarde"
        );
      }

      // Sauvegarder la config dans le store local → isOnboarded devient true
      const { useConfigStore } = await import("@/stores/use-config-store");
      useConfigStore.getState().saveConfig(config);

      // NE PAS appeler useAuthStore.login() ici — l'utilisateur est déjà
      // connecté via /api/auth/login. L'ancien code appelait login() avec
      // un faux utilisateur créé par /api/onboarding, ce qui écrasait la
      // session réelle et causait des bugs (redirection vers landing page,
      // utilisateur déconnecté, etc.).

      set({
        isCompleted: true,
        generatedConfig: config,
        isSubmitting: false,
      });
    } catch (error) {
      set({
        submitError: error instanceof Error ? error.message : "Erreur inconnue",
        isSubmitting: false,
      });
    }
  },

  reset: () => {
    set({
      currentStepIndex: 0,
      isCompleted: false,
      isSubmitting: false,
      submitError: null,
      businessType: null,
      team: null,
      payments: null,
      stock: null,
      equipment: null,
      generatedConfig: null,
    });
  },

  // --- DÉRIVÉS ---
  currentStep: () => ONBOARDING_STEPS[get().currentStepIndex],
  canGoNext: () => {
    const { currentStepIndex, businessType, team, payments, stock, equipment } = get();
    switch (currentStepIndex) {
      case 0: return businessType !== null;
      case 1: return team !== null;
      case 2: return payments !== null;
      case 3: return stock !== null;
      case 4: return equipment !== null;
      default: return false;
    }
  },
  canGoPrev: () => get().currentStepIndex > 0,
  progress: () => Math.round(((get().currentStepIndex + 1) / TOTAL_STEPS) * 100),
}));
