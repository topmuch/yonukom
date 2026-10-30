// ============================================================
// YonuKom — Types Onboarding & Configuration Modules
// ============================================================

import type { BusinessType, PaymentMethod } from "./index";

// --- ÉTAPES D'ONBOARDING ---

export const ONBOARDING_STEPS = [
  "business_type",  // Étape 1: Type de business
  "team",           // Étape 2: Équipe & rôles
  "payments",       // Étape 3: Moyens de paiement acceptés
  "stock",          // Étape 4: Gestion stock
  "equipment",      // Étape 5: Matériel & préférences
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  business_type: "Type de business",
  team: "Équipe & rôles",
  payments: "Moyens de paiement",
  stock: "Gestion du stock",
  equipment: "Matériel & préférences",
};

// --- RÉPONSES PAR ÉTAPE ---

export interface OnboardingBusinessType {
  type: BusinessType;
  subTypes?: string[]; // Ex: ["cosmetiques", "vetements"] pour e-com social
  sellOnSocialMedia?: boolean; // Vend sur TikTok/Facebook/WhatsApp ?
  liveSelling?: boolean; // Fait du live selling ?
}

export interface OnboardingTeam {
  teamSize: number; // Nombre de personnes
  roles: ("patron" | "gerant" | "vendeur")[]; // Rôles à créer
  needCashRegister?: boolean; // Besoin de clôture de caisse ?
}

export interface OnboardingPayments {
  methods: PaymentMethod[]; // Moyens acceptés
  primaryMethod: PaymentMethod; // Moyen principal
  waveNumber?: string; // Numéro Wave
  orangeMoneyNumber?: string; // Numéro OM
}

export interface OnboardingStock {
  trackStock: boolean; // Suivre le stock ?
  lowStockAlert: boolean; // Alerte stock bas ?
  alertThreshold: number; // Seuil d'alerte
  manageReservations?: boolean; // Stock réservé B2B ?
}

export interface OnboardingEquipment {
  useReceiptPrinter?: boolean; // Imprimante ticket ?
  useBarcodeScanner?: boolean; // Scanner code-barres ?
  language: "fr" | "wo" | "en"; // Langue interface (wolof supporté !)
  currency: "XOF"; // Toujours FCFA pour le Sénégal
}

// --- CONFIGURATION GÉNÉRÉE ---

/**
 * Configuration finale générée à la fin de l'onboarding.
 * Cet objet est stocké dans Business.onboardingConfig (JSON).
 * Il active/masque dynamiquement les modules et adapte l'UI.
 */
export interface ModuleConfig {
  // Modules actifs
  ecommerce_social: boolean;
  pipeline_b2b: boolean;
  restaurant: boolean;
  /** Module Rendez-vous / Planning (salons, instituts — services avec durée) */
  appointments: boolean;

  // Sous-configuration
  payments: {
    methods: PaymentMethod[];
    primaryMethod: PaymentMethod;
    waveNumber?: string;
    orangeMoneyNumber?: string;
  };

  stock: {
    enabled: boolean;
    lowStockAlert: boolean;
    alertThreshold: number;
    manageReservations: boolean; // true si pipeline_b2b actif
  };

  team: {
    roles: ("patron" | "gerant" | "vendeur")[];
    needCashRegister: boolean;
  };

  preferences: {
    language: "fr" | "wo" | "en";
    currency: "XOF";
    useReceiptPrinter: boolean;
    useBarcodeScanner: boolean;
  };

  // Sous-types business (affichage dynamique)
  subTypes?: string[];
  sellOnSocialMedia?: boolean;
  liveSelling?: boolean;
}

// --- CONFIG PAR DÉFAUT SELON TYPE ---

export const DEFAULT_CONFIGS: Partial<Record<BusinessType, Partial<ModuleConfig>>> = {
  ecommerce_social: {
    ecommerce_social: true,
    pipeline_b2b: false,
    restaurant: false,
    stock: {
      enabled: true,
      lowStockAlert: true,
      alertThreshold: 5,
      manageReservations: false,
    },
  },
  pipeline_b2b: {
    ecommerce_social: false,
    pipeline_b2b: true,
    restaurant: false,
    stock: {
      enabled: true,
      lowStockAlert: true,
      alertThreshold: 10,
      manageReservations: true, // ⚠️ Réservations activées pour B2B
    },
  },
  restaurant: {
    ecommerce_social: false,
    pipeline_b2b: false,
    restaurant: true,
    stock: {
      enabled: true,
      lowStockAlert: true,
      alertThreshold: 5,
      manageReservations: false,
    },
  },
  mixte: {
    ecommerce_social: true,
    pipeline_b2b: true,
    restaurant: true,
    stock: {
      enabled: true,
      lowStockAlert: true,
      alertThreshold: 5,
      manageReservations: true,
    },
  },
};

// --- WIZARD STATE ---

export interface OnboardingState {
  currentStep: number; // 0-4 (index dans ONBOARDING_STEPS)
  isCompleted: boolean;
  businessType?: OnboardingBusinessType;
  team?: OnboardingTeam;
  payments?: OnboardingPayments;
  stock?: OnboardingStock;
  equipment?: OnboardingEquipment;
  generatedConfig?: ModuleConfig;
}
