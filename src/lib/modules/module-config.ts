// ============================================================
// YonuKom — Configuration centrale des modules activables (V3)
// Architecture hiérarchique : Superadmin > BusinessType > Client
//
// RÈGLE 1 : Pertinence Contextuelle — chaque module a applicableBusinessTypes
// RÈGLE 2 : Autonomie du Client — toggler uniquement ses modules pertinents
// RÈGLE 3 : Suprématie Superadmin — voit tout, peut override/lock
// ============================================================

import {
  ShoppingCart,
  Package,
  Warehouse,
  BarChart3,
  Smartphone,
  Globe,
  Truck,
  Utensils,
  Scissors,
  CreditCard,
  Users,
  Brain,
  MessageCircle,
  Printer,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

// --- Les BusinessType du système (doit matcher types/index.ts) ---
export type ApplicableBusinessType =
  | "all"
  | "retail_shop"
  | "fast_food"
  | "restaurant"
  | "salon"
  | "cosmetics"
  | "wholesaler"
  | "tiktok_seller"
  | "mobile_vendor"
  | "mixte";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  premium: boolean;
  defaultEnabled: boolean;
  /** Métiers pour lesquels ce module est pertinent. 'all' = tous les métiers. */
  applicableBusinessTypes: ApplicableBusinessType[];
}

export const MODULES_CONFIG = {
  // === Modules Transverses (tous les métiers) ===
  pos: {
    id: "pos",
    name: "Point de Vente",
    description: "Caisse enregistreuse rapide pour encaisser les ventes",
    icon: ShoppingCart,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["all"],
  },
  products: {
    id: "products",
    name: "Catalogue Produits",
    description: "Gestion des produits/services avec prix et catégories",
    icon: Package,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["all"],
  },
  stock: {
    id: "stock",
    name: "Gestion du Stock",
    description: "Suivi des quantités, alertes de rupture, mouvements",
    icon: Warehouse,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["all"],
  },
  reports: {
    id: "reports",
    name: "Rapports de Ventes",
    description: "CA journalier, mensuel, annuel, top produits",
    icon: BarChart3,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["all"],
  },
  debts: {
    id: "debts",
    name: "Dettes Clients",
    description: "Carnet de crédits et suivi des remboursements",
    icon: CreditCard,
    premium: false,
    defaultEnabled: false,
    applicableBusinessTypes: ["all"],
  },
  printing: {
    id: "printing",
    name: "Impression",
    description: "Tickets de caisse, factures, bons de livraison",
    icon: Printer,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["all"],
  },
  multi_users: {
    id: "multi_users",
    name: "Multi-utilisateurs",
    description: "Gestion des rôles (vendeur, gérant, comptable)",
    icon: Users,
    premium: true,
    defaultEnabled: false,
    applicableBusinessTypes: ["all"],
  },

  // === Modules Restaurant / Fast-food ===
  restaurant: {
    id: "restaurant",
    name: "Plats du Jour & Pertes",
    description: "Gestion des plats finis, déclarations de pertes, cuisine",
    icon: Utensils,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["restaurant", "fast_food"],
  },

  // === Modules Salon / Coiffure / Esthétique ===
  services: {
    id: "services",
    name: "Services & Prestations",
    description: "Vente de prestations sans stock (coiffure, soin, manucure)",
    icon: Scissors,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["salon", "cosmetics"],
  },
  salon_booking: {
    id: "salon_booking",
    name: "Calendrier & Rendez-vous",
    description: "Planning de RDV, créneaux, durée des prestations",
    icon: CalendarClock,
    premium: false,
    defaultEnabled: true,
    applicableBusinessTypes: ["salon", "cosmetics"],
  },

  // === Modules Grossiste / B2B ===
  wholesale: {
    id: "wholesale",
    name: "Devis & Factures B2B",
    description: "Pipeline devis → BL → facture, acomptes, stock réservé",
    icon: Truck,
    premium: true,
    defaultEnabled: true,
    applicableBusinessTypes: ["wholesaler"],
  },

  // === Modules E-Commerce / Vente en Ligne ===
  ecommerce: {
    id: "ecommerce",
    name: "Vente TikTok / WhatsApp",
    description: "Liens de paiement, suivi des commandes sociales, live selling",
    icon: Smartphone,
    premium: true,
    defaultEnabled: false,
    applicableBusinessTypes: ["retail_shop", "cosmetics", "tiktok_seller", "mobile_vendor"],
  },
  online_store: {
    id: "online_store",
    name: "Boutique en Ligne Publique",
    description: "Page web publique pour vos clients (yonukom.com/b/votre-boutique)",
    icon: Globe,
    premium: true,
    defaultEnabled: false,
    applicableBusinessTypes: ["retail_shop", "cosmetics", "tiktok_seller", "mobile_vendor", "restaurant", "fast_food", "salon"],
  },

  // === Modules Premium (tous métiers, payants) ===
  analytics_pro: {
    id: "analytics_pro",
    name: "Analytics Pro (IA)",
    description: "Prédictions de ventes, alertes intelligentes, tendances",
    icon: Brain,
    premium: true,
    defaultEnabled: false,
    applicableBusinessTypes: ["all"],
  },
  whatsapp_auto: {
    id: "whatsapp_auto",
    name: "WhatsApp Automatique",
    description: "Envoi automatique de reçus, rappels de dette, alerts stock",
    icon: MessageCircle,
    premium: true,
    defaultEnabled: false,
    applicableBusinessTypes: ["all"],
  },
} as const;

