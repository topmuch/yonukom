"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Clock,
  CalendarClock,
  Bell,
  Mail,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

interface MoreBenefitsProps {
  onSignup?: () => void;
}

const bullets = [
  {
    icon: Clock,
    title: "Rapports automatiques",
    description:
      "Recevez votre bilan journalier et hebdomadaire directement par email ou WhatsApp.",
  },
  {
    icon: CalendarClock,
    title: "Relances programmées",
    description:
      "Les crédits clients et impayés sont relancés automatiquement selon vos règles.",
  },
  {
    icon: Bell,
    title: "Alertes intelligentes",
    description:
      "Stock faible, ventes inhabituelles, échéances : soyez prévenu au bon moment.",
  },
  {
    icon: RefreshCw,
    title: "Sync transparente",
    description:
      "Vos données se synchronisent en arrière-plan, sans action de votre part.",
  },
];

export function MoreBenefits({ onSignup }: MoreBenefitsProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#FFF1F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="space-y-6 order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20">
              <Zap className="w-3.5 h-3.5 text-[#E91E63]" />
              <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
                Automatisation
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Gagnez du temps avec{" "}
              <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
                l&apos;automatisation
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Confiez à YonuKom les tâches répétitives : relances, rapports,
              alertes. Concentrez-vous sur ce qui compte vraiment — vos clients
              et votre croissance.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {bullets.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#E91E63] shrink-0">
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
                Automatiser ma gestion
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          {/* RIGHT: Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative order-1 lg:order-2"
          >
            <div className="absolute inset-0 -m-6 bg-gradient-to-br from-[#10B981]/10 via-[#E91E63]/10 to-transparent rounded-3xl" />

            {/* Card stack */}
            <div className="relative">
              {/* Background card — email report */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-3 sm:-right-6 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#E91E63]/10 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-[#E91E63]" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">Rapport du jour</p>
                </div>
                <p className="text-[10px] text-slate-500">Envoyé à 19:00</p>
                <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-[#E91E63] to-[#F06292]" />
                </div>
              </motion.div>

              {/* Main card — automation flow */}
              <div className="bg-white rounded-3xl shadow-2xl shadow-[#E91E63]/15 border border-slate-200/50 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Tableau de bord
                    </p>
                    <p className="text-base font-bold text-slate-900">
                      Automatisations actives
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    4 actives
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: Clock, label: "Rapport quotidien", time: "19:00", color: "#E91E63" },
                    { icon: Bell, label: "Alerte stock bas", time: "Temps réel", color: "#F59E0B" },
                    { icon: CalendarClock, label: "Relance crédits", time: "Lun. 9h", color: "#10B981" },
                    { icon: RefreshCw, label: "Sync cloud", time: "Auto", color: "#F8BBD0" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: `${item.color}15`, color: item.color }}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.label}
                            </p>
                            <p className="text-xs text-slate-500">{item.time}</p>
                          </div>
                        </div>
                        <div className="w-9 h-5 rounded-full bg-emerald-100 relative">
                          <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500 shadow-sm" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Floating notification */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-3 sm:-left-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 flex items-center gap-2.5"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Sync OK</p>
                  <p className="text-[10px] text-slate-500">Il y a 2 min</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
