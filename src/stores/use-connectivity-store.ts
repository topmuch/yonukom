// ============================================================
// YonuKom — Store Zustand : Connectivité (Online/Offline)
// Indicateur de connexion visible en permanence :
// 🟢 En ligne / 🔴 Mode Hors Ligne
// ============================================================

import { create } from "zustand";

export interface ConnectivityState {
  // --- ÉTAT ---
  /** Le navigateur est-il en ligne ? */
  isOnline: boolean;
  /** Date/heure de la dernière perte de connexion */
  lastOfflineAt: Date | null;
  /** Date/heure de la dernière reconnexion */
  lastOnlineAt: Date | null;
  /** L'utilisateur a-t-il été averti du mode offline ? */
  hasShownOfflineWarning: boolean;

  // --- ACTIONS ---
  /** Passer en mode en ligne (appelé par l'événement 'online') */
  goOnline: () => void;
  /** Passer en mode hors ligne (appelé par l'événement 'offline') */
  goOffline: () => void;
  /** Accuser réception de l'avertissement offline */
  acknowledgeOfflineWarning: () => void;
  /** Forcer la détection initiale (à l'initialisation du provider) */
  initialize: () => void;
}

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  // --- ÉTAT INITIAL ---
  isOnline: true, // Optimiste — sera corrigé à l'init
  lastOfflineAt: null,
  lastOnlineAt: null,
  hasShownOfflineWarning: false,

  // --- ACTIONS ---
  goOnline: () => {
    set({
      isOnline: true,
      lastOnlineAt: new Date(),
      hasShownOfflineWarning: false, // Reset du warning
    });

    // Déclencher la synchronisation automatique quand le réseau revient
    // Le sync-engine écoutera ce changement via un abonnement
    if (typeof window !== "undefined") {
      // Émettre un événement custom pour que le sync-engine se déclenche
      window.dispatchEvent(new CustomEvent("yonukom:online"));
    }
  },

  goOffline: () => {
    const now = new Date();
    set({
      isOnline: false,
      lastOfflineAt: now,
      hasShownOfflineWarning: false,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("yonukom:offline"));
    }
  },

  acknowledgeOfflineWarning: () => {
    set({ hasShownOfflineWarning: true });
  },

  initialize: () => {
    if (typeof window === "undefined") return;

    // Détection initiale de l'état du réseau
    const isCurrentlyOnline = navigator.onLine;
    set({ isOnline: isCurrentlyOnline });

    // Écouter les changements de connexion
    window.addEventListener("online", () => {
      get().goOnline();
    });

    window.addEventListener("offline", () => {
      get().goOffline();
    });

    // Vérification périodique (toutes les 30s) via fetch
    // Au cas où navigator.onLine ne serait pas fiable
    const checkInterval = setInterval(async () => {
      try {
        // Tentative de fetch légère vers le serveur
        const response = await fetch("/api/health", {
          method: "HEAD",
          cache: "no-store",
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (response.ok && !get().isOnline) {
          get().goOnline();
        }
      } catch {
        // Le serveur est injoignable — si on se croit en ligne, passer offline
        if (get().isOnline) {
          get().goOffline();
        }
      }
    }, 30_000); // Toutes les 30 secondes

    // Nettoyage à la destruction (pas critique en SPA mais bonne pratique)
    return () => clearInterval(checkInterval);
  },
}));
