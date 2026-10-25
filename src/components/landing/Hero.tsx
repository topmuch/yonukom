"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Sparkles,
  Star,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
} from "lucide-react";

interface HeroProps {
  onSignup?: () => void;
}

// Small stat card used in the dashboard mockup
function MockStat({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-xl p-3 border border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-between mb-1.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1a` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: `${color}1a`, color }}
        >
          {delta}
        </span>
      </div>
      <p className="text-base font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

export function Hero({ onSignup }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#F6F9FE]">
      {/* Subtle blue gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F6F9FE] via-white to-[#EAF1FC]" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #338BE2 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating gradient orbs */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -right-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(51,139,226,0.25) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -left-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(183,190,218,0.4) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{
          y: [0, -15, 0],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(51,139,226,0.2) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-20 sm:pb-28 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text + CTA */}
          <div className="space-y-7 max-w-xl">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur border border-[#338BE2]/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#338BE2] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#338BE2]" />
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  Gestion commerciale nouvelle génération
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 leading-[1.05] tracking-tight"
            >
              Pilotez votre{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
                  commerce
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.7 }}
                    d="M2 9C50 4 150 1 298 4"
                    stroke="#338BE2"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              en toute simplicité
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-slate-600 leading-relaxed"
            >
              La plateforme tout-en-un pour caisse, stock, devis et analytics.
              Pensée pour les commerçants africains, fonctionne même hors ligne.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                className="bg-[#338BE2] hover:bg-[#2074C6] text-white font-semibold text-base gap-2 shadow-xl shadow-[#338BE2]/30 px-7 h-14 rounded-xl"
                onClick={onSignup}
              >
                <Sparkles className="w-5 h-5" />
                Essayer gratuitement
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/70 backdrop-blur border-slate-200 text-slate-700 hover:bg-white hover:border-[#338BE2]/30 hover:text-[#338BE2] font-semibold text-base gap-2 h-14 rounded-xl"
                onClick={onSignup}
              >
                <Play className="w-4 h-4" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 pt-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["#338BE2", "#5BA5EA", "#B7BEDA", "#2074C6"].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center"
                      style={{ background: c }}
                    >
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                  ))}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">100+ businesses</p>
                  <p className="text-slate-500">nous font confiance</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-slate-900">
                    4.9/5
                  </span>
                </div>
                <p className="text-xs text-slate-500">Note moyenne</p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-[#338BE2]/15 border border-slate-200/50 overflow-hidden">
              {/* Top bar (browser-like) */}
              <div className="h-9 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <div className="ml-3 px-2.5 py-0.5 rounded bg-white text-[9px] text-slate-400 border border-slate-100">
                  app.yonukom.sn
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 bg-gradient-to-br from-slate-50 to-[#F6F9FE]">
                {/* Dashboard header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Tableau de bord
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      Vue d&apos;ensemble
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-lg bg-[#338BE2]/10 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#338BE2]" />
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  </div>
                </div>

                {/* Stat cards row */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <MockStat
                    label="Ventes du jour"
                    value="185k"
                    delta="+12%"
                    icon={ShoppingCart}
                    color="#338BE2"
                  />
                  <MockStat
                    label="Stock total"
                    value="1 248"
                    delta="+5%"
                    icon={Package}
                    color="#10B981"
                  />
                  <MockStat
                    label="Clients actifs"
                    value="324"
                    delta="+8%"
                    icon={Users}
                    color="#F59E0B"
                  />
                </div>

                {/* Chart area */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Revenus
                      </p>
                      <p className="text-[10px] text-slate-500">
                        7 derniers jours
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-[#338BE2]">
                        +24.5%
                      </p>
                      <p className="text-[10px] text-emerald-600">
                        <ArrowRight className="w-2.5 h-2.5 inline" /> cette
                        semaine
                      </p>
                    </div>
                  </div>
                  {/* SVG chart bars */}
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{
                          duration: 0.6,
                          delay: 0.9 + i * 0.08,
                          ease: "easeOut",
                        }}
                        className="flex-1 rounded-t-md relative overflow-hidden"
                        style={{
                          background:
                            i === 5
                              ? "linear-gradient(180deg, #338BE2 0%, #2074C6 100%)"
                              : "linear-gradient(180deg, rgba(51,139,226,0.25) 0%, rgba(51,139,226,0.08) 100%)",
                        }}
                      >
                        {i === 5 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap"
                          >
                            95k
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                    {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                      (d) => (
                        <span key={d}>{d}</span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges around the mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="absolute -left-4 sm:-left-8 top-1/3 bg-white rounded-xl shadow-xl shadow-[#338BE2]/15 p-2.5 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Vente enregistrée</p>
                  <p className="text-xs font-bold text-slate-900">+15 000 CFA</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="absolute -right-4 sm:-right-8 bottom-12 bg-white rounded-xl shadow-xl shadow-[#338BE2]/15 p-2.5 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#338BE2]/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#338BE2]" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Stock faible</p>
                  <p className="text-xs font-bold text-slate-900">3 produits</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to features */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
    </section>
  );
}
