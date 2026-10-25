"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "YonuKom fonctionne-t-il sans internet ?",
    a: "Oui, absolument. Vous pouvez encaisser, gérer le stock et imprimer des tickets même hors ligne. Tout se synchronise automatiquement dès que le réseau revient.",
  },
  {
    q: "Combien de temps prend l'installation ?",
    a: "Moins de 5 minutes. Vous répondez à quelques questions sur votre commerce, et YonuKom configure automatiquement l'interface adaptée à vos besoins.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Oui. Vos données sont chiffrées et sauvegardées quotidiennement. De plus, chaque action est tracée dans un journal d'audit pour éviter les fraudes internes.",
  },
  {
    q: "Puis-je essayer avant de payer ?",
    a: "Oui, vous bénéficiez de 14 jours d'essai gratuit, sans engagement. Aucune carte bancaire n'est requise pour commencer.",
  },
  {
    q: "Comment se passe le support technique ?",
    a: "Nous offrons un support WhatsApp 7j/7 pour tous les utilisateurs. Les clients Pro et Entreprise bénéficient d'un support prioritaire avec temps de réponse garanti.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-28 lg:py-32 bg-yk-surface">
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
            Questions{" "}
            <span className="text-yk-emerald">fréquentes</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/60">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-2xl border border-border/50 px-6 data-[state=open]:shadow-md data-[state=open]:shadow-yk-deep/5 transition-shadow"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-yk-deep hover:text-yk-deep-light py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-foreground/60 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
