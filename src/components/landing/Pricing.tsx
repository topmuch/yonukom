"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Sparkles, Star } from "lucide-react";

interface PricingPlan {
  name: string;
  tagline: string;
  price: string;
  period?: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaHref: string;
  ctaVariant: "default" | "outline";
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    tagline: "Pour démarrer en douceur",
    price: "15.000",
    period: "FCFA/mois",
    features: [
      "1 utilisateur",
      "Caisse et stock de base",
      "Rapports journaliers",
      "Mode hors ligne",
      "Support WhatsApp",
    ],
    cta: "Commencer",
    ctaHref: "/signup",
    ctaVariant: "outline",
  },
  {
    name: "Pro",
    tagline: "Le plus populaire",
    price: "35.000",
    period: "FCFA/mois",
    popular: true,
    features: [
      "Jusqu'à 5 utilisateurs",
      "Tout le Pack Starter, et :",
      "Envoi WhatsApp automatique",
      "Gestion des dettes clients",
      "Pipeline de commandes B2B",
      "Journal d'audit avancé",
      "Support prioritaire",
    ],
    cta: "Essayer gratuitement",
    ctaHref: "/signup",
    ctaVariant: "default",
  },
  {
    name: "Enterprise",
    tagline: "Pour les structures étendues",
    price: "Sur devis",
    features: [
      "Utilisateurs illimités",
      "Tout le Pack Pro, et :",
      "Multi-boutiques",
      "Support dédié 24/7",
      "Formation personnalisée",
      "SLA garanti",
    ],
    cta: "Nous contacter",
    ctaHref: "#contact",
    ctaVariant: "outline",
  },
];

export function Pricing({ onSignup }: { onSignup?: () => void }) {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-24 lg:py-28 bg-[#F6F9FE] relative overflow-hidden"
    >
      {/* Decorative background */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(51,139,226,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#338BE2]/10 border border-[#338BE2]/20 mb-4">
            <Star className="w-3.5 h-3.5 text-[#338BE2]" />
            <span className="text-xs font-semibold text-[#338BE2] uppercase tracking-wider">
              Tarifs
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Des tarifs{" "}
            <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
              adaptés à l&apos;Afrique
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Pas de surprise. Des prix en FCFA, sans engagement, avec 14 jours
            d&apos;essai gratuit.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className={plan.popular ? "sm:-mt-4 sm:mb-[-16px]" : ""}
            >
              <Card
                className={`h-full flex flex-col relative overflow-hidden transition-all duration-300 ${
                  plan.popular
                    ? "border-2 border-[#338BE2] shadow-[0_24px_48px_-16px_rgba(51,139,226,0.35)] bg-white"
                    : "border border-slate-200 hover:border-[#338BE2]/30 hover:shadow-[0_12px_32px_-12px_rgba(51,139,226,0.15)] bg-white"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-[#338BE2] to-[#2074C6] text-white text-center py-1.5 text-xs font-bold tracking-wide flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Populaire
                  </div>
                )}

                <CardHeader
                  className={`px-6 ${plan.popular ? "pt-12" : "pt-6"} pb-2`}
                >
                  <h3 className="text-xl font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {plan.tagline}
                  </p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span
                      className={`text-4xl font-extrabold tracking-tight ${
                        plan.popular ? "text-[#338BE2]" : "text-slate-900"
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-slate-500">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 px-6 py-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-2.5"
                      >
                        <span
                          className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            plan.popular
                              ? "bg-[#338BE2] text-white"
                              : "bg-[#338BE2]/10 text-[#338BE2]"
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                        <span className="text-sm text-slate-700">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pb-6">
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full font-semibold gap-2 h-12 rounded-xl transition-all ${
                      plan.popular
                        ? "bg-[#338BE2] hover:bg-[#2074C6] text-white shadow-lg shadow-[#338BE2]/30"
                        : plan.ctaVariant === "outline"
                          ? "border-slate-200 text-slate-700 hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
                          : ""
                    }`}
                    asChild
                  >
                    <button
                      type="button"
                      onClick={plan.ctaHref === "/signup" ? onSignup : undefined}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-slate-400 mt-10 flex items-center justify-center gap-2 flex-wrap"
        >
          <Badge
            variant="outline"
            className="border-slate-200 text-slate-500 font-normal"
          >
            Aucune carte requise
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 text-slate-500 font-normal"
          >
            14 jours d&apos;essai
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 text-slate-500 font-normal"
          >
            Résiliable à tout moment
          </Badge>
        </motion.p>
      </div>
    </section>
  );
}
