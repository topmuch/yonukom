// ============================================================
// YonuKom — Configuration centrale des modules activables
// Chaque module peut être activé/désactivé par le tenant ou le superadmin.
// Le superadmin peut "locker" un module (inclus dans l'abonnement).
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
  type LucideIcon,
} from "lucide-react";

export interface ModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  premium: boolean;
  defaultEnabled: boolean;
}

export const MODULES_CONFIG = {
  pos: {
    id: "pos",
    name: "Point de Vente",
    description: "Caisse enregistreuse rapide pour encaisser les ventes",
    icon: ShoppingCart,
    premium: false,
    defaultEnabled: true,
  },
  products: {
    id: "products",
    name: "Gestion des Produits",
    description: "Catalogue de produits avec prix et catégories",
    icon: Package,
    premium: false,
    defaultEnabled: true,
  },
  stock: {
    id: "stock",
    name: "Gestion du Stock",
    description: "Suivi des quantités et alertes de rupture",
    icon: Warehouse,
    premium: false,
    defaultEnabled: true,
  },
  reports: {
    id: "reports",
    name: "Rapports de Ventes",
    description: "CA journalier, mensuel et annuel",
    icon: BarChart3,
    premium: false,
    defaultEnabled: true,
  },
  ecommerce: {
    id: "ecommerce",
    name: "Vente en Ligne (TikTok/WhatsApp)",
    description: "Génération de liens de paiement et suivi des commandes sociales",
    icon: Smartphone,
    premium: true,
    defaultEnabled: false,
  },
  online_store: {
    id: "online_store",
    name: "Boutique en Ligne Publique",
    description: "Page web publique pour vos clients (yonukom.com/votre-boutique)",
    icon: Globe,
    premium: true,
    defaultEnabled: false,
  },
  wholesale: {
    id: "wholesale",
    name: "Grossiste B2B",
    description: "Devis, factures, bons de livraison et acomptes",
    icon: Truck,
    premium: true,
    defaultEnabled: false,
  },
  restaurant: {
    id: "restaurant",
    name: "Restaurant / Fast-food",
    description: "Gestion des plats du jour et déclarations de pertes",
    icon: Utensils,
    premium: false,
    defaultEnabled: false,
  },
  services: {
    id: "services",
    name: "Services (Coiffeur, Salon)",
    description: "Vente de prestations sans gestion de stock",
    icon: Scissors,
    premium: false,
    defaultEnabled: false,
  },
  debts: {
    id: "debts",
    name: "Dettes Clients",
    description: "Carnet de crédits et suivi des paiements",
    icon: CreditCard,
    premium: false,
    defaultEnabled: false,
  },
  multi_users: {
    id: "multi_users",
    name: "Multi-utilisateurs",
    description: "Gestion des rôles (vendeur, gérant, comptable)",
    icon: Users,
    premium: true,
    defaultEnabled: false,
  },
  analytics_pro: {
    id: "analytics_pro",
    name: "Analytics Pro (IA)",
    description: "Prédictions de ventes, alertes intelligentes, tendances",
    icon: Brain,
    premium: true,
    defaultEnabled: false,
  },
  whatsapp_auto: {
    id: "whatsapp_auto",
    name: "WhatsApp Automatique",
    description: "Envoi automatique de messages et liens de paiement",
    icon: MessageCircle,
    premium: true,
    defaultEnabled: false,
  },
  printing: {
    id: "printing",
    name: "Impression",
    description: "Tickets de caisse, factures, bons de livraison",
    icon: Printer,
    premium: false,
    defaultEnabled: true,
  },
} as const;

export type ModuleId = keyof typeof MODULES_CONFIG;

/** Liste ordonnée des IDs de modules (pour itérer) */
export const MODULE_IDS = Object.keys(MODULES_CONFIG) as ModuleId[];

/**
 * Construit l'objet JSON des modules avec les valeurs par défaut
 * (defaultEnabled + locked:false pour chaque module).
 * Utilisé quand un tenant n'a pas encore de `modules` (null en DB).
 */
export function buildDefaultModules(): Record<
  ModuleId,
  { enabled: boolean; locked: boolean }
> {
  const result = {} as Record<ModuleId, { enabled: boolean; locked: boolean }>;
  for (const id of MODULE_IDS) {
    result[id] = {
      enabled: MODULES_CONFIG[id].defaultEnabled,
      locked: false,
    };
  }
  return result;
}
