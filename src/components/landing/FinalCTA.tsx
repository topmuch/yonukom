"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Rocket,
} from "lucide-react";

export function FinalCTA({ onSignup }: { onSignup?: () => void }) {
  return (
    <section className="py-20 sm:py-28 lg:py-32 relative overflow-hidden bg-[#F6F9FE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-[#338BE2] via-[#2074C6] to-[#1A5FAB] shadow-[0_32px_64px_-16px_rgba(51,139,226,0.5)]"
        >
          {/* Decorative pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Floating gradient blobs */}
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

          {/* Floating sparkle icons */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-12 right-12 hidden md:block"
          >
            <Sparkles className="w-6 h-6 text-white/40" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-16 left-16 hidden md:block"
          >
            <Rocket className="w-7 h-7 text-white/30" />
          </motion.div>

          <div className="relative px-6 sm:px-12 lg:px-20 py-16 sm:py-20 lg:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur border border-white/20 mb-6"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Démarrez aujourd&apos;hui
              </span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
              Prêt à rendre votre commerce plus performant ?
            </h2>

            <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto">
              Rejoignez les centaines de commerçants qui ont déjà simplifié leur
              gestion avec YonuKom.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                className="bg-white text-[#338BE2] hover:bg-white/95 hover:text-[#2074C6] font-bold text-base gap-2 shadow-xl shadow-black/10 px-7 h-14 rounded-xl"
                onClick={onSignup}
              >
                Commencer mon essai gratuit de 14 jours
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                Aucune carte bancaire requise
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                Installation en 5 minutes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white" />
                Résiliable à tout moment
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
