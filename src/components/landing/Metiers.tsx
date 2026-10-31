"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UtensilsCrossed,
  Coffee,
  Cake,
  Wine,
  Scissors,
  Sparkles,
  Flower2,
  Bath,
  Store,
  ShoppingBasket,
  Pill,
  Shirt,
  Hotel,
  Wrench,
  Fuel,
  CalendarClock,
  Globe,
  ShoppingBag,
  Boxes,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Métiers compatibles avec YonuKom                                  */
/* ------------------------------------------------------------------ */

type Feature = "Caisse" | "Stock" | "RDV" | "Site web" | "WhatsApp";

interface Metier {
  icon: LucideIcon;
  name: string;
  description: string;
  features: Feature[];
}

interface MetierCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  metiers: Metier[];
}

const categories: MetierCategory[] = [
  {
    id: "restauration",
    label: "Restauration",
    icon: UtensilsCrossed,
    color: "#E91E63",
    metiers: [
      {
        icon: UtensilsCrossed,
        name: "Fast food",
        description: "Encaissement rapide, commandes à emporter et livraison WhatsApp.",
        features: ["Caisse", "Stock", "WhatsApp"],
      },
      {
        icon: Coffee,
        name: "Restaurant",
        description: "Caisse par table, menu digital et site web de réservation.",
        features: ["Caisse", "Site web", "RDV"],
      },
      {
        icon: Cake,
        name: "Boulangerie",
        description: "Suivi du stock frais, alertes péremption et commandes clients.",
        features: ["Caisse", "Stock", "WhatsApp"],
      },
      {
        icon: Wine,
        name: "Bar & Café",
        description: "Caisse tactile rapide, gestion de stock boissons et rapports.",
        features: ["Caisse", "Stock"],
      },
    ],
  },
  {
    id: "beaute",
    label: "Beauté & Bien-être",
    icon: Scissors,
    color: "#F06292",
    metiers: [
      {
        icon: Scissors,
        name: "Salon de coiffure",
        description: "Prise de rendez-vous en ligne, site vitrine et caisse.",
        features: ["Caisse", "RDV", "Site web"],
      },
      {
        icon: Sparkles,
        name: "Barbier",
        description: "Agenda de rendez-vous, rappels WhatsApp et fidélité client.",
        features: ["Caisse", "RDV", "WhatsApp"],
      },
      {
        icon: Flower2,
        name: "Institut de beauté",
        description: "Réservations en ligne, soins et paiement mobile money.",
        features: ["Caisse", "RDV", "Site web"],
      },
      {
        icon: Bath,
        name: "Spa & Hammam",
        description: "Planning de soins, paiement par session et site de réservation.",
        features: ["Caisse", "RDV", "Site web"],
      },
    ],
  },
  {
    id: "commerce",
    label: "Commerce",
    icon: Store,
    color: "#10B981",
    metiers: [
      {
        icon: Store,
        name: "Boutique générale",
        description: "Caisse, stock multi-catégories et alertes de rupture.",
        features: ["Caisse", "Stock", "WhatsApp"],
      },
      {
        icon: ShoppingBasket,
        name: "Épicerie & Alimentation",
        description: "Gestion du stock au poids, code-barres et encaissement rapide.",
        features: ["Caisse", "Stock"],
      },
      {
        icon: Pill,
        name: "Pharmacie",
        description: "Caisse sécurisée, traçabilité et site de commande en ligne.",
        features: ["Caisse", "Stock", "Site web"],
      },
      {
        icon: Shirt,
        name: "Mode & Vêtements",
        description: "Boutique en ligne, tailles/couleurs et vente sur réseaux sociaux.",
        features: ["Caisse", "Stock", "Site web"],
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    icon: Hotel,
    color: "#F59E0B",
    metiers: [
      {
        icon: Hotel,
        name: "Hôtel & Auberge",
        description: "Réservations en ligne, gestion des chambres et caisse de réception.",
        features: ["Caisse", "RDV", "Site web"],
      },
      {
        icon: Wrench,
        name: "Atelier (auto / réparation)",
        description: "Ordres de réparation, RDV client et facturation automatique.",
        features: ["Caisse", "RDV", "WhatsApp"],
      },
      {
        icon: Fuel,
        name: "Station-service",
        description: "Caisse rapide, gestion carburants et rapport de shift par pompiste.",
        features: ["Caisse", "Stock"],
      },
      {
        icon: Shirt,
        name: "Pressing & Couture",
        description: "Suivi des tickets, RDV de retrait et rappels WhatsApp automatiques.",
        features: ["Caisse", "RDV", "WhatsApp"],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Feature badge config                                              */
/* ------------------------------------------------------------------ */

const featureConfig: Record<Feature, { icon: LucideIcon; bg: string }> = {
  Caisse: { icon: ShoppingBag, bg: "bg-[#E91E63]/10 text-[#E91E63]" },
  Stock: { icon: Boxes, bg: "bg-[#10B981]/10 text-[#10B981]" },
  RDV: { icon: CalendarClock, bg: "bg-[#F06292]/10 text-[#F06292]" },
  "Site web": { icon: Globe, bg: "bg-[#F59E0B]/10 text-[#F59E0B]" },
  WhatsApp: { icon: MessageCircle, bg: "bg-[#22C55E]/10 text-[#22C55E]" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

interface MetiersProps {
  onSignup?: () => void;
}

export function Metiers({ onSignup }: MetiersProps) {
  const [active, setActive] = useState(categories[0].id);
  const current = categories.find((c) => c.id === active) ?? categories[0];

  return (
    <section id="metiers" className="py-20 sm:py-24 lg:py-28 bg-[#FFF1F5] relative overflow-hidden">
      {/* Decorative dots */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #E91E63 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E91E63]" />
            <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
              Métiers compatibles
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            YonuKom s&apos;adapte à{" "}
            <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              votre métier
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Que vous teniez un fast-food, un salon avec rendez-vous et site web,
            une pharmacie ou un hôtel — YonuKom se configure selon votre activité.
          </p>
        </motion.div>

        {/* Tabs (category selector) */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-12">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isActive = cat.id === active;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActive(cat.id)}
                className={`inline-flex items-center gap-2 px-4 sm:px-5 h-11 rounded-full text-sm font-semibold transition-all border ${
                  isActive
                    ? "text-white border-transparent shadow-lg"
                    : "bg-white text-slate-600 border-slate-200 hover:border-[#E91E63]/40 hover:text-[#E91E63]"
                }`}
                style={isActive ? { background: cat.color, boxShadow: `0 8px 20px -8px ${cat.color}80` } : undefined}
              >
                <CatIcon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Cards grid for active category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {current.metiers.map((metier, i) => {
              const Icon = metier.icon;
              return (
                <motion.div
                  key={metier.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="group bg-white rounded-2xl p-6 border border-slate-200/70 hover:border-transparent hover:shadow-[0_18px_36px_-14px_rgba(233,30,99,0.25)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${current.color}12`, color: current.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
                    {metier.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">
                    {metier.description}
                  </p>

                  {/* Feature badges */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                    {metier.features.map((f) => {
                      const FIcon = featureConfig[f].icon;
                      return (
                        <span
                          key={f}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${featureConfig[f].bg}`}
                        >
                          <FIcon className="w-2.5 h-2.5" />
                          {f}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-sm text-slate-500 mb-4">
            Votre métier n&apos;est pas listé ? YonuKom est 100% personnalisable.
          </p>
          <button
            type="button"
            onClick={onSignup}
            className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-lg shadow-[#E91E63]/25 transition-all"
          >
            Configurer ma boutique
          </button>
        </motion.div>
      </div>
    </section>
  );
}