export type ModuleId = keyof typeof MODULES_CONFIG;
export const MODULE_IDS = Object.keys(MODULES_CONFIG) as ModuleId[];

/**
 * Vérifie si un module est applicable à un type de business.
 * 'all' dans applicableBusinessTypes = applicable à tous les métiers.
 */
export function isModuleApplicable(
  moduleId: ModuleId,
  businessType: string
): boolean {
  const config = MODULES_CONFIG[moduleId];
  if (!config) return false;
  return (
    config.applicableBusinessTypes.includes("all") ||
    config.applicableBusinessTypes.includes(businessType as ApplicableBusinessType) ||
    businessType === "mixte" // mixte = tous les modules
  );
}

/**
 * RÈGLE 1 + RÈGLE 2 : Génère le JSON initial des modules pour un tenant
 * en filtrant MODULES_CONFIG selon le businessType choisi à l'onboarding.
 * Seuls les modules applicables au métier sont inclus (enabled=defaultEnabled).
 * Les modules non-applicables sont ABSENTS du JSON (pas juste disabled).
 */
export function generateInitialModules(
  businessType: string
): Record<string, { enabled: boolean; locked: boolean }> {
  const result: Record<string, { enabled: boolean; locked: boolean }> = {};
  for (const id of MODULE_IDS) {
    if (isModuleApplicable(id, businessType)) {
      result[id] = {
        enabled: MODULES_CONFIG[id].defaultEnabled,
        locked: false,
      };
    }
  }
  return result;
}

// --- Alias pour rétro-compatibilité ---
export function buildDefaultModules() {
  return generateInitialModules("mixte");
}

export function buildModulesForBusinessType(businessType: string) {
  return generateInitialModules(businessType);
}

export function getRelevantModules(businessType: string): ModuleId[] {
  return MODULE_IDS.filter((id) => isModuleApplicable(id, businessType));
}

// --- Rétro-compat : BUSINESS_TYPE_MODULES (utilisé par app-shell TAB_MODULE_MAP) ---
export const BUSINESS_TYPE_MODULES: Record<string, ModuleId[]> = Object.fromEntries(
  ["retail_shop", "fast_food", "restaurant", "salon", "cosmetics", "wholesaler", "tiktok_seller", "mobile_vendor", "mixte"].map(
    (bt) => [bt, getRelevantModules(bt)]
  )
);
