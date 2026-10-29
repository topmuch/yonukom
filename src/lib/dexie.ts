// ============================================================
// YonuKom — Dexie.js : Base de données locale (IndexedDB)
// Offline-First : toutes les écritures passent d'abord par ici
// ============================================================

import Dexie, { type Table } from "dexie";

// --- Types locaux pour IndexedDB ---

/** Commande locale (créée offline ou cache) */
export interface LocalOrder {
  id: string; // CUID généré localement
  orderNumber: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: LocalOrderItem[];
  isCancelled: boolean;
  cancellationReason?: string;
  isDelivered: boolean;
  paymentLink?: string;
  whatsappSent: boolean;
  isOfflineCreated: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date; // null = pas encore synchronisé
}

export interface LocalOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

/** Produit local (cache pour recherche rapide offline) */
export interface LocalProduct {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  salePrice: number;
  purchasePrice: number;
  quantity: number;
  reservedQuantity: number;
  productType: string;
  unitType: string;
  isActive: boolean;
  updatedAt: Date;
  syncedAt?: Date;
}

/** Client local (cache) */
export interface LocalCustomer {
  id: string;
  name: string;
  phone: string;
  paymentMethod?: string;
  isB2B: boolean;
  favoriteProductIds?: string;
  updatedAt: Date;
  syncedAt?: Date;
}

/** Paiement local */
export interface LocalPayment {
  id: string;
  orderId: string;
  amount: number;
  method: string;
  reference?: string;
  isDeposit: boolean;
  receivedBy?: string;
  isOfflineCreated: boolean;
  createdAt: Date;
  syncedAt?: Date;
}

/** Mouvement de stock local */
export interface LocalStockMovement {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  isLoss: boolean;
  productId: string;
  orderId?: string;
  userId?: string;
  isOfflineCreated: boolean;
  createdAt: Date;
  syncedAt?: Date;
}

// --- DONNÉES HISTORIQUES (IA LOCALE) ---

/** Historique des ventes journalières (pour analyse IA) */
export interface SalesHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  date: string;        // YYYY-MM-DD
  employeeId?: string;
  employeeName?: string;
  paymentMethod?: string;
  isCancelled: boolean;
  syncedAt?: Date;
}

/** Historique du stock (snapshots quotidiens) */
export interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  date: string;        // YYYY-MM-DD
  syncedAt?: Date;
}

/** Historique du revenu journalier (pour tendances) */
export interface RevenueHistoryEntry {
  id: string;
  date: string;        // YYYY-MM-DD
  revenue: number;     // FCFA
  orderCount: number;
  syncedAt?: Date;
}

// --- ACTION EN ATTENTE DE SYNC ---

export interface PendingAction {
  id: string; // Auto-incrementé par Dexie
  action: "create" | "update" | "delete";
  entityType: "order" | "payment" | "stock_movement" | "customer" | "product";
  entityId: string;
  payload: string; // JSON string de l'entité
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
}

// --- BASE DE DONNÉES DEXIE ---

class YonuKomDB extends Dexie {
  // Tables
  orders!: Table<LocalOrder, string>;
  products!: Table<LocalProduct, string>;
  customers!: Table<LocalCustomer, string>;
  payments!: Table<LocalPayment, string>;
  stockMovements!: Table<LocalStockMovement, string>;
  pendingActions!: Table<PendingAction, string>;
  // Tables historiques (IA Locale)
  salesHistory!: Table<SalesHistoryEntry, string>;
  stockHistory!: Table<StockHistoryEntry, string>;
  revenueHistory!: Table<RevenueHistoryEntry, string>;

  constructor() {
    super("YonuKomDB");

    // Version 1 — schéma initial
    this.version(1).stores({
      // Index : champs indexés pour requêtes rapides
      orders: "id, orderNumber, status, customerId, createdAt, syncedAt",
      products: "id, name, sku, category, productType, isActive, syncedAt",
      customers: "id, name, phone, isB2B, syncedAt",
      payments: "id, orderId, method, createdAt, syncedAt",
      stockMovements: "id, type, productId, createdAt, syncedAt",
      // pendingActions : file d'attente des actions à synchroniser
      pendingActions: "++id, action, entityType, entityId, createdAt",
    });

    // Version 2 — ajout des tables historiques pour l'IA locale
    this.version(2).stores({
      orders: "id, orderNumber, status, customerId, createdAt, syncedAt",
      products: "id, name, sku, category, productType, isActive, syncedAt",
      customers: "id, name, phone, isB2B, syncedAt",
      payments: "id, orderId, method, createdAt, syncedAt",
      stockMovements: "id, type, productId, createdAt, syncedAt",
      pendingActions: "++id, action, entityType, entityId, createdAt",
      // Tables IA@historiques IA
      salesHistory: "id, productId, date, employeeId, paymentMethod",
      stockHistory: "id, productId, date",
      revenueHistory: "id, date",
    });
  }
}

// --- INSTANCE SINGLETON ---

export const localDB = new YonuKomDB();

// --- HELPERS ---

/**
 * Vérifie si une entité a été synchronisée avec le serveur.
 * Si syncedAt est null/undefined, l'entité est en attente de sync.
 */
export function isSynced(entity: { syncedAt?: Date | null }): boolean {
  return entity.syncedAt != null;
}

/**
 * Compte le nombre d'actions en attente de synchronisation.
 * Utilisé pour afficher le badge "X actions en attente".
 */
export async function getPendingActionCount(): Promise<number> {
  return localDB.pendingActions.count();
}

/**
 * Récupère toutes les actions en attente, triées par date de création.
 */
export async function getPendingActions(): Promise<PendingAction[]> {
  return localDB.pendingActions.orderBy("createdAt").toArray();
}

/**
 * Supprime une action de la file d'attente après synchronisation réussie.
 */
export async function removePendingAction(id: string): Promise<void> {
  await localDB.pendingActions.delete(id);
}

/**
 * Incrémente le compteur de tentatives et enregistre l'erreur.
 */
export async function markActionRetry(
  id: string,
  error: string
): Promise<void> {
  await localDB.pendingActions.update(id, (action) => {
    action.retryCount++;
    action.lastError = error;
  });
}

/**
 * Vide toute la base locale (utile pour déconnexion/réinitialisation).
 */
export async function clearLocalDB(): Promise<void> {
  await localDB.orders.clear();
  await localDB.products.clear();
  await localDB.customers.clear();
  await localDB.payments.clear();
  await localDB.stockMovements.clear();
  await localDB.pendingActions.clear();
}
