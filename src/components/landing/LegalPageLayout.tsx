"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ScrollToTop } from "@/components/landing/ScrollToTop";

interface LegalPageLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared layout for legal / static pages (contact, à propos, mentions, etc.)
 * - Navbar variant="app" with logo + "Retour au site" button
 * - Footer
 * - ScrollToTop button
 */
export function LegalPageLayout({ children }: LegalPageLayoutProps) {
  const router = useRouter();

  const goHome = () => router.push("/");
  // Les CTAs "Se connecter" / "Commencer" du Navbar basculent vers la page
  // d'accueil avec le paramètre ?view= pour ouvrir directement le bon formulaire
  // (page.tsx lit ce paramètre via window.location.search au montage).
  const goLogin = () => router.push("/?view=login");
  const goSignup = () => router.push("/?view=signup");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" onBackToHome={goHome} onLogin={goLogin} onSignup={goSignup} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
