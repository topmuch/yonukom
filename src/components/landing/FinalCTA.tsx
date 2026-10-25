"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function FinalCTA({ onSignup }: { onSignup?: () => void }) {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-yk-deep relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yk-emerald rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yk-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto space-y-8"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Prêt à rendre votre commerce{" "}
            <span className="text-yk-emerald-light">Yomb</span> ?
          </h2>

          <p className="text-lg sm:text-xl text-white/70 leading-relaxed">
            Rejoignez les centaines de commerçants qui ont déjà simplifié leur gestion avec YonuKom.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-white text-yk-deep hover:bg-white/90 font-bold text-base gap-2 shadow-xl shadow-black/20 px-8 h-14"
              asChild
            >
              <button type="button" onClick={onSignup}>
                Commencer mon essai gratuit de 14 jours
                <ArrowRight className="w-5 h-5" />
              </button>
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-yk-emerald-light" />
              Aucune carte bancaire requise
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-yk-emerald-light" />
              Installation en 5 minutes
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
