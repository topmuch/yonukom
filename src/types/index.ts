// ============================================================
// YonuKom — Types partagés
// ============================================================

// --- RÔLES & PERMISSIONS ---

export type UserRole = "superadmin" | "patron" | "gerant" | "vendeur";

export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: "Superadmin",
  patron: "Patron",
  gerant: "Gérant",
  vendeur: "Vendeur",
};

/**
 * Permissions par rôle — règle anti-fraude :
 * - Un vendeur NE PEUT PAS supprimer une vente (uniquement annuler avec motif)
 * - Un vendeur ne voit PAS les prix d'achat ni les marges
 * - Un gérant gère le stock et la caisse
 * - Le patron voit tout
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  superadmin: {
    canViewPurchasePrice: true,
    canViewMargins: true,
    canDeleteSale: true,
    canCancelSale: true,
    canManageStock: true,
    canManageUsers: true,
    canCloseCashSession: true,
    canViewAuditLog: true,
    canManageProducts: true,
    canViewAllOrders: true,
    canChangeRoles: true,
  },
  patron: {
    canViewPurchasePrice: true,
    canViewMargins: true,
    canDeleteSale: true,
    canCancelSale: true,
    canManageStock: true,
    canManageUsers: true,
    canCloseCashSession: true,
    canViewAuditLog: true,
    canManageProducts: true,
    canViewAllOrders: true,
    canChangeRoles: true,
  },
  gerant: {
    canViewPurchasePrice: true,
    canViewMargins: true,
    canDeleteSale: false,
    canCancelSale: true,
    canManageStock: true,
    canManageUsers: false,
    canCloseCashSession: true,
    canViewAuditLog: true,
    canManageProducts: true,
    canViewAllOrders: true,
    canChangeRoles: false,
  },
  vendeur: {
    canViewPurchasePrice: false, // ⚠️ RÈGLE ANTI-FRADE
    canViewMargins: false,       // ⚠️ RÈGLE ANTI-FRADE
    canDeleteSale: false,        // ⚠️ JAMAIS — annulation avec motif uniquement
    canCancelSale: true,         // Possible mais avec motif OBLIGATOIRE
    canManageStock: false,
    canManageUsers: false,
    canCloseCashSession: false,
    canViewAuditLog: false,
    canManageProducts: false,
    canViewAllOrders: false,     // Ne voit que SES ventes
    canChangeRoles: false,
  },
};

export interface PermissionSet {
  canViewPurchasePrice: boolean;
  canViewMargins: boolean;
  canDeleteSale: boolean;
  canCancelSale: boolean;
  canManageStock: boolean;
  canManageUsers: boolean;
  canCloseCashSession: boolean;
  canViewAuditLog: boolean;
  canManageProducts: boolean;
  canViewAllOrders: boolean;
  canChangeRoles: boolean;
}

// --- TYPES DE BUSINESS ---

export type BusinessType = "ecommerce_social" | "pipeline_b2b" | "restaurant" | "mixte";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  ecommerce_social: "E-Commerce Social (TikTok/Live)",
  pipeline_b2b: "Pipeline B2B (Grossiste)",
  restaurant: "Restaurant / Traiteur",
  mixte: "Mixte (plusieurs activités)",
};

// --- STATUTS DE COMMANDE ---

/** Statuts pour le module E-Commerce Social */
export type EcomOrderStatus = "to_pay" | "to_ship" | "shipped" | "cancelled";

/** Statuts pour le module Pipeline B2B */
export type B2BOrderStatus = "draft" | "quote_validated" | "delivery_note" | "invoiced" | "cancelled";

/** Statuts pour le module Restaurant */
export type RestaurantOrderStatus = "pending" | "completed" | "cancelled";

export const ECOM_STATUS_LABELS: Record<EcomOrderStatus, string> = {
  to_pay: "À Payer",
  to_ship: "À Livrer",
  shipped: "Livré",
  cancelled: "Annulé",
};

