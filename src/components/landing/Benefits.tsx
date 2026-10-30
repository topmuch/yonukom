"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lock,
  Eye,
  Fingerprint,
  Bell,
  CheckCircle2,
  Wallet,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: Lock,
    title: "Chiffrement de bout en bout",
    description:
      "Vos données sont chiffrées du smartphone au cloud. Aucun tiers ne peut y accéder.",
  },
  {
    icon: Eye,
    title: "Journal d'audit complet",
    description:
      "Chaque vente, modification et annulation est tracée. Vous savez qui a fait quoi et quand.",
  },
  {
    icon: Fingerprint,
    title: "Authentification renforcée",
    description:
      "Connexion biométrique et codes PIN pour protéger l'accès à votre caisse.",
  },
  {
    icon: Bell,
    title: "Alertes en temps réel",
    description:
      "Recevez une notification à chaque transaction suspecte ou tentative de fraude.",
  },
];

interface BenefitsProps {
  onSignup?: () => void;
}

export function Benefits({ onSignup }: BenefitsProps) {
  return (
    <section id="about" className="py-20 sm:py-24 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Image / illustration */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            {/* Decorative gradient backdrop */}
            <div className="absolute inset-0 -m-8 bg-gradient-to-br from-[#E91E63]/10 via-[#F8BBD0]/10 to-transparent rounded-3xl" />

            {/* Main illustration card */}
            <div className="relative bg-gradient-to-br from-[#E91E63] to-[#AD1457] rounded-3xl shadow-2xl shadow-[#E91E63]/25 p-8 sm:p-10 overflow-hidden">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: "32px 32px",
                }}
              />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                      Protection
                    </p>
                    <p className="text-lg font-bold text-white">
                      Niveau bancaire
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Mock transaction protected row */}
                  <div className="bg-white/95 backdrop-blur rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Paiement Wave
                        </p>
                        <p className="text-xs text-slate-500">
                          15 000 FCFA • Awa S.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-semibold">Validé</span>
                    </div>
                  </div>

                  {/* Mock alert row */}
                  <div className="bg-white/95 backdrop-blur rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Alerte activité
                        </p>
                        <p className="text-xs text-slate-500">
                          Annulation détectée • Caisse 2
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                      Vérifié
                    </span>
                  </div>

                  {/* Mock audit row */}
                  <div className="bg-white/95 backdrop-blur rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 flex items-center justify-center">
                        <Eye className="w-5 h-5 text-[#E91E63]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Audit trail
                        </p>
                        <p className="text-xs text-slate-500">
                          1 240 actions enregistrées
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#E91E63]">
                      Traçable
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-5 -right-2 sm:-right-5 bg-white rounded-2xl shadow-xl p-4 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">100% sécurisé</p>
                  <p className="text-[10px] text-slate-500">Conformité PCI-DSS</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT: Text + bullet points */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">
                Sécurité
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Vos paiements sont{" "}
              <span className="bg-gradient-to-r from-[#E91E63] to-[#10B981] bg-clip-text text-transparent">
                sécurisés
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              YonuKom protège chaque transaction avec un chiffrement de niveau
              bancaire et un journal d&apos;audit complet. Vous dormez sur vos
              deux oreilles, vos clients aussi.
            </p>

            {/* Bullet points grid */}
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 flex items-center justify-center text-[#E91E63] shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">
                        {b.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onSignup}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-lg shadow-[#E91E63]/25 transition-all"
              >
                Sécuriser mon commerce
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
