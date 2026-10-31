"use client";

import { motion } from "framer-motion";
import { Star, ExternalLink, Globe } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Boutiques ayant créé leur site internet avec YonuKom             */
/* ------------------------------------------------------------------ */

interface ShopSite {
  name: string;
  type: string;
  city: string;
  url: string;
  image: string;
  rating: number;
  reviews: number;
}

const shops: ShopSite[] = [
  {
    name: "Restaurant Le Baobab",
    type: "Restaurant",
    city: "Dakar",
    url: "lebaobab.yonukom.com",
    image: "/landing/shops/shop-restaurant.png",
    rating: 4.9,
    reviews: 128,
  },
  {
    name: "Salon Élégance",
    type: "Salon de coiffure",
    city: "Abidjan",
    url: "elegance.yonukom.com",
    image: "/landing/shops/shop-salon.png",
    rating: 5.0,
    reviews: 87,
  },
  {
    name: "Boutique Mode Dakar",
    type: "Mode & Vêtements",
    city: "Dakar",
    url: "modedakar.yonukom.com",
    image: "/landing/shops/shop-fashion.png",
    rating: 4.8,
    reviews: 213,
  },
  {
    name: "Fast Food Chez Ali",
    type: "Fast food",
    city: "Bamako",
    url: "chezali.yonukom.com",
    image: "/landing/shops/shop-fastfood.png",
    rating: 4.7,
    reviews: 156,
  },
  {
    name: "Pharmacie du Plateau",
    type: "Pharmacie",
    city: "Cotonou",
    url: "plateau.yonukom.com",
    image: "/landing/shops/shop-pharmacy.png",
    rating: 4.9,
    reviews: 94,
  },
];

/* ------------------------------------------------------------------ */
/*  Browser-frame mockup card                                        */
/* ------------------------------------------------------------------ */

function ShopCard({ shop }: { shop: ShopSite }) {
  return (
    <div className="group relative w-[340px] sm:w-[480px] shrink-0 mx-3">
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/70 shadow-lg shadow-slate-900/5 group-hover:shadow-[0_24px_48px_-16px_rgba(233,30,99,0.28)] group-hover:-translate-y-1 transition-all duration-300">
        {/* Browser top bar */}
        <div className="flex items-center gap-2 px-4 h-9 bg-slate-50 border-b border-slate-200/70">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFE66D]/90" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#4ECDC4]/80" />
          <div className="flex-1 flex items-center justify-center">
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate px-2 py-0.5 rounded bg-white border border-slate-200/60 max-w-[240px]">
              {shop.url}
            </span>
          </div>
        </div>

        {/* Website screenshot */}
        <div className="relative aspect-[2/1] bg-slate-100 overflow-hidden">
          <img
            src={shop.image}
            alt={`Site internet de ${shop.name} créé avec YonuKom`}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
          {/* subtle pink tint overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#E91E63]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Footer info */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {shop.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {shop.type} • {shop.city}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md bg-[#E91E63]/8">
              <Star className="w-3 h-3 fill-[#E91E63] text-[#E91E63]" />
              <span className="text-xs font-bold text-[#E91E63]">{shop.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              {shop.reviews} avis clients
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E91E63]">
              Visiter le site
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section                                                           */
/* ------------------------------------------------------------------ */

interface TrustedShopsProps {
  onSignup?: () => void;
}

export function TrustedShops({ onSignup }: TrustedShopsProps) {
  // Duplicate the list for a seamless marquee loop
  const loop = [...shops, ...shops];

  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20 mb-4">
            <Globe className="w-3.5 h-3.5 text-[#E91E63]" />
            <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
              Sites internet créés avec YonuKom
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Ils ont fait{" "}
            <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              confiance
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Chaque boutique qui crée son site internet avec YonuKom rejoint
            notre vitrine. Voici quelques sites en ligne — défilez pour explorer.
          </p>
        </motion.div>
      </div>

      {/* Marquee carousel — full-width, edge-faded */}
      <div className="relative">
        {/* Left edge fade */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
        {/* Right edge fade */}
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

        {/* Scrolling track (duplicated content for seamless loop) */}
        <div className="flex animate-marquee py-4">
          {loop.map((shop, i) => (
            <ShopCard key={i} shop={shop} />
          ))}
        </div>
      </div>

      {/* Stats + CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-3xl mx-auto px-4 sm:px-6 mt-12 sm:mt-16 text-center"
      >
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              +250
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">Sites en ligne</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              8 pays
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">Afrique de l&apos;Ouest</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              4,9/5
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-1">Satisfaction moyenne</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignup}
          className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-lg shadow-[#E91E63]/25 transition-all"
        >
          Créer mon site internet
          <ExternalLink className="w-4 h-4" />
        </button>
      </motion.div>
    </section>
  );
}
