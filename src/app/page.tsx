// ============================================================
// YonuKom — Main Page (Client-Side Router)
// Flow: Landing → Login → Dashboard (role-based)
// Superadmin → SuperadminDashboard
// Regular user → Full POS/ERP Dashboard
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { motion, AnimatePresence } from "framer-motion";
import { LoginScreen } from "@/components/auth/login-screen";
import { SuperadminDashboard } from "@/components/superadmin/superadmin-dashboard";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Statistics } from "@/components/landing/Statistics";
import { MoreBenefits } from "@/components/landing/MoreBenefits";
import { GlobalTransfer } from "@/components/landing/GlobalTransfer";
import { Referral } from "@/components/landing/Referral";
import { CompleteSolutions } from "@/components/landing/CompleteSolutions";
import { Testimonials } from "@/components/landing/Testimonials";
import { BigStat } from "@/components/landing/BigStat";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { ScrollToTop } from "@/components/landing/ScrollToTop";
import { AppShell, type TabId } from "@/components/layout/app-shell";
import { PosScreen } from "@/components/pos/pos-screen";
import { OrderKanban } from "@/components/orders/order-kanban";
import { PipelineKanban } from "@/components/pipeline/pipeline-kanban";
import { CreditDashboard } from "@/components/pipeline/credit-dashboard";
import { QuoteForm } from "@/components/pipeline/quote-form";
import { StockDashboard } from "@/components/stock/stock-dashboard";
import { CustomerList } from "@/components/customers/customer-list";
import { CashSessionManager } from "@/components/cash/cash-session-manager";
import { AuditLogViewer } from "@/components/audit/audit-log-viewer";
import { DashboardAnalytics } from "@/components/dashboard/dashboard-analytics";
import { IntelligenceFeed } from "@/components/intelligence/intelligence-feed";
import { TrendChart } from "@/components/intelligence/trend-chart";
import { PermissionGuard, RoleBadge } from "@/components/auth/permission-guard";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductForm, type ProductFormData } from "@/components/products/product-form";
import {
  ShoppingBag,
  Package,
  Receipt,
  Settings,
  ChevronRight,
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowRight,
  Building2,
  FileText,
  CreditCard,
  Plus,
  Landmark,
  BarChart3,
  Shield,
  LogOut,
  Brain,
  Sparkles,
  Rocket,
} from "lucide-react";

// --- Page Views ---
type PageView = "landing" | "login" | "signup" | "app";

