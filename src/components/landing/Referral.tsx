"use client";

import { motion } from "framer-motion";
import { Gift, UserPlus, Share2, ArrowRight, CheckCircle2 } from "lucide-react";

interface ReferralProps {
  onSignup?: () => void;
}

const steps = [
  {
    icon: UserPlus,
    title: "Invitez vos amis",
    description:
      "Partagez votre lien de parrainage unique avec vos proches commerçants.",
  },
  {
    icon: CheckCircle2,
    title: "Ils s'inscrivent",
    description:
      "Dès que votre filleul crée son compte et encaisse sa première vente, c'est gagné.",
  },
  {
    icon: Gift,
    title: "Recevez vos bonus",
    description:
      "Obtenez 1 mois gratuit + 5 000 FCFA de crédit pour chaque filleul actif.",
  },
];

export function Referral({ onSignup }: ReferralProps) {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#FFF1F5] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#E91E63] via-[#AD1457] to-[#1A5FAB] shadow-[0_32px_64px_-16px_rgba(51,139,226,0.5)]">
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(183,190,218,0.6) 0%, transparent 70%)",
            }}
          />

          {/* Floating gift icon */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 right-12 hidden md:block"
          >
            <Gift className="w-8 h-8 text-white/40" />
          </motion.div>

          <div className="relative px-6 sm:px-12 lg:px-16 py-12 sm:py-16 lg:py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 mb-6"
              >
                <Gift className="w-3.5 h-3.5 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Programme de parrainage
                </span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1]"
              >
                Invitez vos amis et obtenez des bonus
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-base sm:text-lg text-white/80 leading-relaxed"
              >
                Partagez YonuKom avec votre réseau et cumulez des crédits
                gratuitement.
              </motion.p>
            </div>

            {/* Steps */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.12 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4 text-white">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
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
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <button
                type="button"
                onClick={onSignup}
                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white text-[#E91E63] hover:bg-white/95 hover:text-[#AD1457] font-bold shadow-xl shadow-black/10 transition-all"
              >
                <Share2 className="w-4 h-4" />
                Partager mon lien
              </button>
              <span className="text-sm text-white/70">
                Déjà <span className="font-bold text-white">12 480</span> parrainages
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
