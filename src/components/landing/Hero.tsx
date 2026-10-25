"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowRight,
  Play,
  Wifi,
  WifiOff,
  ShoppingCart,
  BarChart3,
  Package,
  CheckCircle2,
} from "lucide-react";

interface HeroProps {
  onSignup?: () => void;
}

export function Hero({ onSignup }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-background">
      {/* Blue gradient backdrop — premium look */}
      <div className="absolute inset-0 bg-gradient-to-br from-yk-surface via-yk-lavender/30 to-yk-surface" />

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, var(--yk-deep) 1px, transparent 0)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Floating accent blobs (vibrant blue) */}
      <div className="absolute top-20 -right-40 w-80 h-80 bg-yk-deep/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-40 w-96 h-96 bg-yk-deep/8 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-yk-emerald/8 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text + CTA */}
          <div className="space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 backdrop-blur border border-yk-deep/20 shadow-sm">
                <Wifi className="w-4 h-4 text-yk-deep" />
                <span className="text-sm font-medium text-yk-deep">
                  Fonctionne même sans internet
                </span>
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-yk-deep leading-[1.1] tracking-tight">
                La gestion de votre commerce,{" "}
                <span className="relative">
                  enfin{" "}
                  <span className="text-yk-emerald">Yomb</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute -bottom-1 left-0 right-0 h-1 bg-yk-emerald/30 rounded-full origin-left"
                  />
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-xl">
                YonuKom est le logiciel de caisse et de gestion qui s&apos;adapte à votre réalité :{" "}
                <span className="font-medium text-foreground">boutique, restaurant, vente en ligne ou grossiste</span>.
                Fonctionne même sans internet.
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                size="lg"
                className="bg-yk-deep hover:bg-yk-deep-light text-white font-semibold text-base gap-2 shadow-xl shadow-yk-deep/25 px-8 h-14"
                asChild
              >
                <button type="button" onClick={onSignup}>
                  Essayer gratuitement pendant 14 jours
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-semibold text-base gap-2 border-yk-deep/20 text-yk-deep hover:bg-yk-deep/5 h-14"
                  >
                    <Play className="w-5 h-5" />
                    Voir une démo vidéo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
                  <DialogTitle className="sr-only">Démonstration vidéo YonuKom</DialogTitle>
                  <div className="aspect-video bg-yk-deep/5 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-yk-deep/10 flex items-center justify-center mx-auto">
                        <Play className="w-8 h-8 text-yk-deep ml-1" />
                      </div>
                      <p className="text-sm text-foreground/60">Vidéo de démonstration bientôt disponible</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center gap-6 text-sm text-foreground/50"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-yk-emerald" />
                Aucune carte requise
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-yk-emerald" />
                Installation 5 min
              </span>
            </motion.div>
          </div>

          {/* Right: Hero Illustration + Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 60, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Hero illustration — visible on lg+ */}
            <div className="hidden lg:block absolute -right-8 top-0 w-[380px] h-[500px] opacity-20 pointer-events-none">
              <img
                src="/hero-merchant.png"
                alt=""
                className="w-full h-full object-cover rounded-3xl blur-[1px]"
                loading="lazy"
              />
            </div>
            <div className="relative w-[280px] sm:w-[320px]">
              {/* Phone frame */}
              <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl shadow-yk-deep/20">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />

                {/* Screen */}
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-8 pb-2 bg-yk-deep">
                    <span className="text-[10px] text-white/80 font-medium">09:41</span>
                    <div className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-white/80" />
                      <div className="w-3 h-2 border border-white/80 rounded-sm relative">
                        <div className="absolute inset-0.5 bg-white/80 rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="p-4 space-y-3">
                    {/* Welcome */}
                    <div>
                      <p className="text-xs text-foreground/50">Bonjour Fatou 👋</p>
                      <p className="text-sm font-bold text-yk-deep">Tableau de bord</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-yk-emerald/10 rounded-xl p-3">
                        <ShoppingCart className="w-4 h-4 text-yk-emerald mb-1" />
                        <p className="text-sm font-bold text-yk-emerald">185 000</p>
                        <p className="text-[9px] text-foreground/50">FCFA aujourd&apos;hui</p>
                      </div>
                      <div className="bg-yk-deep/5 rounded-xl p-3">
                        <Package className="w-4 h-4 text-yk-deep mb-1" />
                        <p className="text-sm font-bold text-yk-deep">48</p>
                        <p className="text-[9px] text-foreground/50">Produits en stock</p>
                      </div>
                    </div>

                    {/* Quick action */}
                    <div className="bg-yk-deep rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-white">Nouvelle vente</p>
                        <p className="text-[9px] text-white/60">Caisse rapide</p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-white/60" />
                    </div>

                    {/* Chart placeholder */}
                    <div className="bg-foreground/[0.02] rounded-xl p-3">
                      <div className="flex items-center gap-1 mb-2">
                        <BarChart3 className="w-3 h-3 text-foreground/40" />
                        <p className="text-[9px] text-foreground/40">Ventes cette semaine</p>
                      </div>
                      <div className="flex items-end gap-1 h-12">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-yk-emerald/40 rounded-sm"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Home indicator */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="w-24 h-1 bg-white/20 rounded-full" />
                </div>
              </div>

              {/* Floating offline badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute -left-8 sm:-left-16 bottom-20 bg-white rounded-2xl shadow-xl shadow-yk-deep/10 p-3 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yk-emerald/10 flex items-center justify-center">
                    <WifiOff className="w-4 h-4 text-yk-emerald" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-yk-deep">Mode hors ligne</p>
                    <p className="text-[9px] text-foreground/50">Vente enregistrée ✅</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating notification */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="absolute -right-4 sm:-right-12 top-12 bg-white rounded-2xl shadow-xl shadow-yk-deep/10 p-3 border border-border/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yk-amber/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-yk-amber" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-yk-deep">Rupture de stock</p>
                    <p className="text-[9px] text-foreground/50">Savon 500g</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
