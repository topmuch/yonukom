"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

const navLinks = [
  { label: "YonuKom", href: "/yonukom" },
  { label: "À propos", href: "/a-propos" },
  { label: "Fonctionnalités", href: "/fonctionnalites" },
  { label: "Métiers", href: "#metiers" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

interface NavbarProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onBackToHome?: () => void;
  variant?: "landing" | "app";
}

export function Navbar({
  onLogin,
  onSignup,
  onBackToHome,
  variant = "landing",
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigation : si href commence par "/", on route côté client via Next router
  // (les boutons <button> ne naviguent pas naturellement comme les <a>)
  // Si href commence par "#", on fait un smooth scroll vers la section.
  const handleNavClick = useCallback(
    (e: React.MouseEvent, href: string) => {
      e.preventDefault();
      setMobileOpen(false);
      if (href.startsWith("/")) {
        // Route réelle — navigation côté client
        router.push(href);
      } else if (href.startsWith("#")) {
        // Ancre vers une section de la page courante
        const id = href.replace("#", "");
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            const offset = 80;
            const top = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
          }
        } else {
          // "#" tout seul → remonter en haut
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    },
    [router],
  );

  const handleLogoClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (variant === "app" && onBackToHome) {
        onBackToHome();
      } else {
        // Sur la landing page, le logo remonte en haut
        if (pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          router.push("/");
        }
      }
    },
    [variant, onBackToHome, router, pathname],
  );

  // Vérifier si un lien est "actif" (correspond à la route courante)
  const isActiveLink = (href: string) => {
    if (!href.startsWith("/")) return false;
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  // App variant — sticky white navbar mais AVEC les liens et les CTAs
  // (utilisé sur les pages secondaires : /fonctionnalites, /tarifs, /faq, /yonukom, etc.)
  if (variant === "app") {
    return (
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200/70 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 group shrink-0"
              type="button"
              aria-label="Retour à l'accueil YonuKom"
            >
              <img
                src="/brand/logo.png"
                alt="YonuKom"
                className="h-8 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = isActiveLink(link.href);
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "text-[#E91E63]"
                        : "text-slate-600 hover:text-[#E91E63]"
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline-app"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#E91E63]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-700 hover:text-[#E91E63] hover:bg-[#E91E63]/5 font-medium"
                onClick={onLogin}
              >
                Se connecter
              </Button>
              <Button
                size="sm"
                className="bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-md shadow-[#E91E63]/25 gap-1.5 h-10 px-5 rounded-full"
                onClick={onSignup}
              >
                Commencer
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-slate-900"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[340px] bg-white p-0 border-l border-[#E91E63]/10"
              >
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <img
                      src="/brand/logo.png"
                      alt="YonuKom"
                      className="h-9 w-auto object-contain rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setMobileOpen(false)}
                      aria-label="Fermer"
                      className="text-slate-500 hover:text-slate-900"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Links */}
                  <div className="flex-1 p-4 space-y-1">
                    {navLinks.map((link, i) => {
                      const isActive = isActiveLink(link.href);
                      return (
                        <motion.button
                          key={link.href}
                          type="button"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={(e) => handleNavClick(e, link.href)}
                          className={`flex items-center gap-3 w-full text-left py-3 px-4 text-base font-medium rounded-xl transition-all ${
                            isActive
                              ? "bg-[#E91E63]/5 text-[#E91E63]"
                              : "text-slate-700 hover:text-[#E91E63] hover:bg-[#E91E63]/5"
                          }`}
                        >
                          {link.label}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* CTAs */}
                  <div className="p-6 space-y-2.5 border-t border-slate-100">
                    <Button
                      variant="outline"
                      className="w-full font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setMobileOpen(false);
                        onLogin?.();
                      }}
                    >
                      Se connecter
                    </Button>
                    <Button
                      className="w-full bg-[#E91E63] hover:bg-[#AD1457] text-white font-medium shadow-md shadow-[#E91E63]/25 gap-1.5"
                      onClick={() => {
                        setMobileOpen(false);
                        onSignup?.();
                      }}
                    >
                      Commencer
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </header>
    );
  }

  // Landing variant — floating transparent navbar over the Hero
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_24px_-8px_rgba(51,139,226,0.15)] border-b border-[#E91E63]/10 py-2"
          : "bg-transparent py-3"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 group shrink-0"
            aria-label="Retour à l'accueil YonuKom"
          >
            <img src="/brand/logo.png" alt="YonuKom" className="h-8 sm:h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          </button>

          {/* Desktop Nav Links (center) */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = isActiveLink(link.href);
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-[#E91E63]"
                      : "text-slate-600 hover:text-[#E91E63]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline-landing"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#E91E63]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop CTAs (right) */}
          <div className="hidden lg:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-[#E91E63] hover:bg-[#E91E63]/5 font-medium"
              onClick={onLogin}
            >
              Se connecter
            </Button>
            <Button
              size="sm"
              className="bg-[#E91E63] hover:bg-[#AD1457] text-white font-semibold shadow-md shadow-[#E91E63]/25 gap-1.5 h-10 px-5 rounded-full"
              onClick={onSignup}
            >
              Commencer
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-900"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[340px] bg-white p-0 border-l border-[#E91E63]/10"
            >
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <img
                    src="/brand/logo.png"
                    alt="YonuKom"
                    className="h-9 w-auto object-contain"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileOpen(false)}
                    aria-label="Fermer"
                    className="text-slate-500 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Links */}
                <div className="flex-1 p-4 space-y-1">
                  {navLinks.map((link, i) => {
                    const isActive = isActiveLink(link.href);
                    return (
                      <motion.button
                        key={link.href}
                        type="button"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className={`flex items-center gap-3 w-full text-left py-3 px-4 text-base font-medium rounded-xl transition-all ${
                          isActive
                            ? "bg-[#E91E63]/5 text-[#E91E63]"
                            : "text-slate-700 hover:text-[#E91E63] hover:bg-[#E91E63]/5"
                        }`}
                      >
                        {link.label}
                      </motion.button>
                    );
                  })}
                </div>

                {/* CTAs */}
                <div className="p-6 space-y-2.5 border-t border-slate-100">
                  <Button
                    variant="outline"
                    className="w-full font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setMobileOpen(false);
                      onLogin?.();
                    }}
                  >
                    Se connecter
                  </Button>
                  <Button
                    className="w-full bg-[#E91E63] hover:bg-[#AD1457] text-white font-medium shadow-md shadow-[#E91E63]/25 gap-1.5"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignup?.();
                    }}
                  >
                    Commencer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <AnimatePresence />
    </motion.header>
  );
}
