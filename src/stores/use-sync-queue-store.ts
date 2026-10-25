// ============================================================
// YonuKom — Store Zustand : File d'attente des actions offline
// Offline-First : les écritures sont d'abord sauvegardées dans
// Dexie.js (IndexedDB), puis mises dans cette file d'attente
// pour être synchronisées quand le réseau revient.
// ============================================================

import { create } from "zustand";
import type { SyncAction, SyncEntityType } from "@/types";

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  entityType: SyncEntityType;
  entityId: string;
  payload: string; // JSON string
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: Date;
}

export interface SyncQueueState {
  // --- ÉTAT ---
  /** Actions en attente de synchronisation */
  pendingItems: SyncQueueItem[];
  /** Nombre d'actions en attente (dérivé de pendingItems.length) */
  pendingCount: number;
  /** Une synchronisation est-elle en cours ? */
  isSyncing: boolean;
  /** Date/heure de la dernière synchronisation réussie */
  lastSyncAt: Date | null;
  /** Nombre d'actions synchronisées avec succès (dernière session) */
  lastSyncSuccessCount: number;
  /** Nombre d'actions en échec (dernière session) */
  lastSyncErrorCount: number;
  /** Erreur globale de synchronisation */
  syncError: string | null;

  // --- ACTIONS ---
  /** Ajouter une action à la file d'attente */
  enqueue: (item: Omit<SyncQueueItem, "id" | "retryCount" | "maxRetries" | "createdAt">) => string;
  /** Retirer une action de la file (après sync réussie) */
  dequeue: (id: string) => void;
  /** Marquer une action en échec avec son erreur */
  markFailed: (id: string, error: string) => void;
  /** Incrémenter le compteur de tentatives */
  incrementRetry: (id: string) => void;
  /** Lancer la synchronisation de toutes les actions en attente */
  startSync: () => Promise<void>;
  /** Réinitialiser l'état de synchronisation */
  resetSyncState: () => void;
  /** Charger les actions depuis Dexie (au démarrage) */
  loadFromDexie: () => Promise<void>;
}

// --- GÉNÉRATEUR D'ID LOCAL ---
// Simple compteur + timestamp pour générer des IDs uniques côté client
let localIdCounter = 0;
function generateLocalId(): string {
  localIdCounter++;
  return `local_${Date.now()}_${localIdCounter}`;
}

export const useSyncQueueStore = create<SyncQueueState>((set, get) => ({
  // --- ÉTAT INITIAL ---
  pendingItems: [],
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,
  lastSyncSuccessCount: 0,
  lastSyncErrorCount: 0,
  syncError: null,

  // --- ACTIONS ---

  enqueue: (item) => {
    const id = generateLocalId();
    const newItem: SyncQueueItem = {
      ...item,
      id,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };

    set((state) => ({
      pendingItems: [...state.pendingItems, newItem],
      pendingCount: state.pendingCount + 1,
    }));

    // Persister dans Dexie.js (IndexedDB) pour survie au rechargement
    persistToDexie(newItem);

    return id;
  },

  dequeue: (id) => {
    set((state) => {
      const newItems = state.pendingItems.filter((item) => item.id !== id);
      return {
        pendingItems: newItems,
        pendingCount: newItems.length,
        lastSyncSuccessCount: state.lastSyncSuccessCount + 1,
      };
    });

    // Retirer de Dexie
    removeFromDexie(id);
  },

  markFailed: (id, error) => {
    set((state) => ({
      pendingItems: state.pendingItems.map((item) =>
        item.id === id ? { ...item, lastError: error } : item
      ),
      lastSyncErrorCount: state.lastSyncErrorCount + 1,
      syncError: error,
    }));

    // Mettre à jour dans Dexie
    updateInDexie(id, { lastError: error });
  },

  incrementRetry: (id) => {
    set((state) => ({
      pendingItems: state.pendingItems.map((item) =>
        item.id === id ? { ...item, retryCount: item.retryCount + 1 } : item
      ),
    }));

    updateInDexie(id, { retryCountIncrement: true });
  },

  startSync: async () => {
    const state = get();

    // Ne pas lancer si déjà en cours ou si pas d'actions en attente
    if (state.isSyncing || state.pendingItems.length === 0) return;

    // Vérifier qu'on est en ligne
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      set({ syncError: "Pas de connexion réseau" });
      return;
    }

    set({
      isSyncing: true,
      syncError: null,
      lastSyncSuccessCount: 0,
      lastSyncErrorCount: 0,
    });

    const items = get().pendingItems;

    for (const item of items) {
      // Sauter si max retries atteint
      if (item.retryCount >= item.maxRetries) {
        get().markFailed(item.id, `Max retries (${item.maxRetries}) atteint`);
        continue;
      }

      try {
        // Envoyer l'action au serveur
        const response = await fetch("/api/sync?XTransformPort=3000", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: item.action,
            entityType: item.entityType,
            entityId: item.entityId,
            payload: item.payload,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          get().incrementRetry(item.id);
          get().markFailed(item.id, errorText);
          continue;
        }

        // Succès — retirer de la file
        get().dequeue(item.id);
      } catch (error) {
        // Erreur réseau — incrémenter retry
        get().incrementRetry(item.id);
        get().markFailed(
          item.id,
          error instanceof Error ? error.message : "Erreur réseau"
        );
      }
    }

    set({
      isSyncing: false,
      lastSyncAt: new Date(),
    });
  },

  resetSyncState: () => {
    set({
      isSyncing: false,
      syncError: null,
      lastSyncSuccessCount: 0,
      lastSyncErrorCount: 0,
    });
  },

  loadFromDexie: async () => {
    try {
      const { localDB } = await import("@/lib/dexie");
      const actions = await localDB.pendingActions.toArray();

      const items: SyncQueueItem[] = actions.map((a) => ({
        id: String(a.id),
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        payload: a.payload,
        retryCount: a.retryCount,
        maxRetries: a.maxRetries,
        lastError: a.lastError,
        createdAt: a.createdAt,
      }));

      set({
        pendingItems: items,
        pendingCount: items.length,
      });
    } catch (error) {
      console.error("[YonuKom] Erreur chargement Dexie:", error);
    }
  },
}));

// --- HELPERS DE PERSISTENCE DEXIE ---

async function persistToDexie(item: SyncQueueItem): Promise<void> {
  try {
    const { localDB } = await import("@/lib/dexie");
    await localDB.pendingActions.add({
      ...item,
      id: undefined as unknown as string, // Dexie auto-incrémente
    });
  } catch (error) {
    console.error("[YonuKom] Erreur persistence Dexie:", error);
  }
}

async function removeFromDexie(id: string): Promise<void> {
  try {
    const { localDB } = await import("@/lib/dexie");
    await localDB.pendingActions.where("entityId").equals(id).delete();
  } catch (error) {
    console.error("[YonuKom] Erreur suppression Dexie:", error);
  }
}

async function updateInDexie(
  id: string,
  update: { lastError?: string; retryCountIncrement?: boolean }
): Promise<void> {
  try {
    const { localDB } = await import("@/lib/dexie");
    const existing = await localDB.pendingActions
      .where("entityId")
      .equals(id)
      .first();

    if (existing) {
      const changes: Record<string, unknown> = {};
      if (update.lastError) changes.lastError = update.lastError;
      if (update.retryCountIncrement)
        changes.retryCount = (existing.retryCount || 0) + 1;

      await localDB.pendingActions.update(existing.id, changes);
    }
  } catch (error) {
    console.error("[YonuKom] Erreur mise à jour Dexie:", error);
  }
}
