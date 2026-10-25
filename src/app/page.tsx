// ============================================================
// YonuKom — Main Page (Client-Side Router)
// Flow: Landing → Login → Dashboard (role-based)
// Superadmin → SuperadminDashboard
// Regular user → Full POS/ERP Dashboard
// ============================================================

"use client";

import { useState, useEffect } from "react";
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
import { OfflineDemo } from "@/components/landing/OfflineDemo";
import { Security } from "@/components/landing/Security";
import { Testimonials } from "@/components/landing/Testimonials";
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
    setView("login");
  };

  const handleGoToSignup = () => {
    setView("signup");
  };

  const handleBackToHome = () => {
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
            <OfflineDemo />
            <Security />
            <Testimonials />
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
}: {
  mode: "login" | "signup";
  onLoginSuccess: () => void;
  onBackToHome: () => void;
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
    return <SignupScreen onLoginSuccess={onLoginSuccess} onBackToHome={onBackToHome} />;
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
      <LoginScreen onLoginSuccess={onLoginSuccess} />
    </div>
  );
}

// --- Signup Screen ---
function SignupScreen({
  onLoginSuccess,
  onBackToHome,
}: {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !businessName) return;
    setLoading(true);

    // Create trial account
    setTimeout(() => {
      login({
        id: `trial-${Date.now()}`,
        email,
        name,
        phone,
        role: "patron",
        businessId: `biz-${Date.now()}`,
        businessName,
      });
      onLoginSuccess();
      setLoading(false);
    }, 800);
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
          onClick={onBackToHome}
        >
          ← Retour
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-yk-deep flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">YK</span>
          </div>
          <h1 className="text-2xl font-bold text-yk-deep">Créer votre compte</h1>
          <p className="text-sm text-muted-foreground mt-1">
            14 jours d&apos;essai gratuit — aucune carte requise
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={loading || !name || !email || !businessName}
              >
                {loading ? "Création..." : "Commencer mon essai gratuit"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-foreground/40 mt-4">
          Déjà un compte ?{" "}
          <button
            type="button"
            className="text-yk-deep hover:underline font-medium"
            onClick={onBackToHome}
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

  // Regular user → Main Dashboard
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
