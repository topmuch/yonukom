"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface PricingPlan {
  name: string;
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
    name: "Pack Démarrage",
    price: "15.000",
    period: "FCFA/mois",
    features: [
      "1 utilisateur",
      "Caisse et stock de base",
      "Rapports journaliers",
      "Mode hors ligne",
    ],
    cta: "Commencer",
    ctaHref: "/signup",
    ctaVariant: "outline",
  },
  {
    name: "Pack Pro",
    price: "35.000",
    period: "FCFA/mois",
    popular: true,
    features: [
      "Jusqu'à 5 utilisateurs",
      "Tout le Pack Démarrage +",
      "Envoi WhatsApp automatique",
      "Gestion des dettes clients",
      "Pipeline de commandes B2B",
      "Journal d'audit avancé",
    ],
    cta: "Essayer gratuitement",
    ctaHref: "/signup",
    ctaVariant: "default",
  },
  {
    name: "Pack Entreprise",
    price: "Sur devis",
    features: [
      "Utilisateurs illimités",
      "Tout le Pack Pro +",
      "Multi-boutiques",
      "Support prioritaire",
      "Formation personnalisée",
    ],
    cta: "Nous contacter",
    ctaHref: "#contact",
    ctaVariant: "outline",
  },
];

export function Pricing({ onSignup }: { onSignup?: () => void }) {
  return (
    <section id="pricing" className="py-20 sm:py-28 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-yk-deep tracking-tight">
            Des tarifs{" "}
            <span className="text-yk-emerald">adaptés à l'Afrique</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/60 leading-relaxed">
            Pas de surprise. Des prix en FCFA, sans engagement, avec 14 jours d&apos;essai gratuit.
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
                className={`h-full flex flex-col relative overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-yk-deep/5 ${
                  plan.popular
                    ? "border-yk-deep border-2 shadow-lg shadow-yk-deep/10"
                    : "border-border"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-yk-emerald text-white hover:bg-yk-emerald border-0 font-medium">
                      Populaire
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-2 pt-6 px-6">
                  <h3 className="text-lg font-bold text-yk-deep">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold ${plan.popular ? "text-yk-deep" : "text-foreground"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-foreground/50">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 px-6 py-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            plan.popular ? "text-yk-emerald" : "text-foreground/30"
                          }`}
                        />
                        <span className="text-sm text-foreground/70">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pb-6">
                  <Button
                    variant={plan.ctaVariant}
                    className={`w-full font-medium gap-2 h-12 ${
                      plan.popular
                        ? "bg-yk-deep hover:bg-yk-deep-light text-white shadow-lg shadow-yk-deep/20"
                        : plan.ctaVariant === "outline"
                          ? "border-yk-deep/30 text-yk-deep hover:bg-yk-deep/5"
                          : ""
                    }`}
                    asChild
                  >
                    <button type="button" onClick={plan.ctaHref === "/signup" ? onSignup : undefined}>
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
          className="text-center text-sm text-foreground/40 mt-8"
        >
          Aucune carte bancaire requise • 14 jours d&apos;essai gratuit • Résiliable à tout moment
        </motion.p>
      </div>
    </section>
  );
}
