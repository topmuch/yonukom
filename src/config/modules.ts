// ============================================================
// YonuKom — Module Config : Définitions & valeurs par défaut
// Active/masque les modules selon le type de business
// ============================================================

import type { BusinessType, PaymentMethod } from "@/types";
import type { ModuleConfig } from "@/types/onboarding";

/**
 * Définition complète d'un module YonuKom.
 * Utilisé pour afficher dynamiquement les modules dans l'UI.
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Nom d'icône Lucide
  color: string; // Couleur du module (thème)
  route: string; // Route principale du module
  /** Types de business pour lesquels ce module est actif par défaut */
  activeForBusinessTypes: BusinessType[];
}

/**
 * Modules disponibles dans YonuKom.
 */
export const MODULE_DEFINITIONS = {
  ecommerce_social: {
    id: "ecommerce_social",
    name: "E-Commerce Social",
    description: "Vente rapide via TikTok/Live, Kanban de commandes, WhatsApp",
    icon: "ShoppingBag",
    color: "orange",
    route: "/pos",
  },
  pipeline_b2b: {
    id: "pipeline_b2b",
    name: "Pipeline B2B",
    description: "Devis → Validation → BL → Facture, Acomptes, Stock Réservé",
    icon: "Building2",
    color: "blue",
    route: "/pipeline",
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant",
    description: "Plats finis, Déclarer une perte, Vente rapide",
    icon: "UtensilsCrossed",
    color: "emerald",
    route: "/restaurant",
  },
} as const;

/**
 * Génère la config complète des modules à partir du type de business
 * et des choix de l'utilisateur pendant l'onboarding.
 */
export function generateModuleConfig(params: {
  businessType: BusinessType;
  paymentMethods: PaymentMethod[];
  primaryPaymentMethod: PaymentMethod;
  trackStock: boolean;
  lowStockAlert: boolean;
  alertThreshold: number;
  teamRoles: ("patron" | "gerant" | "vendeur")[];
  needCashRegister: boolean;
  language: "fr" | "wo" | "en";
  useReceiptPrinter: boolean;
  useBarcodeScanner: boolean;
  waveNumber?: string;
  orangeMoneyNumber?: string;
  manageReservations?: boolean;
}): ModuleConfig {
  const { businessType } = params;

  // Activation des modules selon le type de business
  const moduleFlags: Pick<ModuleConfig, "ecommerce_social" | "pipeline_b2b" | "restaurant"> = {
    ecommerce_social: businessType === "ecommerce_social" || businessType === "mixte",
    pipeline_b2b: businessType === "pipeline_b2b" || businessType === "mixte",
    restaurant: businessType === "restaurant" || businessType === "mixte",
  };

  return {
    ...moduleFlags,
    payments: {
      methods: params.paymentMethods,
      primaryMethod: params.primaryPaymentMethod,
      waveNumber: params.waveNumber,
      orangeMoneyNumber: params.orangeMoneyNumber,
    },
    stock: {
      enabled: params.trackStock,
      lowStockAlert: params.lowStockAlert,
      alertThreshold: params.alertThreshold,
      // ⚠️ Les réservations sont activées si pipeline_b2b est actif
      manageReservations: params.manageReservations ?? moduleFlags.pipeline_b2b,
    },
    team: {
      roles: params.teamRoles,
      needCashRegister: params.needCashRegister,
    },
    preferences: {
      language: params.language,
      currency: "XOF",
      useReceiptPrinter: params.useReceiptPrinter,
      useBarcodeScanner: params.useBarcodeScanner,
    },
  };
}

/**
 * Retourne la liste des modules actifs pour une config donnée.
 */
export function getActiveModules(config: ModuleConfig): string[] {
  const active: string[] = [];
  if (config.ecommerce_social) active.push("ecommerce_social");
  if (config.pipeline_b2b) active.push("pipeline_b2b");
  if (config.restaurant) active.push("restaurant");
  return active;
}
