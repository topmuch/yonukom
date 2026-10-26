"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  MessageCircle,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  ArrowUp,
  X,
  ShieldCheck,
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
      { label: "À propos", href: "#about" },
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
      { label: "Cookies", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: MessageCircle, href: "#", label: "WhatsApp" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
];

export function Footer() {
  const [cookieVisible, setCookieVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined"
      && window.localStorage.getItem("yk_cookie_dismissed") === "1";
    if (!dismissed) {
      const t = setTimeout(() => setCookieVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissCookie = () => {
    setCookieVisible(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("yk_cookie_dismissed", "1");
    }
  };

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
        {/* Main footer content — 4 columns */}
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
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#338BE2] border border-white/10 hover:border-[#338BE2] flex items-center justify-center transition-all text-slate-400 hover:text-white"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-4">
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
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <Separator className="bg-white/10" />
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 YonuKom. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Fait avec soin à Dakar, Sénégal
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#338BE2] border border-white/10 hover:border-[#338BE2] flex items-center justify-center text-slate-400 hover:text-white transition-all"
              aria-label="Retour en haut"
              type="button"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Cookie bar */}
      <AnimatePresence>
        {cookieVisible && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 px-4 sm:px-6 pb-4 sm:pb-6"
          >
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#338BE2]/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#338BE2]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Nous utilisons des cookies
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Pour améliorer votre expérience et analyser le trafic. Vous
                    pouvez accepter ou refuser à tout moment.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={dismissCookie}
                  className="flex-1 sm:flex-initial px-4 h-10 rounded-xl text-sm font-medium text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={dismissCookie}
                  className="flex-1 sm:flex-initial px-4 h-10 rounded-xl text-sm font-semibold text-white bg-[#338BE2] hover:bg-[#2074C6] transition-colors"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={dismissCookie}
                  aria-label="Fermer"
                  className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}
