// ============================================================
// YonuKom — Superadmin Dashboard
// Dashboard complet pour le propriétaire de la plateforme YonuKom
// Navigation par sidebar avec 5 sections + impersonation
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  CreditCard,
  Settings,
  ScrollText,
  TrendingUp,
  Users,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSuperadminStore } from "@/stores/use-superadmin-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { MetricsCards } from "@/components/superadmin/metrics-cards";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import { RevenueChart } from "@/components/superadmin/revenue-chart";
import { TenantDetailPanel } from "@/components/superadmin/tenant-detail-panel";
import { ImpersonationBanner } from "@/components/superadmin/impersonation-banner";
import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";
import type { SuperadminPage, TenantInfo, SubscriptionPlan, SubscriptionStatus } from "@/types";
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLAN_PRICES,
  SUBSCRIPTION_STATUS_LABELS,
  TENANT_TYPE_LABELS,
} from "@/types";

// --- Sidebar Navigation Items ---
const NAV_ITEMS: { page: SuperadminPage; icon: typeof BarChart3; label: string }[] = [
  { page: "overview", icon: BarChart3, label: "Vue d'ensemble" },
  { page: "tenants", icon: Building2, label: "Tenants" },
  { page: "subscriptions", icon: CreditCard, label: "Abonnements" },
  { page: "analytics", icon: TrendingUp, label: "Analytics" },
  { page: "logs", icon: ScrollText, label: "Logs" },
  { page: "settings", icon: Settings, label: "Paramètres" },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SuperadminDashboard() {
  const activePage = useSuperadminStore((s) => s.activePage);
  const setActivePage = useSuperadminStore((s) => s.setActivePage);
  const impersonation = useSuperadminStore((s) => s.impersonation);
  const endImpersonation = useSuperadminStore((s) => s.endImpersonation);
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchMetrics();
    fetchTenants();
  }, []);

  const fetchMetrics = useCallback(async () => {
    useSuperadminStore.getState().setMetricsLoading(true);
    try {
      const res = await fetch("/api/superadmin/analytics");
      if (res.ok) {
        const data = await res.json();
        useSuperadminStore.getState().setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      useSuperadminStore.getState().setMetricsLoading(false);
    }
  }, []);

  const fetchTenants = useCallback(async () => {
    useSuperadminStore.getState().setTenantsLoading(true);
    try {
      const res = await fetch("/api/superadmin/tenants");
      if (res.ok) {
        const data = await res.json();
        useSuperadminStore.getState().setTenants(data);
      }
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
    } finally {
      useSuperadminStore.getState().setTenantsLoading(false);
    }
  }, []);

  const handleViewTenant = useCallback((id: string) => {
    useSuperadminStore.getState().setSelectedTenantId(id);
  }, []);

  const handleImpersonate = useCallback(async (tenantId: string, tenantName: string) => {
    try {
      const res = await fetch("/api/superadmin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      if (res.ok) {
        useSuperadminStore.getState().startImpersonation(tenantId, tenantName);
      }
    } catch (err) {
      console.error("Failed to start impersonation:", err);
    }
  }, []);

  const selectedTenantId = useSuperadminStore((s) => s.selectedTenantId);
  const tenants = useSuperadminStore((s) => s.tenants);
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Impersonation Banner */}
      {impersonation.isImpersonating && impersonation.tenantName && (
        <ImpersonationBanner
          tenantName={impersonation.tenantName}
          onEndImpersonation={endImpersonation}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
          <SidebarContent
            activePage={activePage}
            onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
            onLogout={logout}
          />
        </aside>

        {/* Sidebar - Mobile (overlay) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-card border-r lg:hidden"
              >
                <SidebarContent
                  activePage={activePage}
                  onNavigate={(page) => { setActivePage(page); setSidebarOpen(false); }}
                  onLogout={logout}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Top bar (mobile) */}
          <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-card">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
              <BarChart3 className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">YK</span>
              </div>
              <span className="font-semibold text-sm">Superadmin</span>
            </div>
            <Badge variant="outline" className="text-xs border-yk-emerald/50 text-yk-emerald">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activePage === "overview" && (
                  <OverviewPage
                    onViewTenant={handleViewTenant}
                    onImpersonate={handleImpersonate}
                    onRefresh={fetchMetrics}
                  />
                )}
                {activePage === "tenants" && (
                  <TenantsPage
                    onViewTenant={handleViewTenant}
                    onImpersonate={handleImpersonate}
                    onRefresh={fetchTenants}
                  />
                )}
                {activePage === "subscriptions" && <SubscriptionsPage />}
                {activePage === "analytics" && <AnalyticsPage onRefresh={fetchMetrics} />}
                {activePage === "logs" && <LogsPage />}
                {activePage === "settings" && <SettingsPage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Tenant Detail Panel */}
      <TenantDetailPanel
        tenant={selectedTenant}
        open={!!selectedTenantId}
        onOpenChange={(open) => {
          if (!open) useSuperadminStore.getState().setSelectedTenantId(null);
        }}
        onImpersonate={handleImpersonate}
      />
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

function SidebarContent({
  activePage,
  onNavigate,
  onLogout,
}: {
  activePage: SuperadminPage;
  onNavigate: (page: SuperadminPage) => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
          <span className="text-primary-foreground font-bold text-lg">YK</span>
        </div>
        <div>
          <p className="font-bold text-sm">YonuKom</p>
          <p className="text-[10px] text-muted-foreground">Superadmin</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="space-y-1 flex-1">
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activePage === page
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </button>
        ))}
      </nav>

      <Separator className="my-4" />

      {/* Admin badge + logout */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3">
          <Shield className="w-4 h-4 text-yk-emerald" />
          <span className="text-xs text-muted-foreground">Superadmin</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4.5 h-4.5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PAGE: OVERVIEW
// ============================================================

function OverviewPage({
  onViewTenant,
  onImpersonate,
  onRefresh,
}: {
  onViewTenant: (id: string) => void;
  onImpersonate: (tenantId: string, tenantName: string) => void;
  onRefresh: () => void;
}) {
  const metrics = useSuperadminStore((s) => s.metrics);
  const metricsLoading = useSuperadminStore((s) => s.metricsLoading);
  const tenants = useSuperadminStore((s) => s.tenants);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vue d&apos;ensemble</h1>
          <p className="text-muted-foreground text-sm">Pilotage de la plateforme YonuKom</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={metricsLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${metricsLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Metrics Cards */}
      <MetricsCards
        metrics={metrics ? {
          totalTenants: metrics.totalTenants,
          mrr: metrics.mrr,
          activationRate: metrics.activationRate,
          pastDueCount: metrics.pastDueCount,
        } : null}
      />

      {/* Revenue Chart */}
      {metrics?.revenueByMonth && metrics.revenueByMonth.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Évolution du MRR (12 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={metrics.revenueByMonth} />
          </CardContent>
        </Card>
      )}

      {/* Recent Tenants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Derniers commerces inscrits
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => useSuperadminStore.getState().setActivePage("tenants")}
            >
              Voir tout
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <TenantTable
            tenants={tenants.slice(0, 5)}
            onViewTenant={onViewTenant}
            onImpersonate={onImpersonate}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PAGE: TENANTS
// ============================================================

function TenantsPage({
  onViewTenant,
  onImpersonate,
  onRefresh,
}: {
  onViewTenant: (id: string) => void;
  onImpersonate: (tenantId: string, tenantName: string) => void;
  onRefresh: () => void;
}) {
  const tenants = useSuperadminStore((s) => s.tenants);
  const tenantsLoading = useSuperadminStore((s) => s.tenantsLoading);
  const tenantSearch = useSuperadminStore((s) => s.tenantSearch);
  const setTenantSearch = useSuperadminStore((s) => s.setTenantSearch);

  const filteredTenants = tenants.filter((t) => {
    if (!tenantSearch) return true;
    const q = tenantSearch.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-muted-foreground text-sm">{tenants.length} commerces inscrits</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={tenantsLoading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${tenantsLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau tenant
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, propriétaire ou email..."
          value={tenantSearch}
          onChange={(e) => setTenantSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <TenantTable
        tenants={filteredTenants}
        onViewTenant={onViewTenant}
        onImpersonate={onImpersonate}
      />
    </div>
  );
}

// ============================================================
// PAGE: SUBSCRIPTIONS
// ============================================================

function SubscriptionsPage() {
  const [subs, setSubs] = useState<Array<{
    id: string;
    plan: string;
    status: string;
    amount: number;
    paymentMethod?: string;
    nextBillingDate?: string;
    tenant: { id: string; name: string; ownerName: string; ownerEmail: string };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = statusFilter !== "all"
          ? `/api/superadmin/subscriptions?status=${statusFilter}`
          : "/api/superadmin/subscriptions";
        const res = await fetch(url);
        if (res.ok) setSubs(await res.json());
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Abonnements</h1>
          <p className="text-muted-foreground text-sm">Gestion des abonnements tenants</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">🟢 Actifs</SelectItem>
            <SelectItem value="past_due">🟠 En retard</SelectItem>
            <SelectItem value="expired">🔴 Expirés</SelectItem>
            <SelectItem value="cancelled">⚫ Annulés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun abonnement trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{sub.tenant.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.tenant.ownerEmail}</p>
                    </div>
                    <SubscriptionStatusBadge status={sub.status as SubscriptionStatus} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {SUBSCRIPTION_PLAN_LABELS[sub.plan as SubscriptionPlan] ?? sub.plan}
                    </Badge>
                    <span className="font-bold text-sm">{formatFCFAShort(sub.amount)}</span>
                  </div>
                  {sub.nextBillingDate && (
                    <p className="text-xs text-muted-foreground">
                      Prochaine facturation : {new Date(sub.nextBillingDate).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE: ANALYTICS
// ============================================================

function AnalyticsPage({ onRefresh }: { onRefresh: () => void }) {
  const metrics = useSuperadminStore((s) => s.metrics);
  const metricsLoading = useSuperadminStore((s) => s.metricsLoading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground text-sm">Métriques globales de la plateforme</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={metricsLoading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${metricsLoading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={CircleDollarSign}
          title="MRR"
          value={metrics ? formatFCFAShort(metrics.mrr) : "—"}
          subtitle="Revenu récurrent mensuel"
          color="emerald"
        />
        <MetricCard
          icon={Activity}
          title="Activation"
          value={metrics ? `${metrics.activationRate}%` : "—"}
          subtitle="Taux d'activation"
          color="emerald"
        />
        <MetricCard
          icon={AlertTriangle}
          title="Churn"
          value={metrics ? `${metrics.churnRate}%` : "—"}
          subtitle="Taux de désabonnement"
          color="amber"
        />
        <MetricCard
          icon={Users}
          title="Tenants actifs"
          value={metrics ? String(metrics.activeTenants) : "—"}
          subtitle={`Sur ${metrics?.totalTenants ?? 0} inscrits`}
          color="emerald"
        />
      </div>

      {/* Revenue Chart */}
      {metrics?.revenueByMonth && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              MRR — 12 derniers mois
            </CardTitle>
            <CardDescription>Évolution du revenu récurrent mensuel</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={metrics.revenueByMonth} />
          </CardContent>
        </Card>
      )}

      {/* Subscription Breakdown */}
      {metrics?.subscriptionBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition des abonnements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["starter", "pro", "enterprise"] as SubscriptionPlan[]).map((plan) => (
                <div key={plan} className="text-center space-y-1">
                  <p className="text-3xl font-bold">
                    {metrics.subscriptionBreakdown[plan]}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {SUBSCRIPTION_PLAN_LABELS[plan]}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatFCFA(SUBSCRIPTION_PLAN_PRICES[plan])}/mois
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// PAGE: LOGS
// ============================================================

function LogsPage() {
  const platformLogs = useSuperadminStore((s) => s.platformLogs);
  const setPlatformLogs = useSuperadminStore((s) => s.setPlatformLogs);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url = levelFilter !== "all"
          ? `/api/superadmin/logs?level=${levelFilter}`
          : "/api/superadmin/logs";
        const res = await fetch(url);
        if (res.ok) setPlatformLogs(await res.json());
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [levelFilter, setPlatformLogs]);

  const levelColors: Record<string, string> = {
    info: "text-blue-500",
    warning: "text-amber-500",
    error: "text-red-500",
    critical: "text-red-700 font-bold",
  };

  const levelBg: Record<string, string> = {
    info: "bg-blue-50",
    warning: "bg-amber-50",
    error: "bg-red-50",
    critical: "bg-red-100",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Logs plateforme</h1>
          <p className="text-muted-foreground text-sm">Journal des événements globaux</p>
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : platformLogs.length === 0 ? (
        <div className="text-center py-12">
          <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun log trouvé</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
          {platformLogs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${levelBg[log.level] ?? "bg-card"}`}
            >
              <Badge variant="outline" className={`text-[9px] shrink-0 ${levelColors[log.level] ?? ""}`}>
                {log.level.toUpperCase()}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="secondary" className="text-[9px]">{log.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm truncate">{log.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE: SETTINGS
// ============================================================

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte Superadmin</CardTitle>
          <CardDescription>Informations du compte administrateur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{user?.name ?? "Superadmin"}</p>
              <p className="text-sm text-muted-foreground">{user?.email ?? "admin@yonukom.sn"}</p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-2">
            <Badge className="bg-yk-emerald/10 text-yk-emerald border-yk-emerald/20">
              <Shield className="w-3 h-3 mr-1" />
              Superadmin
            </Badge>
            <span className="text-xs text-muted-foreground">Accès complet à la plateforme</span>
          </div>
          <Button variant="destructive" size="sm" onClick={logout} className="gap-1.5">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration plateforme</CardTitle>
          <CardDescription>Paramètres globaux de YonuKom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Devise par défaut</span>
            <Badge variant="outline">FCFA (XOF)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Région</span>
            <Badge variant="outline">Sénégal (SN)</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Mode</span>
            <Badge variant="outline" className="border-yk-emerald/30 text-yk-emerald">Production</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// HELPER: Metric Card
// ============================================================

function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: typeof CircleDollarSign;
  title: string;
  value: string;
  subtitle: string;
  color: "emerald" | "amber";
}) {
  const colors = {
    emerald: { icon: "text-emerald-600", bg: "bg-emerald-50" },
    amber: { icon: "text-amber-600", bg: "bg-amber-50" },
  };
  const c = colors[color];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <div className={`p-1.5 rounded-md ${c.bg}`}>
            <Icon className={`w-3.5 h-3.5 ${c.icon}`} />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
