"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";

interface CompleteSolutionsProps {
  onSignup?: () => void;
}

const solutions = [
  {
    icon: Store,
    badge: "Pour les boutiques physiques",
    title: "Caisse & gestion physique",
    description:
      "Une caisse tactile ultra-rapide, un stock à jour, des alertes automatiques et un journal d'audit. Tout ce qu'il faut pour piloter votre boutique au quotidien.",
    features: [
      "Caisse tactile hors ligne",
      "Gestion de stock en temps réel",
      "Journal d'audit anti-fraude",
      "Rapports journaliers & mensuels",
      "Multi-utilisateurs avec rôles",
    ],
    color: "#E91E63",
    bg: "bg-[#E91E63]/10",
    accent: "from-[#E91E63] to-[#AD1457]",
  },
  {
    icon: Smartphone,
    badge: "Pour les vendeurs en ligne",
    title: "Vente mobile & réseaux",
    description:
      "Encaissez vos commandes TikTok, Instagram et WhatsApp en un geste. Générez des liens de paiement Wave et suivez chaque client.",
    features: [
      "Liens de paiement Wave / OM",
      "Messages WhatsApp automatiques",
      "Pipeline de commandes Kanban",
      "Suivi clients & historique",
      "Interface mobile optimisée",
    ],
    color: "#10B981",
    bg: "bg-[#10B981]/10",
    accent: "from-[#10B981] to-[#059669]",
  },
];

export function CompleteSolutions({ onSignup }: CompleteSolutionsProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white">
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
            <span className="w-1.5 h-1.5 rounded-full bg-[#E91E63]" />
            <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
              Solutions
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Solutions{" "}
            <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              complètes
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Que vous vendiez en boutique ou en ligne, YonuKom s&apos;adapte à
            votre métier.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {solutions.map((sol, i) => {
            const Icon = sol.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <Card className="group h-full relative overflow-hidden border border-slate-200/60 hover:border-transparent hover:shadow-[0_24px_48px_-16px_rgba(51,139,226,0.25)] hover:-translate-y-1 transition-all duration-300">
                  {/* Top gradient accent */}
                  <div
                    className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${sol.accent}`}
                  />

                  <CardContent className="p-7 sm:p-8 space-y-5">
                    {/* Badge + Icon */}
                    <div className="flex items-start justify-between">
                      <div
                        className={`w-14 h-14 rounded-2xl ${sol.bg} flex items-center justify-center`}
                        style={{ color: sol.color }}
                      >
                        <Icon className="w-7 h-7" />
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                        style={{
                          background: `${sol.color}10`,
                          color: sol.color,
                        }}
                      >
                        {sol.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {sol.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                        {sol.description}
                      </p>
                    </div>

                    <ul className="space-y-2.5">
                      {sol.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2.5">
                          <span
                            className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: `${sol.color}15`, color: sol.color }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                          </span>
                          <span className="text-sm text-slate-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={onSignup}
                      className="inline-flex items-center gap-2 text-sm font-semibold transition-all group/btn"
                      style={{ color: sol.color }}
                    >
                      Découvrir
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
