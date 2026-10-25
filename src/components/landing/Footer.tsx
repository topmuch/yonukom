"use client";

import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  ArrowUp,
} from "lucide-react";

const footerSections = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#features" },
      { label: "Tarifs", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
      { label: "Démo", href: "#" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { label: "À propos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Carrières", href: "#" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Conditions d'utilisation", href: "#" },
      { label: "Politique de confidentialité", href: "#" },
      { label: "Mentions légales", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: <MessageCircle className="w-4 h-4" />, href: "#", label: "WhatsApp" },
  { icon: <Facebook className="w-4 h-4" />, href: "#", label: "Facebook" },
  { icon: <Instagram className="w-4 h-4" />, href: "#", label: "Instagram" },
];

export function Footer() {
  return (
    <footer id="contact" className="bg-slate-950 text-white relative overflow-hidden">
      {/* Decorative gradient */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(51,139,226,0.4) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="py-12 sm:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center shadow-md shadow-[#338BE2]/30">
                <span className="text-white font-bold text-sm">YK</span>
              </div>
              <span className="text-xl font-bold tracking-tight">YonuKom</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              Le logiciel de caisse et de gestion qui s&apos;adapte aux
              commerçants d&apos;Afrique de l&apos;Ouest. Ultra-rapide,
              mobile-first, offline-first.
            </p>

            <div className="space-y-2 pt-2">
              <a
                href="mailto:contact@yonukom.sn"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-[#5BA5EA] transition-colors"
              >
                <Mail className="w-4 h-4" />
                contact@yonukom.sn
              </a>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                Dakar, Sénégal
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#338BE2] border border-white/10 hover:border-[#338BE2] flex items-center justify-center transition-all text-slate-400 hover:text-white"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="space-y-4"
            >
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-[#5BA5EA] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom bar */}
        <Separator className="bg-white/10" />
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 YonuKom. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500">
              Fait avec soin à Dakar, Sénégal
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#338BE2] border border-white/10 hover:border-[#338BE2] flex items-center justify-center text-slate-400 hover:text-white transition-all"
              aria-label="Retour en haut"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
