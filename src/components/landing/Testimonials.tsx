"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Fatou D.",
    role: "Boutiquière à Dakar",
    initials: "FD",
    avatar: "/avatar-fatou.png",
    citation:
      "Avant YonuKom, je recomptais mon cahier chaque soir. Maintenant, je connais mon CA en un clic.",
    accentColor: "bg-yk-deep/10 text-yk-deep",
  },
  {
    name: "Moussa K.",
    role: "Vendeur TikTok",
    initials: "MK",
    avatar: "/avatar-moussa.png",
    citation:
      "Je prépare mes messages WhatsApp en 10 secondes pendant mon live. C'est magique !",
    accentColor: "bg-yk-emerald/10 text-yk-emerald",
  },
  {
    name: "Awa S.",
    role: "Restauratrice",
    initials: "AS",
    avatar: "/avatar-awa.png",
    citation:
      "Je sais exactement combien de Thiébou j'ai préparé et vendu. Fini le gaspillage !",
    accentColor: "bg-yk-amber/10 text-yk-amber",
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const testimonial = testimonials[current];

  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-yk-surface">
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
            Ils nous font{" "}
            <span className="text-yk-emerald">confiance</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/60">
            Des commerçants comme vous, chaque jour.
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="max-w-3xl mx-auto">
          <div className="relative min-h-[280px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="text-center space-y-6"
              >
                {/* Quote icon */}
                <div className="flex justify-center">
                  <Quote className="w-10 h-10 text-yk-deep/15 rotate-180" />
                </div>

                {/* Citation */}
                <blockquote className="text-xl sm:text-2xl font-medium text-yk-deep leading-relaxed">
                  &ldquo;{testimonial.citation}&rdquo;
                </blockquote>

                {/* Stars */}
                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yk-amber text-yk-amber" />
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-center gap-3">
                  <Avatar className="w-14 h-14 ring-2 ring-white shadow-md">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className={testimonial.accentColor + " font-bold"}>
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-semibold text-yk-deep">{testimonial.name}</p>
                    <p className="text-sm text-foreground/50">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Témoignage ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-8 h-3 bg-yk-deep"
                    : "w-3 h-3 bg-foreground/15 hover:bg-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
