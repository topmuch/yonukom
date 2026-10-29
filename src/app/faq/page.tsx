"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ScrollToTop } from "@/components/landing/ScrollToTop";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";

export default function FaqPage() {
  const router = useRouter();
  const goSignup = () => router.push("/?view=signup");
  const goLogin = () => router.push("/?view=login");
  const goHome = () => router.push("/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogin={goLogin} onSignup={goSignup} onBackToHome={goHome} variant="app" />
      <main className="flex-1 pt-14">
        <FAQ />
        <FinalCTA onSignup={goSignup} />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
