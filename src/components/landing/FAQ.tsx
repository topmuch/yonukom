"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

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
  {
    q: "Acceptez-vous les paiements mobiles ?",
    a: "Oui, YonuKom prend en charge Wave, Orange Money et Free Money dans tous les pays d'Afrique de l'Ouest où nous opérons.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 sm:py-24 lg:py-28 bg-white relative">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E91E63]/10 border border-[#E91E63]/20 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#E91E63]" />
            <span className="text-xs font-semibold text-[#E91E63] uppercase tracking-wider">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Questions{" "}
            <span className="bg-gradient-to-r from-[#E91E63] to-[#F06292] bg-clip-text text-transparent">
              fréquentes
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
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
                className="bg-white rounded-2xl border border-slate-200/60 px-5 sm:px-6 transition-all data-[state=open]:border-[#E91E63]/40 data-[state=open]:shadow-[0_8px_24px_-8px_rgba(51,139,226,0.2)]"
              >
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900 hover:text-[#E91E63] py-5 hover:no-underline [&[data-state=open]>svg]:text-[#E91E63] [&[data-state=open]>svg]:rotate-180">
                  <span className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-[#E91E63]/10 flex items-center justify-center text-[#E91E63] text-xs font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {faq.q}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-500 leading-relaxed pb-5 pl-10">
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
