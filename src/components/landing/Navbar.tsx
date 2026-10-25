"use client";

import { useState, useEffect, useCallback } from "react";
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
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  X,
} from "lucide-react";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const sectionIds = ["features", "pricing", "faq"];

interface NavbarProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onBackToHome?: () => void;
  variant?: "landing" | "app";
}

// Smooth scroll utility with navbar offset
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function Navbar({
  onLogin,
  onSignup,
  onBackToHome,
  variant = "landing",
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const scrollPos = window.scrollY + 120;
      let current: string | null = null;
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = useCallback(
    (e: React.MouseEvent, href: string) => {
      e.preventDefault();
      const id = href.replace("#", "");
      scrollToSection(id);
      setMobileOpen(false);
    },
    [],
  );

  // App variant — used during onboarding
  if (variant === "app") {
    return (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 group"
              type="button"
            >
              <div className="w-8 h-8 rounded-lg bg-[#338BE2] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-[#338BE2]/30">
                <span className="text-white font-bold text-xs">YK</span>
              </div>
              <span className="text-base font-bold text-slate-900">YonuKom</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 gap-1"
              onClick={onBackToHome}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au site
            </Button>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl shadow-[0_4px_24px_-8px_rgba(51,139,226,0.15)] border-b border-[#338BE2]/10"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-[#338BE2]/30">
              <span className="text-white font-bold text-sm">YK</span>
            </div>
            <span
              className={`text-xl font-bold tracking-tight transition-colors ${
                scrolled ? "text-slate-900" : "text-slate-900"
              }`}
            >
              YonuKom
            </span>
          </button>

          {/* Desktop Nav Links (center) */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => {
              const sectionId = link.href.replace("#", "");
              const isActive = activeSection === sectionId;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "text-[#338BE2]"
                      : "text-slate-600 hover:text-[#338BE2]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#338BE2]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop CTAs (right) */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-700 hover:text-[#338BE2] hover:bg-[#338BE2]/5 font-medium"
              onClick={onLogin}
            >
              Se connecter
            </Button>
            <Button
              size="sm"
              className="bg-[#338BE2] hover:bg-[#2074C6] text-white font-medium shadow-md shadow-[#338BE2]/25"
              onClick={onSignup}
            >
              S&rsquo;inscrire
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-slate-900"
                aria-label="Ouvrir le menu"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[340px] bg-white p-0 border-l border-[#338BE2]/10"
            >
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center shadow-md shadow-[#338BE2]/30">
                      <span className="text-white font-bold text-sm">YK</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      YonuKom
                    </span>
                  </div>
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
                  {navLinks.map((link, i) => (
                    <motion.button
                      key={link.href}
                      type="button"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="flex items-center gap-3 w-full text-left py-3 px-4 text-base font-medium text-slate-700 hover:text-[#338BE2] hover:bg-[#338BE2]/5 rounded-xl transition-all"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#338BE2]/60" />
                      {link.label}
                    </motion.button>
                  ))}
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
                    className="w-full bg-[#338BE2] hover:bg-[#2074C6] text-white font-medium shadow-md shadow-[#338BE2]/25"
                    onClick={() => {
                      setMobileOpen(false);
                      onSignup?.();
                    }}
                  >
                    <Sparkles className="w-4 h-4" />
                    S&rsquo;inscrire gratuitement
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
