"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  WifiOff,
  Wifi,
  CheckCircle2,
  CloudOff,
  Cloud,
  ShoppingCart,
  RefreshCw,
  Smartphone,
} from "lucide-react";

export function OfflineDemo() {
  const [isOnline, setIsOnline] = useState(false);

  // Auto-toggle demo every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setIsOnline((prev) => !prev);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-gradient-to-b from-yk-surface to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-yk-deep tracking-tight">
            Votre réseau coupe ?{" "}
            <span className="text-yk-emerald">YonuKom, lui, ne s&apos;arrête jamais.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Phone with network status */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative w-[280px] sm:w-[320px]">
              {/* Phone frame */}
              <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                {/* Screen */}
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-8 pb-2 bg-yk-deep">
                    <span className="text-[10px] text-white/80 font-medium">09:41</span>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isOnline ? "online" : "offline"}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-1.5"
                      >
                        {isOnline ? (
                          <>
                            <Wifi className="w-3 h-3 text-yk-emerald" />
                            <span className="text-[9px] text-yk-emerald font-medium">4G</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] text-red-400 font-medium">Hors ligne</span>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* App content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-foreground/50">Bonjour Fatou 👋</p>
                      <p className="text-sm font-bold text-yk-deep">Caisse rapide</p>
                    </div>

                    {/* Sale being recorded */}
                    <motion.div
                      layout
                      className="bg-yk-emerald/10 rounded-xl p-3 border border-yk-emerald/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-4 h-4 text-yk-emerald" />
                        <span className="text-xs font-semibold text-yk-emerald">Vente en cours</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground/70">Riz 5kg × 2</span>
                        <span className="text-sm font-bold text-foreground">15 000 FCFA</span>
                      </div>
                    </motion.div>

                    {/* Success message */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isOnline ? "synced" : "offline-ok"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-xl p-3 flex items-center gap-2 ${
                          isOnline
                            ? "bg-yk-emerald/10 border border-yk-emerald/20"
                            : "bg-yk-amber/10 border border-yk-amber/20"
                        }`}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${isOnline ? "text-yk-emerald" : "text-yk-amber"}`}
                        />
                        <div>
                          <p className={`text-xs font-semibold ${isOnline ? "text-yk-emerald" : "text-yk-amber"}`}>
                            Vente enregistrée ✅
                          </p>
                          <p className="text-[9px] text-foreground/50">
                            {isOnline
                              ? "Synchronisée avec le cloud ☁️"
                              : "Sera synchronisée automatiquement"}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Sync indicator */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isOnline ? "cloud-on" : "cloud-off"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2 py-2"
                      >
                        {isOnline ? (
                          <div className="flex items-center gap-1.5 text-yk-emerald">
                            <Cloud className="w-4 h-4" />
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span className="text-[10px] font-medium">Synchronisation...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-foreground/40">
                            <CloudOff className="w-4 h-4" />
                            <span className="text-[10px] font-medium">Mode local actif</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-24 h-1 bg-white/20 rounded-full" />
                </div>
              </div>

              {/* Floating network toggle indicator */}
              <motion.div
                animate={{
                  x: isOnline ? 0 : -4,
                  scale: isOnline ? 1 : 1.05,
                }}
                transition={{ duration: 0.4, type: "spring" }}
                className="absolute -left-6 sm:-left-14 top-8"
              >
                <div
                  className={`rounded-2xl shadow-xl p-3 border transition-colors duration-300 ${
                    isOnline
                      ? "bg-white border-yk-emerald/30"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="w-5 h-5 text-yk-emerald" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className={`text-xs font-semibold ${isOnline ? "text-yk-emerald" : "text-red-500"}`}>
                        {isOnline ? "En ligne" : "Hors ligne"}
                      </p>
                      <p className="text-[9px] text-foreground/50">
                        {isOnline ? "Réseau 4G actif" : "Pas de réseau"}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Explanation text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yk-emerald/10 border border-yk-emerald/20">
              <CloudOff className="w-4 h-4 text-yk-emerald" />
              <span className="text-sm font-medium text-yk-emerald">Technologie Offline-First</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-yk-deep leading-tight">
              Continuez à vendre, même quand le réseau vous abandonne
            </h3>

            <p className="text-foreground/60 leading-relaxed">
              Grâce à notre technologie Offline-First, vous pouvez{" "}
              <strong className="text-foreground">encaisser, gérer le stock et imprimer des tickets</strong>{" "}
              même sans internet. Tout se synchronise automatiquement dès que le réseau revient.
            </p>

            <div className="space-y-4">
              {[
                {
                  icon: <ShoppingCart className="w-5 h-5" />,
                  title: "Encaissement hors ligne",
                  desc: "Vos ventes sont enregistrées localement et synchronisées dès le retour du réseau.",
                },
                {
                  icon: <Smartphone className="w-5 h-5" />,
                  title: "Données toujours accessibles",
                  desc: "Produits, clients et historique disponibles même sans connexion.",
                },
                {
                  icon: <RefreshCw className="w-5 h-5" />,
                  title: "Sync automatique & transparente",
                  desc: "Aucune action requise. La synchronisation se fait en arrière-plan.",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-yk-deep/5 flex items-center justify-center text-yk-deep shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-yk-deep">{item.title}</p>
                    <p className="text-sm text-foreground/50 mt-0.5">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
