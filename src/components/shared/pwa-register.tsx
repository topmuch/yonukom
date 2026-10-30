// ============================================================
// YonuKom — PWA Register
// Enregistre le service worker et gère les notifications de mise à jour
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaRegister() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // En environnement de développement Next.js, /sw.js est servi par le
    // serveur de dev depuis /public. On l'enregistre avec un scope "/".
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        setRegistration(reg);

        // Listen for updates
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // Une nouvelle version est prête
                setUpdateAvailable(true);
                setShowUpdate(true);
              }
            }
          });
        });

        // Also check periodically (every 60s) for updates
        const interval = setInterval(() => {
          reg.update().catch(() => {
            // Silent fail — offline or other transient error
          });
        }, 60_000);

        // Listen for controller change (new SW took control)
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            // Force reload once the new SW is active
            // (we let the user trigger it via the toast to avoid losing state)
          });
        }

        return () => clearInterval(interval);
      } catch (err) {
        // SW registration failed — fail silently in dev
        console.warn("[PWA] Service worker registration failed:", err);
      }
    };

    register();
  }, []);

  const handleUpdate = async () => {
    if (!registration?.waiting) {
      setShowUpdate(false);
      return;
    }
    // Tell the waiting SW to skip waiting → activate
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
    // Listen for the controller change, then reload
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      }, { once: true });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    setUpdateAvailable(false);
  };

  return (
    <AnimatePresence>
      {showUpdate && updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-4 right-4 z-[100] sm:left-auto sm:right-4 sm:w-96 pointer-events-auto"
        >
          <div className="rounded-xl bg-white shadow-2xl border border-[#E91E63]/20 overflow-hidden">
            {/* Gradient top strip */}
            <div className="h-1 bg-gradient-to-r from-[#E91E63] via-cyan-400 to-yk-emerald" />
            <div className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#E91E63] to-cyan-500 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">Mise à jour disponible</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Une nouvelle version de YonuKom est prête.
                </p>
              </div>
              <Button
                size="sm"
                className="h-7 text-xs gap-1 shrink-0 bg-gradient-to-r from-[#E91E63] to-cyan-500 hover:from-[#E91E63]/90 hover:to-cyan-500/90 border-0"
                onClick={handleUpdate}
              >
                Mettre à jour
              </Button>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
                aria-label="Ignorer la mise à jour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
