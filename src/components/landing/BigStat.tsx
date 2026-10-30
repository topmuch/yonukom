"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function BigStat() {
  return (
    <section className="py-20 sm:py-24 lg:py-28 bg-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #338BE2 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(51,139,226,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] shadow-lg shadow-[#338BE2]/25 mb-8"
        >
          <Users className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.05]"
        >
          Plus de{" "}
          <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
            640K utilisateurs
          </span>{" "}
          utilisent YonuKom
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed"
        >
          Rejoignez la communauté de commerçants africains qui ont choisi la
          simplicité, la sécurité et la performance.
        </motion.p>
      </div>
    </section>
  );
}
