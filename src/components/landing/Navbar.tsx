"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu, Sparkles, ArrowLeft } from "lucide-react";

const navLinks = [
  { label: "Fonctionnalités", href: "#features" },
  { label: "Tarifs", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const sectionIds = ["features", "pricing", "faq", "contact"];

interface NavbarProps {
  onLogin?: () => void;
  onSignup?: () => void;
  onBackToHome?: () => void;
  variant?: "landing" | "app";
}

// Smooth scroll utility
function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const offset = 80; // navbar height
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

export function Navbar({ onLogin, onSignup, onBackToHome, variant = "landing" }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Scroll detection + active section tracking
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);

      // Determine active section
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
    onScroll(); // Initial check
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const id = href.replace("#", "");
    scrollToSection(id);
    setMobileOpen(false);
  }, []);

  // App variant (compact navbar for dashboard)
  if (variant === "app") {
    return (
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <button onClick={onBackToHome} className="flex items-center gap-2 group" type="button">
              <div className="w-8 h-8 rounded-lg bg-yk-deep flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-xs">YK</span>
              </div>
              <span className="text-base font-bold text-yk-deep">YonuKom</span>
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="text-foreground/60 hover:text-foreground gap-1"
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
          ? "bg-white/80 backdrop-blur-lg shadow-sm border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-yk-deep flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-sm">YK</span>
            </div>
            <span className="text-xl font-bold text-yk-deep">YonuKom</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const sectionId = link.href.replace("#", "");
              const isActive = activeSection === sectionId;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`text-sm font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-yk-deep after:transition-all after:duration-300 ${
                    isActive
                      ? "text-yk-deep after:w-full"
                      : "text-foreground/70 hover:text-yk-deep after:w-0 hover:after:w-full"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-yk-deep hover:text-yk-deep font-medium"
              onClick={onLogin}
            >
              Se connecter
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-yk-deep border-yk-deep/30 hover:bg-yk-deep/5 font-medium"
              onClick={onSignup}
            >
              S&rsquo;inscrire
            </Button>
            <Button
              size="sm"
              className="bg-yk-deep hover:bg-yk-deep-light text-white font-medium gap-1.5 shadow-lg shadow-yk-deep/20"
              onClick={onSignup}
            >
              <Sparkles className="w-4 h-4" />
              Essayer gratuitement
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-white p-0">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-yk-deep flex items-center justify-center">
                      <span className="text-white font-bold text-xs">YK</span>
                    </div>
                    <span className="text-lg font-bold text-yk-deep">YonuKom</span>
                  </div>
                </div>

                <div className="flex-1 p-6 space-y-1">
                  {navLinks.map((link, i) => (
                    <motion.button
                      key={link.href}
                      type="button"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="block w-full text-left py-3 px-4 text-base font-medium text-foreground/80 hover:text-yk-deep hover:bg-yk-deep/5 rounded-lg transition-all"
                    >
                      {link.label}
                    </motion.button>
                  ))}
                </div>

                <div className="p-6 space-y-3 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full font-medium"
                    onClick={() => { setMobileOpen(false); onLogin?.(); }}
                  >
                    Se connecter
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full font-medium text-yk-deep border-yk-deep/40 hover:bg-yk-deep/5"
                    onClick={() => { setMobileOpen(false); onSignup?.(); }}
                  >
                    S&rsquo;inscrire
                  </Button>
                  <Button
                    className="w-full bg-yk-deep hover:bg-yk-deep-light text-white font-medium gap-1.5"
                    onClick={() => { setMobileOpen(false); onSignup?.(); }}
                  >
                    <Sparkles className="w-4 h-4" />
                    Essayer gratuitement
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  );
}
