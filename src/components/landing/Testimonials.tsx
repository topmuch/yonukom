"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Fatou Diallo",
    role: "Boutiquière à Dakar",
    initials: "FD",
    avatar: "/avatar-fatou.png",
    rating: 5,
    citation:
      "Avant YonuKom, je recomptais mon cahier chaque soir. Maintenant, je connais mon CA en un clic, même sans internet.",
    accentColor: "bg-[#338BE2]/10 text-[#338BE2]",
  },
  {
    name: "Moussa Kanté",
    role: "Vendeur TikTok",
    initials: "MK",
    avatar: "/avatar-moussa.png",
    rating: 5,
    citation:
      "Je prépare mes messages WhatsApp et mes liens Wave en 10 secondes pendant mon live. C'est magique pour ma communauté.",
    accentColor: "bg-[#10B981]/10 text-[#10B981]",
  },
  {
    name: "Awa Sow",
    role: "Restauratrice",
    initials: "AS",
    avatar: "/avatar-awa.png",
    rating: 5,
    citation:
      "Je sais exactement combien de Thiébou j'ai préparé et vendu. Fini le gaspillage, mes marges ont explosé !",
    accentColor: "bg-amber-100 text-amber-600",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-[#F6F9FE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Témoignages
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Nos clients{" "}
            <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
              satisfaits
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Des commerçants comme vous, qui ont transformé leur quotidien.
          </p>
        </motion.div>

        {/* 3-card grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="bg-white rounded-3xl border border-slate-200/60 p-7 sm:p-8 shadow-sm hover:shadow-[0_20px_40px_-12px_rgba(51,139,226,0.18)] hover:-translate-y-1.5 transition-all duration-300 relative"
            >
              {/* Quote icon */}
              <div className="absolute -top-4 left-7 w-10 h-10 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center shadow-md shadow-[#338BE2]/25">
                <Quote className="w-5 h-5 text-white rotate-180" />
              </div>

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4 pt-2">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star
                    key={si}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Citation */}
              <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed mb-6">
                &ldquo;{t.citation}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <Avatar className="w-11 h-11 ring-2 ring-white shadow-md">
                  <AvatarImage src={t.avatar} alt={t.name} />
                  <AvatarFallback
                    className={t.accentColor + " font-bold text-sm"}
                  >
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
