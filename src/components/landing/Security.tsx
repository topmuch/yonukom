"use client";

import { motion } from "framer-motion";
import { Shield, Users, ClipboardList } from "lucide-react";

const securityFeatures = [
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Anti-Vol",
    description:
      "Chaque action est tracée. Sachez qui a annulé une vente, modifié un prix ou fermé la caisse.",
    color: "text-yk-deep",
    bgColor: "bg-yk-deep/10",
    borderColor: "border-yk-deep/15",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Gestion des Rôles",
    description:
      "Vos vendeurs encaissent, mais seul vous voyez les bénéfices et les marges.",
    color: "text-yk-emerald",
    bgColor: "bg-yk-emerald/10",
    borderColor: "border-yk-emerald/15",
  },
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: "Journal d'Audit",
    description:
      "Historique complet de toutes les opérations. Aucune modification n'est invisible.",
    color: "text-yk-amber",
    bgColor: "bg-yk-amber/10",
    borderColor: "border-yk-amber/15",
  },
];

export function Security() {
  return (
    <section className="py-20 sm:py-28 lg:py-32 bg-white">
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
            Sécurité &{" "}
            <span className="text-yk-emerald">Transparence</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/60 leading-relaxed">
            Contrôlez votre activité. Savourez la tranquillité.
          </p>
        </motion.div>

        {/* 3 columns */}
        <div className="grid sm:grid-cols-3 gap-8">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`text-center p-8 rounded-3xl border ${feature.borderColor} bg-white hover:shadow-xl hover:shadow-yk-deep/5 transition-all duration-300`}
            >
              <div
                className={`w-16 h-16 rounded-2xl ${feature.bgColor} ${feature.color} flex items-center justify-center mx-auto mb-6`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-yk-deep mb-3">
                {feature.title}
              </h3>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
