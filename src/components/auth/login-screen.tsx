// ============================================================
// YonuKom — Login Screen (Professional split-screen)
// Two separate portals: Espace Commerce (clients) & Espace Platform (superadmin)
// ============================================================

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  ShieldCheck,
  Store,
  Lock,
  Mail,
  Sparkles,
  Zap,
  BarChart3,
  Users,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConfigStore } from "@/stores/use-config-store";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

type Portal = "commerce" | "platform";
type View = "portal" | "login";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  successMessage?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Demo credentials                                                  */
/* ------------------------------------------------------------------ */

const roleUsers: Record<UserRole, { name: string; email: string; password: string }> = {
  superadmin: { name: "Admin YonuKom", email: "admin@yonukom.sn", password: "yonukom123" },
  patron: { name: "Ibrahima Fall", email: "ibrahima@yonukom.sn", password: "yonukom123" },
  gerant: { name: "Mamadou Diallo", email: "mamadou@yonukom.sn", password: "yonukom123" },
  vendeur: { name: "Fatou Sow", email: "fatou@yonukom.sn", password: "yonukom123" },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function LoginScreen({ onLoginSuccess, successMessage }: LoginScreenProps) {
  const [view, setView] = useState<View>("portal");
  const [portal, setPortal] = useState<Portal>("commerce");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(successMessage ?? null);

  const login = useAuthStore((s) => s.login);
  const loadConfig = useConfigStore((s) => s.loadConfig);

  /* ----------------------- Auth logic ----------------------- */

  const performLogin = async (userEmail: string, userPassword: string, expectedRole?: UserRole) => {
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: userPassword }),
      });
      const data = await res.json();

      if (res.ok && data.user) {
        // If a specific role was expected (portal guard), verify it matches
        if (expectedRole && data.user.role !== expectedRole) {
          setError(
            expectedRole === "superadmin"
              ? "Ce compte n'est pas un compte administrateur plateforme."
              : "Ce compte est un compte administrateur plateforme. Utilisez l'Espace Platform."
          );
          setLoading(false);
          return;
        }
        login(data.user, data.token);
        if (typeof data.onboardingConfig === "string" && data.onboardingConfig) {
          loadConfig(data.onboardingConfig);
        } else {
          useConfigStore.setState({ isOnboarded: false, isLoaded: true });
        }
        onLoginSuccess();
        return;
      }
      setError(data.error || "Email ou mot de passe incorrect.");
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    performLogin(email, password, portal === "platform" ? "superadmin" : undefined);
  };

  const handleDemoLogin = async (role: UserRole) => {
    const u = roleUsers[role];
    setLoading(true);
    setError(null);

    // Try real API login first
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: u.email, password: u.password }),
      });
      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        if (typeof data.onboardingConfig === "string" && data.onboardingConfig) {
          loadConfig(data.onboardingConfig);
        } else {
          useConfigStore.setState({ isOnboarded: false, isLoaded: true });
        }
        onLoginSuccess();
        return;
      }
    } catch {
      // fallback below
    }

    // Fallback demo session (in-memory)
    login({
      id: `demo-${role}`,
      email: u.email,
      name: u.name,
      role,
      businessId: role === "superadmin" ? "" : "demo",
      businessName: role === "superadmin" ? "YonuKom Platform" : "YonuKom Demo",
    });

    if (role !== "superadmin") {
      try {
        loadConfig(
          JSON.stringify({
            businessType: "mixte",
            paymentMethods: ["cash", "wave", "orange_money"],
            primaryPaymentMethod: "cash",
            trackStock: true,
            lowStockAlert: true,
            alertThreshold: 5,
            teamRoles: ["patron", "vendeur"],
            needCashRegister: true,
            language: "fr",
            useReceiptPrinter: false,
            useBarcodeScanner: false,
            manageReservations: false,
          })
        );
      } catch {
        useConfigStore.setState({ isOnboarded: false, isLoaded: true });
      }
    } else {
      useConfigStore.setState({ isOnboarded: true, isLoaded: true });
    }
    setLoading(false);
    onLoginSuccess();
  };

  /* ----------------------- Navigation ----------------------- */

  const selectPortal = (p: Portal) => {
    setPortal(p);
    setView("login");
    setError(null);
    setInfo(null);
    setEmail("");
    setPassword("");
  };

  const backToPortal = () => {
    setView("portal");
    setError(null);
    setInfo(null);
    setEmail("");
    setPassword("");
  };

  /* ----------------------- Render ----------------------- */

  return (
    <div className="min-h-screen flex bg-white">
      {/* ============ Left brand panel (desktop only) ============ */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#AD1457]">
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#FF6B6B]/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "26px 26px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo-white.png"
              alt="YonuKom"
              className="h-10 w-auto object-contain rounded-md"
            />
          </div>

          {/* Middle — tagline + features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
                La gestion de votre commerce,
                <br />
                <span className="text-white/90">enfin Yomb.</span>
              </h2>
              <p className="mt-4 text-white/80 text-base leading-relaxed max-w-md">
                Caisse, stock, paiements, site internet et rapports —
                tout réuni dans une seule plateforme pensée pour l&apos;Afrique de l&apos;Ouest.
              </p>
            </div>

            <ul className="space-y-3.5 max-w-md">
              {[
                { icon: Zap, text: "Caisse tactile ultra-rapide, hors ligne" },
                { icon: Smartphone, text: "Vente mobile & encaissement Wave / Orange Money" },
                { icon: BarChart3, text: "Rapports temps réel & analytics IA" },
                { icon: Users, text: "Multi-boutiques & multi-utilisateurs avec rôles" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <f.icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-sm text-white/90 font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer stats */}
          <div className="flex items-center gap-8 text-white">
            <div>
              <div className="text-2xl font-extrabold">+250</div>
              <div className="text-xs text-white/70">boutiques</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <div className="text-2xl font-extrabold">8</div>
              <div className="text-xs text-white/70">pays</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <div className="text-2xl font-extrabold">4,9/5</div>
              <div className="text-xs text-white/70">satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Right login panel ============ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile logo (visible only on small screens) */}
        <div className="lg:hidden mb-8 text-center">
          <img
            src="/brand/logo.png"
            alt="YonuKom"
            className="h-10 w-auto object-contain mx-auto rounded-md"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Le logiciel qui s&apos;adapte au commerçant
          </p>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* ---------- PORTAL SELECTION ---------- */}
            {view === "portal" && (
              <motion.div
                key="portal"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Bienvenue
                  </h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choisissez votre espace pour continuer
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Commerce portal */}
                  <button
                    type="button"
                    onClick={() => selectPortal("commerce")}
                    className="group w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-[#E91E63] bg-white hover:bg-[#FFF1F5]/40 transition-all hover:shadow-[0_16px_32px_-12px_rgba(233,30,99,0.25)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] flex items-center justify-center shrink-0 shadow-lg shadow-[#E91E63]/30">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-base">
                          Espace Commerce
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Patrons, gérants et vendeurs — accédez à votre caisse,
                          stock et rapports.
                        </p>
                        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                          {(["patron", "gerant", "vendeur"] as UserRole[]).map((r) => (
                            <span
                              key={r}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                            >
                              {ROLE_LABELS[r]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#E91E63] group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>
                  </button>

                  {/* Platform (superadmin) portal */}
                  <button
                    type="button"
                    onClick={() => selectPortal("platform")}
                    className="group w-full text-left p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-900 bg-white hover:bg-slate-50 transition-all hover:shadow-[0_16px_32px_-12px_rgba(15,23,42,0.3)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-slate-900/30">
                        <ShieldCheck className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">
                            Espace Platform
                          </h3>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900 text-white">
                            Admin
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Administrateurs YonuKom — pilotage de la plateforme,
                          tenants et analytics globales.
                        </p>
                        <div className="flex items-center gap-1.5 mt-3">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-medium">
                            Accès réservé et sécurisé
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                    </div>
                  </button>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-8">
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      const ev = new CustomEvent("yonukom-go-signup");
                      window.dispatchEvent(ev);
                    }}
                    className="font-semibold text-[#E91E63] hover:underline"
                  >
                    Créer ma boutique
                  </button>
                </p>
              </motion.div>
            )}

            {/* ---------- LOGIN FORM ---------- */}
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={backToPortal}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </button>

                {/* Portal header */}
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      portal === "commerce"
                        ? "bg-gradient-to-br from-[#E91E63] to-[#AD1457] shadow-lg shadow-[#E91E63]/30"
                        : "bg-gradient-to-br from-slate-800 to-slate-950 shadow-lg shadow-slate-900/30"
                    }`}
                  >
                    {portal === "commerce" ? (
                      <Store className="w-[22px] h-[22px] text-white" />
                    ) : (
                      <ShieldCheck className="w-[22px] h-[22px] text-white" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">
                      {portal === "commerce" ? "Espace Commerce" : "Espace Platform"}
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      {portal === "commerce"
                        ? "Connectez-vous à votre boutique"
                        : "Accès administrateur sécurisé"}
                    </p>
                  </div>
                </div>

                {/* Info / success banner */}
                {info && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2 mb-4"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{info}</span>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-semibold text-slate-700">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="vous@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-700">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        className="pl-10 pr-10 h-11"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium text-destructive bg-destructive/8 border border-destructive/20 p-3 rounded-lg flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className={`w-full h-11 font-semibold gap-2 ${
                      portal === "commerce"
                        ? "bg-[#E91E63] hover:bg-[#AD1457] shadow-lg shadow-[#E91E63]/25"
                        : "bg-slate-900 hover:bg-slate-800 shadow-lg shadow-slate-900/25"
                    }`}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : portal === "platform" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <Store className="w-4 h-4" />
                    )}
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>

                {/* Demo quick-access */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <p className="text-[11px] text-muted-foreground text-center mb-3 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Démo rapide (exploration)
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {(portal === "commerce"
                      ? (["patron", "gerant", "vendeur"] as UserRole[])
                      : (["superadmin"] as UserRole[])
                    ).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleDemoLogin(role)}
                        disabled={loading}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all disabled:opacity-50 ${
                          portal === "commerce"
                            ? "border-[#E91E63]/30 text-[#E91E63] hover:bg-[#E91E63]/10"
                            : "border-slate-300 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {ROLE_LABELS[role]}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} YonuKom — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
