"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ScrollToTop } from "@/components/landing/ScrollToTop";
import { Features } from "@/components/landing/Features";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MoreBenefits } from "@/components/landing/MoreBenefits";
import { GlobalTransfer } from "@/components/landing/GlobalTransfer";
import { CompleteSolutions } from "@/components/landing/CompleteSolutions";

export default function FonctionnalitesPage() {
  const router = useRouter();
  const goSignup = () => router.push("/?view=signup");
  const goLogin = () => router.push("/?view=login");
  const goHome = () => router.push("/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogin={goLogin} onSignup={goSignup} onBackToHome={goHome} variant="app" />
      <main className="flex-1 pt-14">
        <Features onSignup={goSignup} />
        <Benefits onSignup={goSignup} />
        <HowItWorks onSignup={goSignup} />
        <MoreBenefits onSignup={goSignup} />
        <GlobalTransfer onSignup={goSignup} />
        <CompleteSolutions onSignup={goSignup} />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
