"use client";

import { motion } from "framer-motion";
import {
  UserPlus,
  Wallet,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Créez votre compte",
    description:
      "Inscrivez-vous en moins de 2 minutes. Configurez votre boutique et invitez votre équipe.",
    color: "#338BE2",
  },
  {
    icon: Wallet,
    step: "02",
    title: "Encaissez vos ventes",
    description:
      "Acceptez les paiements mobiles, espèces et cartes. Suivez chaque transaction en temps réel.",
    color: "#10B981",
  },
  {
    icon: CheckCircle2,
    step: "03",
    title: "Pilotez votre activité",
    description:
      "Consultez vos rapports, gérez votre stock et prenez les bonnes décisions — où que vous soyez.",
    color: "#F59E0B",
  },
];

interface HowItWorksProps {
  onSignup?: () => void;
}

export function HowItWorks({ onSignup }: HowItWorksProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#F6F9FE] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#338BE2]/10 border border-[#338BE2]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#338BE2]" />
            <span className="text-xs font-semibold text-[#338BE2] uppercase tracking-wider">
              Comment ça marche
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Envoyez de l&apos;argent{" "}
            <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
              facilement
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Trois étapes suffisent pour transformer la gestion de votre commerce.
          </p>
        </motion.div>

        {/* Steps with connector line */}
        <div className="relative grid sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10 max-w-5xl mx-auto">
          {/* Horizontal connector line — desktop */}
          <div className="hidden sm:block absolute top-12 left-[16%] right-[16%] h-0.5">
            <div className="w-full h-full bg-gradient-to-r from-[#338BE2]/20 via-[#10B981]/20 to-amber-500/20" />
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="w-full h-full bg-gradient-to-r from-[#338BE2] via-[#10B981] to-amber-500 origin-left absolute top-0 left-0"
            />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                {/* Icon tile */}
                <div className="relative z-10 mb-6">
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg border-4 border-[#F6F9FE]"
                    style={{
                      background: `${step.color}15`,
                      color: step.color,
                    }}
                  >
                    <Icon className="w-10 h-10" />
                  </div>
                  {/* Step number badge */}
                  <div
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md"
                    style={{ background: step.color }}
                  >
                    {step.step}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 sm:mt-16"
        >
          <button
            type="button"
            onClick={onSignup}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#338BE2] hover:bg-[#2074C6] text-white font-semibold shadow-lg shadow-[#338BE2]/25 transition-all"
          >
            Démarrer maintenant
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
