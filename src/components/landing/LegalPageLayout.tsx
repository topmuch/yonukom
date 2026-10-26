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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar variant="app" onBackToHome={goHome} />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