export const ECOM_STATUS_COLORS: Record<EcomOrderStatus, string> = {
  to_pay: "orange",    // 🟠
  to_ship: "blue",     // 🔵
  shipped: "green",    // 🟢
  cancelled: "red",    // 🔴
};

export const B2B_STATUS_LABELS: Record<B2BOrderStatus, string> = {
  draft: "Brouillon",
  quote_validated: "Devis Validé",
  delivery_note: "Bon de Livraison",
  invoiced: "Facturé",
  cancelled: "Annulé",
};

// --- TYPES DE PRODUIT ---

export type ProductType = "standard" | "plate_restaurant" | "service";
export type UnitType = "piece" | "kg" | "litre" | "plat";

// --- MOYENS DE PAIEMENT ---

export type PaymentMethod = "cash" | "wave" | "orange_money" | "cb" | "cheque" | "virement";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  cb: "Carte Bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

// --- MOUVEMENTS DE STOCK ---

export type StockMovementType =
  | "sale"
  | "restock"
  | "reservation"
  | "reservation_release"
  | "loss"
  | "adjustment";

// --- ACTIONS D'AUDIT ---

export type AuditAction =
  | "sale_created"
  | "sale_cancelled"
  | "stock_adjustment"
  | "stock_loss"
  | "cash_open"
  | "cash_close"
  | "payment_received"
  | "role_change"
  | "login"
  | "login_failed"
  | "price_change"
  | "product_created";

// --- SYNC ---

export type SyncAction = "create" | "update" | "delete";
export type SyncEntityType = "order" | "payment" | "stock_movement" | "customer" | "product";

export interface SyncQueueEntry {
  id: string;
  action: SyncAction;
  entityType: SyncEntityType;
  entityId?: string;
  payload: string; // JSON string
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  isSynced: boolean;
  syncedAt?: Date;
  createdAt: Date;
}

// --- FCFA (Monnaie) ---

/**
 * Toutes les valeurs monétaires sont en FCFA et stockées en ENTIERS.
 * ⚠️ JAMAIS de flottants avec la monnaie — arrondi à l'unité la plus proche.
 * 1 EUR ≈ 655,957 FCFA (taux fixe)
 */
export type FCFA = number; // Alias sémantique — toujours un entier

// --- SUPERADMIN TYPES ---

export type SuperadminPage = "overview" | "tenants" | "tenant-detail" | "subscriptions" | "analytics" | "settings" | "logs" | "users" | "messages";

export type SubscriptionPlan = "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "expired" | "past_due" | "cancelled";
export type TenantBusinessType = "retail_shop" | "restaurant" | "wholesaler" | "tiktok_seller" | "ecommerce_social" | "mixte";

export const SUBSCRIPTION_PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export const SUBSCRIPTION_PLAN_PRICES: Record<SubscriptionPlan, number> = {
  starter: 5000,     // 5 000 FCFA/mois
  pro: 15000,        // 15 000 FCFA/mois
  enterprise: 50000, // 50 000 FCFA/mois
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  expired: "Expiré",
  past_due: "En retard",
  cancelled: "Annulé",
};

export const TENANT_TYPE_LABELS: Record<TenantBusinessType, string> = {
  retail_shop: "Boutique",
  restaurant: "Restaurant",
  wholesaler: "Grossiste",
  tiktok_seller: "Vendeur TikTok",
  ecommerce_social: "E-Commerce Social",
  mixte: "Mixte",
};

export interface TenantInfo {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessType: TenantBusinessType;
  config?: string;
  createdAt: string;
  subscription?: {
    id: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    amount: number;
    currentPeriodEnd: string;
  };
}

export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  mrr: number;
  activationRate: number;
  churnRate: number;
  pastDueCount: number;
  expiredCount: number;
  totalRevenue: number;
  revenueByMonth: { month: string; revenue: number }[];
  subscriptionBreakdown: { starter: number; pro: number; enterprise: number };
}

export interface ImpersonationState {
  isImpersonating: boolean;
  tenantId: string | null;
  tenantName: string | null;
  startedAt: string | null;
}
