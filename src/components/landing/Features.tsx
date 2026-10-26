"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface Feature {
  title: string;
  description: string;
  color: string;
  bg: string;
  image: string;
  imageFallback: string;
  alt: string;
}

const features: Feature[] = [
  {
    title: "Paiement mobile",
    description:
      "Encaissez via Wave, Orange Money et Free Money en un geste. Compatible tous les opérateurs ouest-africains.",
    color: "text-[#338BE2]",
    bg: "bg-[#338BE2]/10",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop",
    imageFallback: "https://picsum.photos/seed/payment-mobile/400/300",
    alt: "Paiement mobile sur smartphone",
  },
  {
    title: "Caisse intuitive",
    description:
      "Une caisse pensée pour le terrain : rapide, hors ligne, et synchronisée automatiquement dès le retour du réseau.",
    color: "text-[#10B981]",
    bg: "bg-[#10B981]/10",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop",
    imageFallback: "https://picsum.photos/seed/pos-cash-register/400/300",
    alt: "Caisse enregistreuse point de vente",
  },
  {
    title: "Analytics en temps réel",
    description:
      "Suivez vos ventes, vos stocks et vos marges en direct. Des rapports clairs pour décider plus vite.",
    color: "text-amber-500",
    bg: "bg-amber-100",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    imageFallback: "https://picsum.photos/seed/analytics-dashboard/400/300",
    alt: "Tableau de bord analytique",
  },
  {
    title: "Sécurité avancée",
    description:
      "Chaque action est tracée. Journal d&apos;audit complet, rôles utilisateurs et protection anti-fraude intégrée.",
    color: "text-[#B7BEDA]",
    bg: "bg-[#B7BEDA]/20",
    image:
      "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop",
    imageFallback: "https://picsum.photos/seed/security-shield/400/300",
    alt: "Sécurité et protection des données",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

// --- Image with onError fallback ---
function FeatureImage({
  src,
  fallback,
  alt,
}: {
  src: string;
  fallback: string;
  alt: string;
}) {
  const [current, setCurrent] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (!triedFallback) {
          setTriedFallback(true);
          setCurrent(fallback);
        }
      }}
      className="w-full h-40 object-cover"
    />
  );
}

interface FeaturesProps {
  onSignup?: () => void;
}

export function Features({ onSignup }: FeaturesProps) {
  return (
    <section
      id="features"
      className="py-20 sm:py-24 lg:py-28 bg-[#F6F9FE] relative"
    >
      {/* Decorative blob */}
      <div
        className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(183,190,218,0.5) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#338BE2]/10 border border-[#338BE2]/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#338BE2]" />
            <span className="text-xs font-semibold text-[#338BE2] uppercase tracking-wider">
              Fonctionnalités
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Tout en un seul{" "}
            <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
              endroit
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Une plateforme complète pour gérer vos paiements, votre stock et
            vos clients — pensée pour les commerçants africains.
          </p>
        </motion.div>

        {/* 4 feature cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature, i) => {
            return (
              <motion.div
                key={i}
                variants={cardVariants}
                className="h-full"
              >
                <Card
                  className="group h-full transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(51,139,226,0.18)] hover:-translate-y-1.5 border border-slate-200/60 bg-white overflow-hidden relative cursor-pointer"
                  onClick={onSignup}
                >
                  {/* Real image at the top of the card */}
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <FeatureImage
                      src={feature.image}
                      fallback={feature.imageFallback}
                      alt={feature.alt}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/0 to-transparent pointer-events-none" />
                    <div className="absolute top-3 left-3">
                      <div
                        className={`w-9 h-9 rounded-xl ${feature.bg} ${feature.color} flex items-center justify-center text-xs font-bold border border-white/60 backdrop-blur shadow-sm`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 sm:p-7 space-y-4 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#338BE2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#338BE2] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