export default function Home() {
  const user = useAuthStore((s) => s.user);
  const authLoaded = useAuthStore((s) => s.isLoaded);
  const isOnboarded = useConfigStore((s) => s.isOnboarded);
  const configLoaded = useConfigStore((s) => s.isLoaded);

  // Page view state — starts at landing, changes via user actions or auto-login
  const [view, setView] = useState<PageView>("landing");

  // Success message displayed on the login screen after a successful signup
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Auto-redirect to app if already logged in (from localStorage hydration)
  // Use a ref to avoid re-running on every render
  const hasAutoRedirected = useState(false);
  if (
    !hasAutoRedirected[0] &&
    authLoaded &&
    configLoaded &&
    user &&
    isOnboarded &&
    view === "landing"
  ) {
    hasAutoRedirected[1](true);
    setView("app");
  }

  // CRITICAL: When user becomes null (logout), immediately switch back to landing
  // with NO transition delay. This ensures the app view unmounts instantly.
  // We compute the effective view synchronously (during render) AND mirror it
  // into state via useEffect so the change persists across re-renders.
  useEffect(() => {
    if (!user && view === "app") {
      setView("landing");
    }
  }, [user, view]);

  // Synchronous fallback — instant view switch with no intermediate render
  // that could show a "Redirection..." placeholder.
  const effectiveView: PageView =
    authLoaded && configLoaded && !user && view === "app" ? "landing" : view;

  const handleLoginSuccess = () => {
    setView("app");
  };

  const handleGoToLogin = () => {
    setSignupSuccess(null);
    setView("login");
  };

  const handleGoToSignup = () => {
    setSignupSuccess(null);
    setView("signup");
  };

  const handleBackToHome = () => {
    setSignupSuccess(null);
    setView("landing");
  };

  // Immediate logout: clear auth state + switch view synchronously.
  // No setTimeout, no async — avoids the 300ms exit transition delay from AnimatePresence.
  const handleLogout = () => {
    useAuthStore.getState().logout();
    setView("landing");
  };

  // Loading
  if (!authLoaded || !configLoaded) {
    return <LoadingScreen />;
  }

  return (
    <AnimatePresence mode="wait">
      {effectiveView === "landing" && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="min-h-screen flex flex-col bg-background"
        >
          <Navbar
            onLogin={handleGoToLogin}
            onSignup={handleGoToSignup}
          />
          <main className="flex-1">
            <Hero onSignup={handleGoToSignup} />
            <Features onSignup={handleGoToSignup} />
            <Benefits onSignup={handleGoToSignup} />
            <HowItWorks onSignup={handleGoToSignup} />
            <Statistics />
            <MoreBenefits onSignup={handleGoToSignup} />
            <GlobalTransfer onSignup={handleGoToSignup} />
            <Referral onSignup={handleGoToSignup} />
            <CompleteSolutions onSignup={handleGoToSignup} />
            <Testimonials />
            <BigStat />
            <Pricing onSignup={handleGoToSignup} />
            <FAQ />
            <FinalCTA onSignup={handleGoToSignup} />
          </main>
          <Footer />
          <ScrollToTop />
        </motion.div>
      )}

      {(effectiveView === "login" || effectiveView === "signup") && (
        <motion.div
          key={effectiveView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <LoginOrSignupView
            mode={effectiveView as "login" | "signup"}
            onLoginSuccess={handleLoginSuccess}
            onBackToHome={handleBackToHome}
            signupSuccess={signupSuccess}
            onSignupSuccess={(message) => {
              setSignupSuccess(message || null);
              setView("login");
            }}
          />
        </motion.div>
      )}

      {effectiveView === "app" && (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // No exit transition — when user logs out, the view is removed instantly
          transition={{ duration: 0.2 }}
        >
          <AppView
            onLogout={handleLogout}
            onBackToHome={handleBackToHome}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Login / Signup View ---
function LoginOrSignupView({
  mode,
  onLoginSuccess,
  onBackToHome,
  signupSuccess,
  onSignupSuccess,
}: {
  mode: "login" | "signup";
  onLoginSuccess: () => void;
  onBackToHome: () => void;
  signupSuccess?: string | null;
  onSignupSuccess: (message: string) => void;
}) {
  const isOnboarded = useConfigStore((s) => s.isOnboarded);
  const user = useAuthStore((s) => s.user);

  // After login, check onboarding
  if (user && !isOnboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" onBackToHome={onBackToHome} />
        <OnboardingWizard onComplete={onLoginSuccess} />
      </div>
    );
  }

  if (mode === "signup") {
    return (
      <SignupScreen
        onLoginSuccess={onLoginSuccess}
        onBackToHome={onBackToHome}
        onGotoLogin={onSignupSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          className="text-foreground/60 hover:text-foreground gap-1"
          onClick={onBackToHome}
        >
          ← Retour au site
        </Button>
      </div>
      <LoginScreen
        onLoginSuccess={onLoginSuccess}
        successMessage={signupSuccess ?? null}
      />
    </div>
  );
}

// --- Signup Screen ---
function SignupScreen({
  onLoginSuccess: _onLoginSuccess,
  onBackToHome,
  onGotoLogin,
}: {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
  onGotoLogin: (successMessage: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Step 2 fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmitStep1 = Boolean(name && email && businessName);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmitStep2 =
    Boolean(identifier) && password.length >= 6 && passwordsMatch;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStep1) return;
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStep2) {
      if (password.length > 0 && password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
      } else if (password.length > 0 && password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError("Veuillez remplir tous les champs.");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          businessName,
          identifier,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Redirect to login with success message — NO auto-login
        onGotoLogin("Compte créé ! Connectez-vous.");
      } else {
        setError(data.error ?? "Échec de la création du compte");
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-foreground/60 hover:text-foreground gap-1"
          onClick={() => (step === 2 ? setStep(1) : onBackToHome())}
        >
          ← {step === 2 ? "Retour" : "Retour"}
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yk-deep flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">YK</span>
          </div>
          <h1 className="text-2xl font-bold text-yk-deep">
            {step === 1 ? "Créer votre compte" : "Sécuriser votre compte"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1
              ? "14 jours d'essai gratuit — aucune carte requise"
              : "Choisissez un identifiant et un mot de passe"}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-1.5 w-12 rounded-full ${step === 1 ? "bg-yk-deep" : "bg-yk-deep/40"}`} />
          <div className={`h-1.5 w-12 rounded-full ${step === 2 ? "bg-yk-deep" : "bg-yk-deep/20"}`} />
        </div>

        <Card>
          <CardContent className="p-6">
            {step === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-name">Nom complet</label>
                  <input
                    id="signup-name"
                    type="text"
                    placeholder="Ibrahima Fall"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-email">Email</label>
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="ibrahima@yonukom.sn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-phone">Téléphone (optionnel)</label>
                  <input
                    id="signup-phone"
                    type="tel"
                    placeholder="+221 77 123 45 67"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-biz">Nom du commerce</label>
                  <input
                    id="signup-biz"
                    type="text"
                    placeholder="Boutique YonuKom"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-yk-deep hover:bg-yk-deep-light text-white font-medium gap-2"
                  disabled={!canSubmitStep1}
                >
                  Continuer
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-identifier">Identifiant</label>
                  <input
                    id="signup-identifier"
                    type="text"
                    placeholder="ibrahima.fall"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                    autoComplete="username"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Utilisé pour vous connecter avec votre email.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-password">Mot de passe</label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 pr-10 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Masquer" : "Afficher"}
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium" htmlFor="signup-confirm">Confirmer le mot de passe</label>
                  <input
                    id="signup-confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 ${
                      confirmPassword && !passwordsMatch
                        ? "border-destructive focus:ring-destructive"
                        : "border-input focus:ring-ring"
                    }`}
                    required
                    autoComplete="new-password"
                  />
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-[10px] text-destructive">
                      Les mots de passe ne correspondent pas.
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-yk-deep hover:bg-yk-deep-light text-white font-medium gap-2"
                  disabled={loading || !canSubmitStep2}
                >
                  {loading ? "Création du compte..." : "Créer mon compte"}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-foreground/40 mt-4">
          Déjà un compte ?{" "}
          <button
            type="button"
            className="text-yk-deep hover:underline font-medium"
            onClick={() => onGotoLogin("")}
          >
            Se connecter
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// --- App View (Dashboard) ---
function AppView({
  onLogout,
  onBackToHome,
}: {
  onLogout: () => void;
  onBackToHome: () => void;
}) {
  useOnlineStatus();
  const user = useAuthStore((s) => s.user);
  const isOnboarded = useConfigStore((s) => s.isOnboarded);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirection...</p>
      </div>
    );
  }

  // Superadmin always skips onboarding
  if (user.role === "superadmin") {
    return <SuperadminDashboard />;
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" onBackToHome={onBackToHome} />
        {/* Après submit(), useConfigStore.saveConfig() passe isOnboarded=true
            et AppView re-render automatiquement vers DashboardMain.
            onComplete est fourni pour le cas où l'utilisateur re-cliquerait
            sur "Accéder à mon espace" sans que le re-render n'ait eu lieu. */}
        <OnboardingWizard />
      </div>
    );
  }

  // Regular user → Main Dashboard (avec écran de bienvenue si pas de produits)
  return <DashboardWithWelcome onLogout={onLogout} />;
}

// --- DashboardWithWelcome ---
// Affiche un écran de bienvenue (getting started) si le business n'a aucun
// produit. Une fois un produit ajouté OU le welcome ignoré, on bascule sur
// le DashboardMain normal.
function DashboardWithWelcome({ onLogout }: { onLogout: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const businessId = user?.businessId;

  const fetchCount = useCallback(async () => {
    if (!businessId) {
      setProductCount(null);
      return;
    }
    try {
      const res = await fetch(`/api/products?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = (await res.json()) as { total?: number; products?: unknown[] };
        setProductCount(data.total ?? (data.products?.length ?? 0));
      } else {
        setProductCount(null);
      }
    } catch {
      setProductCount(null);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  const handleCreateProduct = async (data: ProductFormData) => {
    if (!businessId) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, businessId }),
      });
      if (res.ok) {
        // Rafraîchir le compteur → va basculer vers le dashboard normal
        await fetchCount();
        setFormOpen(false);
      }
    } catch {
      // silently fail
    }
  };

  // Tant qu'on ne connaît pas le nombre de produits, on montre un loader simple
  if (productCount === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  // Écran de bienvenue : business sans aucun produit + non ignoré
  if (productCount === 0 && !welcomeDismissed) {
    return (
      <AppShell activeTab="home" onTabChange={() => { /* pas de navigation pendant l'onboarding */ }}>
        <div className="px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-3xl bg-yk-emerald/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-yk-emerald" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">
                Bienvenue {user?.name?.split(" ")[0] || ""} ! 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                Commençons par ajouter votre premier produit pour pouvoir
                encaisser votre première vente.
              </p>
            </div>

            <Card className="border-yk-emerald/20 bg-yk-emerald/5">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yk-emerald/10 text-yk-emerald shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Ajouter un produit</p>
                    <p className="text-xs text-muted-foreground">
                      Nom, prix, stock — en 30 secondes.
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => setFormOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un produit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground"
                  onClick={() => setWelcomeDismissed(true)}
                >
                  Passer pour l&apos;instant
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Rocket className="w-3.5 h-3.5" />
              <span>Vous pourrez aussi ajouter des produits plus tard.</span>
            </div>
          </motion.div>
        </div>

        <ProductForm
          key="welcome-new"
          open={formOpen}
          onOpenChange={setFormOpen}
          onSave={handleCreateProduct}
        />
      </AppShell>
    );
  }

  return <DashboardMain onLogout={onLogout} />;
}

// --- Main Dashboard with tabs ---
function DashboardMain({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "home" && <HomeTab onTabChange={setActiveTab} onLogout={onLogout} />}
      {activeTab === "pos" && <PosScreen />}
      {activeTab === "stock" && <StockTab />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "pipeline" && <PipelineTab />}
      {activeTab === "settings" && <SettingsTab onLogout={onLogout} />}
    </AppShell>
  );
}

// --- Home Tab ---
function HomeTab({ onTabChange, onLogout }: { onTabChange: (tab: TabId) => void; onLogout: () => void }) {
  const isB2B = useConfigStore((s) => s.config?.pipeline_b2b ?? false);
  const user = useAuthStore((s) => s.user);
  const [activeView, setActiveView] = useState<"dashboard" | "analytics" | "intelligence">("dashboard");

  const stats = [
    { label: "Ventes aujourd'hui", value: "185 000 FCFA", accent: "text-yk-emerald", icon: TrendingUp },
    { label: isB2B ? "Devis" : "Commandes", value: isB2B ? "8" : "12", accent: "text-yk-deep", icon: isB2B ? FileText : Receipt },
    { label: "Produits", value: "25", accent: "text-yk-deep-light", icon: Package },
    { label: "Clients", value: isB2B ? "6 B2B" : "6", accent: "text-yk-amber", icon: Users },
  ];

  const quickActions = [
    { label: "Nouvelle vente", desc: "Caisse rapide", icon: ShoppingBag, color: "bg-yk-emerald/10 text-yk-emerald", tab: "pos" as TabId },
    { label: "Voir le stock", desc: "Produits & inventaire", icon: Package, color: "bg-primary/10 text-primary", tab: "stock" as TabId },
    ...(isB2B
      ? [
          { label: "Pipeline B2B", desc: "Devis & factures", icon: Building2, color: "bg-primary/10 text-primary", tab: "pipeline" as TabId },
          { label: "Crédit clients", desc: "Impayés & limites", icon: CreditCard, color: "bg-yk-amber/10 text-yk-amber", tab: "pipeline" as TabId },
        ]
      : [
          { label: "Commandes", desc: "Kanban e-commerce", icon: Receipt, color: "bg-yk-amber/10 text-yk-amber", tab: "orders" as TabId },
          { label: "Clients", desc: "Gestion clients", icon: Users, color: "bg-yk-emerald/10 text-yk-emerald", tab: "settings" as TabId },
        ]),
  ];

  return (
    <div className="px-4 py-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bienvenue {user?.name?.split(" ")[0] || ""} 👋</h1>
            <p className="text-muted-foreground text-sm">Votre espace YonuKom est prêt.</p>
          </div>
          <div className="flex items-center gap-2"><RoleBadge /></div>
        </div>
      </motion.div>

      <div className="flex gap-2">
        <Button variant={activeView === "dashboard" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveView("dashboard")}>Tableau de bord</Button>
        <Button variant={activeView === "analytics" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveView("analytics")}><BarChart3 className="w-3.5 h-3.5" />Analyses</Button>
        <Button variant={activeView === "intelligence" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveView("intelligence")}><Brain className="w-3.5 h-3.5" />IA Locale</Button>
      </div>

      {activeView === "intelligence" ? (
        <div className="space-y-4"><IntelligenceFeed /><TrendChart /></div>
      ) : activeView === "analytics" ? (
        <DashboardAnalytics />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 relative">
                      {/* Subtle accent stripe at top */}
                      <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent.replace("text-", "bg-")}/80`} />
                      <div className="flex items-center justify-between mb-2 pt-1">
                        <div className={`p-1.5 rounded-md bg-muted`}>
                          <Icon className={`w-4 h-4 ${stat.accent}`} />
                        </div>
                      </div>
                      <p className={`text-xl font-bold ${stat.accent}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-3">
            <h2 className="font-semibold text-lg">Actions rapides</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onTabChange(action.tab)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${action.color}`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-xs">{action.label}</h3>
                          <p className="text-[10px] text-muted-foreground">{action.desc}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="border-yk-amber/30 bg-yk-amber/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yk-amber shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yk-amber">1 produit en rupture</p>
                  <p className="text-xs text-muted-foreground">Savon 500g est en rupture de stock</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 text-xs" onClick={() => onTabChange("stock")}>Voir<ArrowRight className="w-3 h-3 ml-1" /></Button>
              </CardContent>
            </Card>
          </motion.div>

          <PermissionGuard permission="canCloseCashSession" fallback={null}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-yk-emerald/20" onClick={() => onTabChange("settings")}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yk-emerald/10 text-yk-emerald"><Landmark className="w-5 h-5" /></div>
                  <div className="flex-1 min-w-0"><h3 className="font-semibold text-xs">Caisse</h3><p className="text-[10px] text-muted-foreground">Ouvrir / clôturer la caisse</p></div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </motion.div>
          </PermissionGuard>
        </>
      )}
    </div>
  );
}

function StockTab() {
  return <div className="px-4 py-6 space-y-4"><ConnectivityBanner /><StockDashboard /></div>;
}

function OrdersTab() {
  return <div className="px-4 py-6 space-y-4"><ConnectivityBanner /><OrderKanban /></div>;
}

function PipelineTab() {
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [activeView, setActiveView] = useState<"pipeline" | "credit">("pipeline");

  return (
    <div className="px-4 py-6 space-y-4">
      <ConnectivityBanner />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" />Pipeline B2B</h2>
          <Button size="sm" className="gap-1.5" onClick={() => setShowQuoteForm(true)}><Plus className="w-4 h-4" />Nouveau devis</Button>
        </div>
        <div className="flex gap-2 mb-3">
          <Button variant={activeView === "pipeline" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveView("pipeline")}><FileText className="w-3.5 h-3.5" />Pipeline</Button>
          <Button variant={activeView === "credit" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveView("credit")}><CreditCard className="w-3.5 h-3.5" />Crédit</Button>
        </div>
      </motion.div>
      {activeView === "pipeline" ? <PipelineKanban /> : <CreditDashboard />}
      <QuoteForm open={showQuoteForm} onOpenChange={setShowQuoteForm} onSuccess={() => setShowQuoteForm(false)} />
    </div>
  );
}

function SettingsTab({ onLogout }: { onLogout: () => void }) {
  const isB2B = useConfigStore((s) => s.config?.pipeline_b2b ?? false);
  const user = useAuthStore((s) => s.user);
  const [activeSection, setActiveSection] = useState<"main" | "cash" | "audit">("main");

  return (
    <div className="px-4 py-6 space-y-4">
      <ConnectivityBanner />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-primary" />Paramètres</h2>
          <RoleBadge />
        </div>
        {user && (
          <Card className="mb-3">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-primary font-bold text-sm">{user.name?.charAt(0).toUpperCase()}</span></div>
              <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{user.name}</p><p className="text-[10px] text-muted-foreground truncate">{user.email}</p></div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1 text-xs shrink-0" onClick={onLogout}><LogOut className="w-3.5 h-3.5" />Déconnexion</Button>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-2 mb-3">
          <Button variant={activeSection === "main" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setActiveSection("main")}>Clients</Button>
          <PermissionGuard permission="canCloseCashSession" fallback={null}>
            <Button variant={activeSection === "cash" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveSection("cash")}><Landmark className="w-3.5 h-3.5" />Caisse</Button>
          </PermissionGuard>
          <PermissionGuard permission="canViewAuditLog" fallback={null}>
            <Button variant={activeSection === "audit" ? "default" : "outline"} size="sm" className="text-xs gap-1" onClick={() => setActiveSection("audit")}><Shield className="w-3.5 h-3.5" />Audit</Button>
          </PermissionGuard>
        </div>
      </motion.div>
      {activeSection === "main" && (<>{<CustomerList />}{isB2B && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4"><div className="flex items-center gap-2 mb-3"><CreditCard className="w-5 h-5 text-primary" /><h3 className="font-semibold">Crédit B2B</h3></div><CreditDashboard /></motion.div>)}</>)}
      {activeSection === "cash" && (<PermissionGuard permission="canCloseCashSession" showLocked lockedMessage="Seul le Gérant ou Patron peut gérer la caisse."><CashSessionManager /></PermissionGuard>)}
      {activeSection === "audit" && (<PermissionGuard permission="canViewAuditLog" showLocked lockedMessage="Seul le Gérant ou Patron peut voir le journal d'audit."><AuditLogViewer /></PermissionGuard>)}
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto animate-pulse">
          <span className="text-primary-foreground font-bold">YK</span>
        </div>
        <p className="text-sm text-muted-foreground">Chargement de YonuKom...</p>
      </motion.div>
    </div>
  );
}
