// ============================================================
// YonuKom — Hook : Détection du statut en ligne/hors ligne
// Abonnement automatique au store de connectivité
// ============================================================

"use client";

import { useEffect } from "react";
import { useConnectivityStore } from "@/stores/use-connectivity-store";
import { useSyncQueueStore } from "@/stores/use-sync-queue-store";

/**
 * Hook qui initialise la détection du réseau et la synchronisation
 * automatique quand le réseau revient.
 * 
 * À appeler une seule fois dans le layout racine.
 */
export function useOnlineStatus() {
  const initialize = useConnectivityStore((s) => s.initialize);
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const startSync = useSyncQueueStore((s) => s.startSync);
  const loadFromDexie = useSyncQueueStore((s) => s.loadFromDexie);

  // Initialiser la détection réseau
  useEffect(() => {
    initialize();
    loadFromDexie();
  }, [initialize, loadFromDexie]);

  // Synchronisation automatique quand le réseau revient
  useEffect(() => {
    if (!isOnline) return;

    // Petit délai pour laisser le réseau se stabiliser
    const timeout = setTimeout(() => {
      startSync();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isOnline, startSync]);

  return { isOnline };
}

/**
 * Hook simplifié qui retourne juste le statut en ligne.
 * Composant léger pour re-rendu minimal.
 */
export function useIsOnline() {
  return useConnectivityStore((s) => s.isOnline);
}
