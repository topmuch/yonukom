"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Sparkles,
  Star,
} from "lucide-react";

interface HeroProps {
  onSignup?: () => void;
}

const SLIDES = [
  {
    src: "/hero-slides/hero-slide-1.png",
    alt: "Serveuse souriante dans un restaurant utilisant son smartphone pour encaisser — YonuKom adapté à la restauration",
  },
  {
    src: "/hero-slides/hero-slide-2.png",
    alt: "Entrepreneuse africaine en live-shopping de vêtements sur les réseaux sociaux depuis sa boutique — YonuKom pour le e-commerce",
  },
  {
    src: "/hero-slides/hero-slide-3.png",
    alt: "Vendeuse dans une boutique de cosmétiques utilisant son smartphone pour gérer ses ventes — YonuKom pour le commerce de détail",
  },
];

const SLIDE_DURATION_MS = 4500;

export function Hero({ onSignup }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const id = setInterval(nextSlide, SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, [nextSlide]);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#F6F9FE] pt-24 sm:pt-28 pb-16 sm:pb-20">
      {/* Subtle blue gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F6F9FE] via-white to-[#EAF1FC]" />

      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #338BE2 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Floating gradient orbs */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -right-32 w-[480px] h-[480px] rounded-full blur-3xl opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(51,139,226,0.25) 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -15, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -left-32 w-[520px] h-[520px] rounded-full blur-3xl opacity-60"
        style={{
          background:
            "radial-gradient(circle, rgba(183,190,218,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT: Text + CTA */}
          <div className="space-y-7 max-w-xl">
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur border border-[#338BE2]/20 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#338BE2] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#338BE2]" />
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  Paiements & caisse nouvelle génération
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-slate-900 leading-[1.05] tracking-tight"
            >
              Gérez votre{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
                  commerce
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.7 }}
                    d="M2 9C50 4 150 1 298 4"
                    stroke="#338BE2"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              en toute simplicité
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-slate-600 leading-relaxed"
            >
              Encaissez, suivez votre stock et envoyez des paiements en un
              clic. YonuKom fonctionne même hors ligne, partout en Afrique de
              l&apos;Ouest.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Button
                size="lg"
                className="bg-[#338BE2] hover:bg-[#2074C6] text-white font-semibold text-base gap-2 shadow-xl shadow-[#338BE2]/30 px-7 h-14 rounded-xl"
                onClick={onSignup}
              >
                <Sparkles className="w-5 h-5" />
                Commencer gratuitement
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/70 backdrop-blur border-slate-200 text-slate-700 hover:bg-white hover:border-[#338BE2]/30 hover:text-[#338BE2] font-semibold text-base gap-2 h-14 rounded-xl"
                onClick={onSignup}
              >
                <Play className="w-4 h-4" />
                Voir la démo
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex flex-wrap items-center gap-6 pt-2"
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["#338BE2", "#5BA5EA", "#B7BEDA", "#10B981"].map((c, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">640K+ utilisateurs</p>
                  <p className="text-slate-500">nous font confiance</p>
                </div>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                  <span className="ml-1.5 text-xs font-bold text-slate-900">
                    4.93/5
                  </span>
                </div>
                <p className="text-xs text-slate-500">Note moyenne</p>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Slideshow of generated hero illustrations (9:16 vertical) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="relative flex justify-center lg:justify-end"
          >
            {/* Slide container — 9:16 vertical aspect ratio */}
            <div className="relative w-full max-w-[420px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl shadow-[#338BE2]/25 border border-white/60 bg-white">
              {/* Slide images with crossfade */}
              <AnimatePresence mode="popLayout">
                <motion.img
                  key={currentSlide}
                  src={SLIDES[currentSlide].src}
                  alt={SLIDES[currentSlide].alt}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                />
              </AnimatePresence>

              {/* Subtle gradient overlay for visual polish (bottom fade for legibility) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Slide indicators (dots) */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {SLIDES.map((slide, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Voir l'illustration ${i + 1}`}
                  className="group p-1.5"
                >
                  <motion.span
                    animate={{
                      width: i === currentSlide ? 28 : 8,
                      backgroundColor:
                        i === currentSlide ? "#338BE2" : "#CBD5E1",
                    }}
                    transition={{ duration: 0.3 }}
                    className="block h-2 rounded-full"
                  />
                </button>
              ))}
            </div>

            {/* Floating "Synchronisé" badge — top-right corner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              className="absolute top-4 right-4 sm:top-6 sm:-right-3 bg-white/95 backdrop-blur rounded-xl shadow-lg shadow-[#338BE2]/10 p-2 border border-slate-100"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-700">
                  Synchronisé
                </span>
              </div>
            </motion.div>

            {/* Floating "Paiement reçu" badge — bottom-left corner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -20, y: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              transition={{ duration: 0.5, delay: 1.5 }}
              className="absolute bottom-4 left-4 sm:-left-6 bg-white rounded-2xl shadow-xl shadow-[#338BE2]/15 p-3 border border-slate-100 w-[170px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-500 truncate">
                    Paiement reçu
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    29 990 FCFA
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade to features */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/50 to-transparent pointer-events-none" />
    </section>
  );
}
