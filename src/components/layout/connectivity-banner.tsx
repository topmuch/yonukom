// ============================================================
// YonuKom — ConnectivityBanner
// 🟢 En ligne / 🔴 Mode Hors Ligne
// TOUJOURS visible en haut de l'écran
// ============================================================

"use client";

import { useConnectivityStore } from "@/stores/use-connectivity-store";
import { useSyncQueueStore } from "@/stores/use-sync-queue-store";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ConnectivityBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const pendingCount = useSyncQueueStore((s) => s.pendingCount);
  const isSyncing = useSyncQueueStore((s) => s.isSyncing);
  const lastSyncAt = useSyncQueueStore((s) => s.lastSyncAt);
  const acknowledgeOfflineWarning = useConnectivityStore((s) => s.acknowledgeOfflineWarning);
  const hasShownOfflineWarning = useConnectivityStore((s) => s.hasShownOfflineWarning);

  const formatLastSync = () => {
    if (!lastSyncAt) return "";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSyncAt.getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    return `il y a ${Math.floor(diff / 3600)}h`;
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-yk-amber/10 border-b border-yk-amber/30 px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-yk-amber/20">
                <WifiOff className="w-3.5 h-3.5 text-yk-amber" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-yk-amber">
                  Mode Hors Ligne
                </span>
                <span className="text-xs text-yk-amber/70">
                  Vos données seront synchronisées automatiquement
                </span>
              </div>
            </div>
            {pendingCount > 0 && (
              <span className="text-xs font-medium bg-yk-amber/20 text-yk-amber px-2 py-1 rounded-full">
                {pendingCount} en attente
              </span>
            )}
            {!hasShownOfflineWarning && (
              <button
                onClick={acknowledgeOfflineWarning}
                className="text-xs underline text-yk-amber/80 hover:text-yk-amber"
              >
                Compris
              </button>
            )}
          </div>
        </motion.div>
      )}

      {isOnline && pendingCount > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-yk-emerald/5 border-b border-yk-emerald/20 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 text-yk-emerald ${isSyncing ? "animate-spin" : ""}`} />
              <span className="text-sm text-yk-emerald">
                {isSyncing
                  ? "Synchronisation en cours..."
                  : `${pendingCount} action${pendingCount > 1 ? "s" : ""} en attente de sync`}
              </span>
            </div>
            {lastSyncAt && !isSyncing && (
              <span className="text-xs text-muted-foreground">
                Dernière sync {formatLastSync()}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Petit indicateur compact pour les headers/sidebar
 */
export function ConnectivityDot() {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  return (
    <div className="flex items-center gap-1.5" title={isOnline ? "En ligne" : "Hors ligne"}>
      <div
        className={`w-2.5 h-2.5 rounded-full ${
          isOnline
            ? "bg-yk-emerald shadow-[0_0_6px_oklch(0.57_0.17_162)]"
            : "bg-yk-amber animate-pulse-offline"
        }`}
      />
      <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
        {isOnline ? "En ligne" : "Hors ligne"}
      </span>
    </div>
  );
}
