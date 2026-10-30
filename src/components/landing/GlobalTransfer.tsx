"use client";

import { motion } from "framer-motion";
import { Globe, Users, ArrowRight } from "lucide-react";

interface GlobalTransferProps {
  onSignup?: () => void;
}

// Generate a grid of avatars (color tiles with initials)
const avatarColors = [
  "#E91E63", "#10B981", "#F59E0B", "#F8BBD0",
  "#F06292", "#AD1457", "#059669", "#D97706",
  "#E91E63", "#10B981", "#F59E0B", "#F8BBD0",
  "#F06292", "#AD1457", "#059669", "#D97706",
  "#E91E63", "#10B981", "#F59E0B", "#F8BBD0",
];

const avatarInitials = [
  "A", "M", "F", "K", "S", "O", "B", "D",
  "L", "N", "I", "T", "A", "M", "F", "K",
  "S", "O", "B", "D",
];

const countries = [
  "Sénégal", "Côte d'Ivoire", "Mali", "Burkina Faso",
  "Bénin", "Togo", "Guinée", "Niger",
];

export function GlobalTransfer({ onSignup }: GlobalTransferProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20 mb-4">
            <Globe className="w-3.5 h-3.5 text-[#E91E63]" />
            <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
              Couverture internationale
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Envoyez à travers{" "}
            <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              le monde
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            YonuKom opère dans 8 pays d&apos;Afrique de l&apos;Ouest et
            synchronise vos paiements où que vous soyez.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: World map / avatars grid */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            {/* Stylized "map" backdrop */}
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Concentric circles */}
              <div className="absolute inset-0 rounded-full border border-[#E91E63]/10" />
              <div className="absolute inset-8 rounded-full border border-[#E91E63]/10" />
              <div className="absolute inset-16 rounded-full border border-[#E91E63]/10" />
              <div className="absolute inset-24 rounded-full border border-[#E91E63]/10" />

              {/* Center globe icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E91E63] to-[#AD1457] flex items-center justify-center shadow-2xl shadow-[#E91E63]/30"
                >
                  <Globe className="w-10 h-10 text-white" />
                </motion.div>
              </div>

              {/* Avatars grid around */}
              {avatarColors.map((color, i) => {
                const angle = (i / avatarColors.length) * Math.PI * 2;
                const radius = 42; // percent of half container
                const x = 50 + Math.cos(angle) * radius;
                const y = 50 + Math.sin(angle) * radius;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.05, type: "spring" }}
                    className="absolute w-9 h-9 sm:w-11 sm:h-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs sm:text-sm font-bold"
                    style={{
                      background: color,
                      left: `${x}%`,
                      top: `${y}%`,
                    }}
                  >
                    {avatarInitials[i]}
                  </motion.div>
                );
              })}

              {/* Center pulse */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[#E91E63]/30"
              />
            </div>
          </motion.div>

          {/* RIGHT: Text + countries */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
              <Users className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">
                Communauté mondiale
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Rejoignez une communauté de commerçants sans frontières
            </h3>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Que vous soyez à Dakar, Abidjan ou Bamako, YonuKom parle votre
              langue et accepte votre monnaie. Encaissez en FCFA, envoyez des
              reçus par WhatsApp, synchronisez vos ventes dans le cloud.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {countries.map((country, i) => (
                <motion.div
                  key={country}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FFF1F5] border border-slate-200/60"
                >
                  <span className="w-2 h-2 rounded-full bg-[#E91E63]" />
                  <span className="text-sm font-medium text-slate-700">
                    {country}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onSignup}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-lg shadow-[#E91E63]/25 transition-all"
              >
                Rejoindre la communauté
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
