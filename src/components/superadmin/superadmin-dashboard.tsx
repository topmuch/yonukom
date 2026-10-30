// ============================================================
// YonuKom — Superadmin Dashboard (V2)
// Pages: Overview / Tenants / Users / Subscriptions / Analytics / Messages / Logs / Settings
// Theme-aware (dark mode fixed), notifications badge, settings SEO/Email sections,
// subscription actions (suspend/deactivate/activate/delete), bulk user delete,
// tenant detail dialog with quick actions.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  ScrollText,
  Puzzle,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  ChevronRight,
  LogOut,
  Shield,
  Activity,
  AlertTriangle,
  CircleDollarSign,
  Loader2,
  Users,
  Mail,
  X,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Home as HomeIcon,
  Eye,
  EyeOff,
  UserPlus,
  Phone,
  Trash2,
  Pause,
  Play,
  Ban,
  CheckSquare,
  Square,
  Save,
  Globe,
  Server,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSuperadminStore } from "@/stores/use-superadmin-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import { TenantDetailPanel } from "@/components/superadmin/tenant-detail-panel";
import { SuperadminModulesPage } from "@/components/superadmin/superadmin-modules-page";
import { ImpersonationBanner } from "@/components/superadmin/impersonation-banner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";
import type {
  SuperadminPage,
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionBillingPeriod,
  PlatformSettingData,
} from "@/types";
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLAN_PRICES,
  SUBSCRIPTION_PLAN_ANNUAL_PRICES,
  SUBSCRIPTION_BILLING_PERIOD_LABELS,
  TENANT_TYPE_LABELS,
} from "@/types";

// --- Sidebar Navigation Items ---
const NAV_ITEMS: { page: SuperadminPage; icon: typeof BarChart3; label: string }[] = [
  { page: "overview", icon: HomeIcon, label: "Vue d'ensemble" },
  { page: "tenants", icon: Building2, label: "Tenants" },
  { page: "users", icon: Users, label: "Utilisateurs" },
  { page: "subscriptions", icon: CreditCard, label: "Abonnements" },
  { page: "analytics", icon: TrendingUp, label: "Analytics" },
  { page: "messages", icon: Mail, label: "Messages" },
  { page: "logs", icon: ScrollText, label: "Logs" },
  { page: "modules", icon: Puzzle, label: "Modules" },
  { page: "settings", icon: SettingsIcon, label: "Paramètres" },
];

/**
 * Helper : fetch authentifié pour le superadmin dashboard.
 * Ajoute automatiquement le token JWT depuis localStorage + credentials.
 * Tous les appels API du superadmin doivent utiliser cette fonction.
 */
function saFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("yonukom_token");
    const headers = new Headers(options.headers || {});
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    options.headers = headers;
    options.credentials = "include";
  }
  return fetch(url, options);
}

// Blue accent color used in SVG charts (kept for charts; UI uses theme tokens)
const BLUE = "#338BE2";
const BLUE_DARK = "#2074C6";
const BLUE_LIGHT = "#5BA5EA";
const LAVENDER = "#B7BEDA";
const EMERALD = "#10B981";
const AMBER = "#F59E0B";
const ROSE = "#F43F5E";
const SLATE = "#1E293B";

// ============================================================
// MAIN COMPONENT
// ============================================================

export function SuperadminDashboard() {
  const activePage = useSuperadminStore((s) => s.activePage);
  const setActivePage = useSuperadminStore((s) => s.setActivePage);
  const impersonation = useSuperadminStore((s) => s.impersonation);
  const endImpersonation = useSuperadminStore((s) => s.endImpersonation);
  const tenantSearch = useSuperadminStore((s) => s.tenantSearch);
  const setTenantSearch = useSuperadminStore((s) => s.setTenantSearch);
  const logout = useAuthStore((s) => s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  // Fetch initial data
  const fetchMetrics = useCallback(async () => {
    useSuperadminStore.getState().setMetricsLoading(true);
    try {
      const res = await saFetch("/api/superadmin/analytics");
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
      const res = await saFetch("/api/superadmin/tenants");
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

  // Fetch notification count (new tenants in last 24h + new messages + new users in last 24h)
  const fetchNotifCount = useCallback(async () => {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [tenantsRes, messagesRes, usersRes] = await Promise.all([
        fetch(`/api/superadmin/tenants?sortBy=createdAt&since=${encodeURIComponent(since)}`),
        fetch("/api/superadmin/messages?status=new"),
        fetch("/api/superadmin/users"),
      ]);
      let count = 0;
      if (tenantsRes.ok) {
        const tenants = await tenantsRes.json();
        count += Array.isArray(tenants)
          ? tenants.filter((t: { createdAt?: string }) =>
              t.createdAt ? new Date(t.createdAt) > new Date(since) : false
            ).length
          : 0;
      }
      if (messagesRes.ok) {
        const data = await messagesRes.json();
        count += data?.counts?.new ?? 0;
      }
      if (usersRes.ok) {
        const users = await usersRes.json();
        count += Array.isArray(users)
          ? users.filter((u: { createdAt?: string }) =>
              u.createdAt ? new Date(u.createdAt) > new Date(since) : false
            ).length
          : 0;
      }
      setNotifCount(count);
    } catch (err) {
      console.error("Failed to fetch notification count:", err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchTenants();
    fetchNotifCount();
  }, [fetchMetrics, fetchTenants, fetchNotifCount]);

  const handleViewTenant = useCallback((id: string) => {
    useSuperadminStore.getState().setSelectedTenantId(id);
  }, []);

  const handleImpersonate = useCallback(
    async (tenantId: string, tenantName: string) => {
      try {
        const res = await saFetch("/api/superadmin/impersonate", {
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
    },
    [],
  );

  const selectedTenantId = useSuperadminStore((s) => s.selectedTenantId);
  const tenants = useSuperadminStore((s) => s.tenants);
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FE] dark:bg-background">
      {/* Impersonation Banner */}
      {impersonation.isImpersonating && impersonation.tenantName && (
        <ImpersonationBanner
          tenantName={impersonation.tenantName}
          onEndImpersonation={endImpersonation}
        />
      )}

      <div className="flex flex-1">
        {/* Sidebar - Desktop (BLUE gradient, full height) */}
        <aside className="hidden lg:flex w-64 flex-col fixed left-0 top-0 bottom-0 bg-gradient-to-b from-[#338BE2] to-[#2074C6] text-white shadow-[8px_0_24px_-12px_rgba(51,139,226,0.4)] z-40">
          <SidebarContent
            activePage={activePage}
            onNavigate={(page) => {
              setActivePage(page);
              setSidebarOpen(false);
            }}
            onLogout={logout}
            notifCount={notifCount}
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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-gradient-to-b from-[#338BE2] to-[#2074C6] text-white shadow-2xl lg:hidden"
              >
                <SidebarContent
                  activePage={activePage}
                  onNavigate={(page) => {
                    setActivePage(page);
                    setSidebarOpen(false);
                  }}
                  onLogout={logout}
                  notifCount={notifCount}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content — pushed right by sidebar */}
        <main className="flex-1 min-w-0 flex flex-col lg:ml-64">
          {/* Top bar — BLUE with search */}
          <header className="hidden lg:flex sticky top-0 z-30 bg-gradient-to-r from-[#338BE2] to-[#2074C6] text-white items-center justify-between px-6 py-3 shadow-md">
            {/* Left: page title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
                {(() => {
                  const Item = NAV_ITEMS.find((n) => n.page === activePage)?.icon ?? BarChart3;
                  return <Item className="w-4.5 h-4.5 text-white" />;
                })()}
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                  Superadmin
                </p>
                <p className="text-sm font-bold text-white leading-tight">
                  {NAV_ITEMS.find((n) => n.page === activePage)?.label ?? "Vue d'ensemble"}
                </p>
              </div>
            </div>

            {/* Center: search bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  placeholder="Rechercher un tenant, email..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 rounded-xl bg-white/15 backdrop-blur border border-white/20 placeholder:text-white/60 text-white text-sm focus:outline-none focus:bg-white/25 focus:border-white/40 transition-colors"
                />
                {tenantSearch && (
                  <button
                    onClick={() => setTenantSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    aria-label="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: admin badge + actions */}
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur hover:bg-white/25 flex items-center justify-center relative transition-colors"
                aria-label="Notifications"
                onClick={() => setActivePage("overview")}
              >
                <Bell className="w-4 h-4 text-white" />
                {notifCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-300 text-[#2074C6] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#338BE2]">
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </button>
              <Badge className="bg-white/15 text-white border border-white/20 backdrop-blur">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
              <div className="[&_button]:text-white [&_button:hover]:bg-white/15">
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Top bar (mobile) */}
          <header className="lg:hidden sticky top-0 z-30 bg-gradient-to-r from-[#338BE2] to-[#2074C6] text-white flex items-center justify-between px-4 py-3 shadow-md">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-[#338BE2] font-bold text-xs">YK</span>
              </div>
              <span className="font-semibold text-sm">Superadmin</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="[&_button]:text-white [&_button:hover]:bg-white/15">
                <ThemeToggle />
              </div>
              <Badge className="text-xs bg-white/15 text-white border border-white/20">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 p-4 lg:p-6">
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
                {activePage === "users" && <UsersPage />}
                {activePage === "subscriptions" && <SubscriptionsPage />}
                {activePage === "analytics" && <AnalyticsPage onRefresh={fetchMetrics} />}
                {activePage === "messages" && <MessagesPage />}
                {activePage === "logs" && <LogsPage />}
                {activePage === "settings" && <SettingsPage />}
                {activePage === "modules" && <SuperadminModulesPage />}
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
        onRefresh={fetchTenants}
      />
    </div>
  );
}

// ============================================================
// SIDEBAR — blue gradient, white text/icons, notif badge on Messages
// ============================================================

function SidebarContent({
  activePage,
  onNavigate,
  onLogout,
  notifCount,
}: {
  activePage: SuperadminPage;
  onNavigate: (page: SuperadminPage) => void;
  onLogout: () => void;
  notifCount?: number;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-white/15">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
          <span className="text-[#338BE2] font-bold text-base">YK</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm text-white">YonuKom</p>
          <p className="text-[10px] text-white/70 truncate">Superadmin</p>
        </div>
        <button
          onClick={onLogout}
          className="lg:hidden ml-auto text-white/70 hover:text-white"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
          Menu principal
        </p>
        {NAV_ITEMS.map(({ page, icon: Icon, label }) => {
          const isActive = activePage === page;
          const showBadge = (page === "messages" || page === "overview") && notifCount && notifCount > 0;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-[#338BE2] shadow-md"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              <Icon
                className="w-5 h-5 shrink-0"
                strokeWidth={isActive ? 2.4 : 1.8}
              />
              <span className="flex-1 text-left">{label}</span>
              {showBadge && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-300 text-[#2074C6] text-[10px] font-bold flex items-center justify-center">
                  {notifCount! > 99 ? "99+" : notifCount}
                </span>
              )}
              {isActive && !showBadge && (
                <motion.span
                  layoutId="sa-sidebar-dot"
                  className="w-1.5 h-1.5 rounded-full bg-[#338BE2]"
                />
              )}
            </button>
          );
        })}
      </nav>

      <Separator className="my-2 bg-white/15" />

      {/* Admin badge + logout */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/10">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">Superadmin</p>
            <p className="text-[10px] text-white/60">Accès complet</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white bg-white/5 hover:bg-white/15 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

// ============================================================
// SVG CHARTS — all self-contained (no external deps)
// ============================================================

function CircularProgressRing({
  value,
  size = 70,
  stroke = 6,
  color = BLUE,
  trackColor = "rgba(51,139,226,0.12)",
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-base font-bold leading-none"
            style={{ color }}
          >
            {label}
          </span>
          {sublabel && (
            <span className="text-[9px] text-muted-foreground mt-0.5">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

function GaugeMeter({
  value,
  size = 120,
  stroke = 10,
  color = BLUE,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 10 }}>
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        <path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="rgba(51,139,226,0.12)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {label && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="text-lg font-bold" style={{ color }}>
            {label}
          </span>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

function AreaChart({ height = 220 }: { height?: number }) {
  const data = [40, 55, 45, 70, 65, 85, 75, 95, 88, 110, 105, 125];
  const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
  const max = Math.max(...data) * 1.1;
  const w = 600;
  const h = height;
  const pad = 20;
  const stepX = (w - pad * 2) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });

  const pathD = (() => {
    if (points.length === 0) return "";
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  })();

  const areaD = `${pathD} L ${points[points.length - 1][0]} ${h - pad} L ${points[0][0]} ${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.5" />
          <stop offset="50%" stopColor={BLUE_LIGHT} stopOpacity="0.2" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={BLUE_LIGHT} />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={pad}
          x2={w - pad}
          y1={h - pad - p * (h - pad * 2)}
          y2={h - pad - p * (h - pad * 2)}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
      ))}

      <motion.path
        d={areaD}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      <motion.path
        d={pathD}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={3.5}
          fill="white"
          stroke={BLUE}
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}

      {months.map((m, i) => (
        <text
          key={i}
          x={pad + i * stepX}
          y={h - 5}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: "10px" }}
        >
          {m}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({
  segments,
  size = 180,
  stroke = 24,
  centerLabel,
  centerSub,
  centerDelta,
}: {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerSub?: string;
  centerDelta?: string;
}) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const circumference = 2 * Math.PI * radius;

  // Compute cumulative offsets in a pure way (no outer mutation, lint-friendly).
  // First pass: build cumulative fractions array. Second pass: derive arc data.
  const fractions = segments.map((s) => s.value / total);
  const cumulativeFractions: number[] = [];
  for (let k = 0; k < fractions.length; k++) {
    const prev = k > 0 ? cumulativeFractions[k - 1] : 0;
    cumulativeFractions.push(prev + fractions[k]);
  }
  const arcs = segments.map((seg, i) => {
    const fraction = fractions[i];
    const dashLen = fraction * circumference;
    const prevCumulative = i > 0 ? cumulativeFractions[i - 1] : 0;
    const dashOffset = -prevCumulative * circumference;
    return { ...seg, dashLen, dashOffset, i };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(51,139,226,0.06)"
          strokeWidth={stroke}
        />
        {arcs.map((arc) => (
          <motion.circle
            key={arc.i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: arc.dashOffset }}
            transition={{ duration: 1, delay: 0.2 + arc.i * 0.15, ease: "easeOut" }}
          />
        ))}
      </svg>
      {centerLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{centerLabel}</span>
          {centerSub && (
            <span className="text-xs text-muted-foreground mt-0.5">{centerSub}</span>
          )}
          {centerDelta && (
            <span className="text-xs font-semibold text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" />
              {centerDelta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BarChart({ height = 200 }: { height?: number }) {
  const data = [
    { year: "2014", value: 45 },
    { year: "2015", value: 60 },
    { year: "2016", value: 75 },
    { year: "2017", value: 55 },
    { year: "2018", value: 85 },
    { year: "2019", value: 95 },
    { year: "2020", value: 100 },
  ];
  const max = Math.max(...data.map((d) => d.value)) * 1.1;
  const w = 700;
  const h = height;
  const pad = 30;
  const stepX = (w - pad * 2) / data.length;
  const barWidth = stepX * 0.55;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={BLUE_DARK} />
        </linearGradient>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={pad}
          x2={w - pad}
          y1={h - pad - p * (h - pad * 2)}
          y2={h - pad - p * (h - pad * 2)}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-muted-foreground"
        />
      ))}

      {data.map((d, i) => {
        const barH = (d.value / max) * (h - pad * 2);
        const x = pad + i * stepX + (stepX - barWidth) / 2;
        const y = h - pad - barH;
        return (
          <g key={d.year}>
            <motion.rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={6}
              fill="url(#barGrad)"
              initial={{ height: 0, y: h - pad }}
              animate={{ height: barH, y }}
              transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
            />
            <motion.text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "10px", fontWeight: 600 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              {d.value}
            </motion.text>
            <text
              x={x + barWidth / 2}
              y={h - 10}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: "11px" }}
            >
              {d.year}
            </text>
          </g>
        );
      })}
    </svg>
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

  // Notifications récentes
  const [recentTenants, setRecentTenants] = useState<Array<{ id: string; name: string; ownerName: string; createdAt: string }>>([]);
  const [recentMessages, setRecentMessages] = useState<Array<{ id: string; name: string; email: string; createdAt: string }>>([]);
  const [recentUsers, setRecentUsers] = useState<Array<{ id: string; name: string; email: string; createdAt: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const [tenantsRes, messagesRes, usersRes] = await Promise.all([
          fetch("/api/superadmin/tenants"),
          fetch("/api/superadmin/messages?status=new"),
          fetch("/api/superadmin/users"),
        ]);
        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          const sorted = (data as any[])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((t) => ({ id: t.id, name: t.name, ownerName: t.ownerName, createdAt: t.createdAt }));
          setRecentTenants(sorted);
        }
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const msgs = (data.messages as any[]).slice(0, 5).map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            createdAt: m.createdAt,
          }));
          setRecentMessages(msgs);
        }
        if (usersRes.ok) {
          const data = await usersRes.json();
          const sorted = (data as any[])
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((u) => ({ id: u.id, name: u.name, email: u.email, createdAt: u.createdAt }));
          setRecentUsers(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    })();
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vue d&apos;ensemble</h1>
          <p className="text-muted-foreground text-sm">
            Pilotage de la plateforme YonuKom
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={metricsLoading}
          className="bg-background border-border hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${metricsLoading ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>

      {/* ROW 1: 5 stat cards with SVG rings + gauge */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCardRing
          title="Total Tenants"
          value={metrics ? String(metrics.totalTenants) : "—"}
          progress={metrics ? Math.min(100, metrics.totalTenants) : 0}
          color={BLUE}
          icon={Building2}
          delta="+12%"
          deltaUp
        />
        <StatCardRing
          title="MRR"
          value={metrics ? formatFCFAShort(metrics.mrr) : "—"}
          progress={metrics ? Math.min(100, (metrics.mrr / 500000) * 100) : 0}
          color={EMERALD}
          icon={CircleDollarSign}
          delta="+8%"
          deltaUp
        />
        <StatCardRing
          title="Activation"
          value={metrics ? `${metrics.activationRate}%` : "—"}
          progress={metrics ? metrics.activationRate : 0}
          color={AMBER}
          icon={Activity}
          delta="+3%"
          deltaUp
        />
        <StatCardRing
          title="En retard"
          value={metrics ? String(metrics.pastDueCount) : "—"}
          progress={metrics ? Math.min(100, metrics.pastDueCount * 10) : 0}
          color={ROSE}
          icon={AlertTriangle}
          delta="-2"
          deltaUp={false}
        />
        <Card className="bg-background border border-border hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow">
          <CardContent className="p-5 flex flex-col items-center">
            <div className="flex items-center gap-2 self-start mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#338BE2]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#338BE2]" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Santé plateforme</p>
            </div>
            <GaugeMeter
              value={metrics ? Math.min(100, 100 - metrics.churnRate * 2) : 75}
              color={BLUE}
              label={metrics ? `${Math.min(100, 100 - metrics.churnRate * 2)}%` : "75%"}
              sublabel="Global"
            />
          </CardContent>
        </Card>
      </div>

      {/* MIDDLE: area chart + donut + table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    Statistic Graph
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Évolution mensuelle du revenu
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all-categories">
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-border">
                      <SelectValue placeholder="Toutes catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-categories">Toutes catégories</SelectItem>
                      <SelectItem value="tenants">Tenants</SelectItem>
                      <SelectItem value="subscriptions">Abonnements</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-stats">
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-muted/50 border-border">
                      <SelectValue placeholder="Toutes stats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-stats">Toutes stats</SelectItem>
                      <SelectItem value="mrr">MRR</SelectItem>
                      <SelectItem value="revenue">Revenu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AreaChart height={220} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniDataCard value="1.650" label="Total Distance" color={BLUE} icon={TrendingUp} />
            <MiniDataCard value="650" label="Total Distance" color={EMERALD} icon={Activity} />
            <MiniDataCard value="1.100" label="Total Distance" color={AMBER} icon={CircleDollarSign} />
            <MiniDataCard value="490" label="Total Distance" color={LAVENDER} icon={Users} />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Répartition
              </CardTitle>
              <p className="text-xs text-muted-foreground">Plans d&apos;abonnement</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-4">
              <DonutChart
                segments={[
                  { value: 60, color: BLUE, label: "Starter" },
                  { value: 25, color: EMERALD, label: "Pro" },
                  { value: 15, color: LAVENDER, label: "Enterprise" },
                ]}
                centerLabel={metrics ? String(metrics.totalTenants * 12) : "4900"}
                centerSub="Total"
                centerDelta="+1.100%"
              />
              <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-border">
                {[
                  { color: BLUE, label: "Starter", value: "60%" },
                  { color: EMERALD, label: "Pro", value: "25%" },
                  { color: LAVENDER, label: "Enterprise", value: "15%" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <span
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ background: item.color }}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Top produits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wider text-[10px]">
                        Produit
                      </th>
                      <th className="text-right font-semibold text-muted-foreground px-2 py-2.5 uppercase tracking-wider text-[10px]">
                        Qté
                      </th>
                      <th className="text-right font-semibold text-muted-foreground px-2 py-2.5 uppercase tracking-wider text-[10px]">
                        Prix
                      </th>
                      <th className="text-right font-semibold text-muted-foreground px-4 py-2.5 uppercase tracking-wider text-[10px]">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "ITEM 01", qty: 12, price: 1500, total: 18000 },
                      { name: "ITEM 02", qty: 8, price: 2500, total: 20000 },
                      { name: "ITEM 03", qty: 15, price: 800, total: 12000 },
                      { name: "ITEM 04", qty: 6, price: 3500, total: 21000 },
                    ].map((item, i) => (
                      <tr
                        key={i}
                        className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                              style={{
                                background: [BLUE, EMERALD, AMBER, LAVENDER][i],
                              }}
                            >
                              {i + 1}
                            </div>
                            <span className="font-medium text-foreground">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">
                          {item.qty}
                        </td>
                        <td className="px-2 py-2.5 text-right text-muted-foreground">
                          {item.price.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-foreground">
                          {item.total.toLocaleString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* BOTTOM: bar chart */}
      <Card className="bg-background border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Croissance annuelle
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Évolution 2014 — 2020
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: BLUE }}
                />
                <span className="text-muted-foreground">Revenus (M CFA)</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart height={200} />
        </CardContent>
      </Card>

      {/* Notifications récentes */}
      <Card className="bg-background border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#338BE2]" />
              Notifications récentes
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* New tenants */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              Nouveaux Tenants (5)
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {recentTenants.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aucun</p>
              ) : (
                recentTenants.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onViewTenant(t.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{t.ownerName}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {fmtDate(t.createdAt)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* New contact messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Mail className="w-3.5 h-3.5" />
              Messages non lus
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {recentMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aucun</p>
              ) : (
                recentMessages.map((m) => (
                  <div key={m.id} className="p-2 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {fmtDate(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* New users */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <UserPlus className="w-3.5 h-3.5" />
              Nouveaux Utilisateurs (5)
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {recentUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Aucun</p>
              ) : (
                recentUsers.map((u) => (
                  <div key={u.id} className="p-2 rounded-lg bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {fmtDate(u.createdAt)}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Tenants */}
      <Card className="bg-background border border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#338BE2]" />
              Derniers commerces inscrits
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1 hover:bg-[#338BE2]/5 hover:text-[#338BE2]"
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

function StatCardRing({
  title,
  value,
  progress,
  color,
  icon: Icon,
  delta,
  deltaUp,
}: {
  title: string;
  value: string;
  progress: number;
  color: string;
  icon: React.ElementType;
  delta?: string;
  deltaUp?: boolean;
}) {
  return (
    <Card className="bg-background border border-border hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {delta && (
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                  deltaUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {deltaUp ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {delta}
              </span>
            )}
          </div>
          <CircularProgressRing
            value={progress}
            color={color}
            trackColor={`${color}1a`}
            size={56}
            stroke={5}
            label={`${Math.round(progress)}%`}
          />
        </div>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${color}1a` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniDataCard({
  value,
  label,
  color,
  icon: Icon,
}: {
  value: string;
  label: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Card
      className="bg-background border border-border hover:shadow-md transition-shadow overflow-hidden relative"
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: color }}
      />
      <CardContent className="p-4 pt-5">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}1a` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
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

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    businessType: "restaurant" as "restaurant" | "boutique" | "service" | "autre",
  });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone: "",
      businessType: "restaurant",
    });
    setCreateError(null);
  };

  const handleCreate = async () => {
    if (!form.name || !form.ownerName || !form.ownerEmail || !form.ownerPhone) {
      setCreateError("Tous les champs sont obligatoires.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await saFetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Échec de la création du tenant");
      }
      setCreateOpen(false);
      resetForm();
      onRefresh();
      toast.success("Tenant créé avec succès");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground text-sm">
            {tenants.length} commerces inscrits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={tenantsLoading}
            className="bg-background border-border hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${tenantsLoading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
            className="bg-[#338BE2] hover:bg-[#2074C6] text-white shadow-md shadow-[#338BE2]/25"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau tenant
          </Button>
        </div>
      </div>

      <div className="relative max-w-md lg:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, propriétaire ou email..."
          value={tenantSearch}
          onChange={(e) => setTenantSearch(e.target.value)}
          className="pl-9 bg-background border-border"
        />
      </div>

      <Card className="bg-background border border-border">
        <CardContent className="p-4 sm:p-6">
          <TenantTable
            tenants={filteredTenants}
            onViewTenant={onViewTenant}
            onImpersonate={onImpersonate}
          />
        </CardContent>
      </Card>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Créer un nouveau tenant
            </DialogTitle>
            <DialogDescription>
              Ajoutez un commerce à la plateforme. Un abonnement « Starter »
              actif de 30 jours sera créé automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tenant-name">Nom du commerce</Label>
              <Input
                id="tenant-name"
                placeholder="Boutique Fatou"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-owner">Nom du propriétaire</Label>
              <Input
                id="tenant-owner"
                placeholder="Fatou Diallo"
                value={form.ownerName}
                onChange={(e) => setField("ownerName", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tenant-email">Email</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  placeholder="fatou@boutique.sn"
                  value={form.ownerEmail}
                  onChange={(e) => setField("ownerEmail", e.target.value)}
                  disabled={creating}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tenant-phone">Téléphone</Label>
                <Input
                  id="tenant-phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={form.ownerPhone}
                  onChange={(e) => setField("ownerPhone", e.target.value)}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tenant-type">Type de commerce</Label>
              <Select
                value={form.businessType}
                onValueChange={(val) =>
                  setField("businessType", val as typeof form.businessType)
                }
                disabled={creating}
              >
                <SelectTrigger id="tenant-type" className="w-full">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="boutique">Boutique</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating ||
                !form.name ||
                !form.ownerName ||
                !form.ownerEmail ||
                !form.ownerPhone
              }
              className="bg-[#338BE2] hover:bg-[#2074C6] text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Créer le tenant
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// PAGE: SUBSCRIPTIONS — with actions + plan pricing
// ============================================================

interface AdminSubscriptionRow {
  id: string;
  plan: string;
  status: string;
  amount: number;
  billingPeriod?: string;
  paymentMethod?: string | null;
  nextBillingDate?: string | null;
  currentPeriodEnd?: string;
  tenant: { id: string; name: string; ownerName: string; ownerEmail: string };
}

const PLAN_PRICING_INFO: Array<{
  plan: SubscriptionPlan;
  monthly: number;
  annual: number;
  features: string[];
}> = [
  {
    plan: "starter",
    monthly: SUBSCRIPTION_PLAN_PRICES.starter,
    annual: SUBSCRIPTION_PLAN_ANNUAL_PRICES.starter,
    features: ["1 commerce", "Jusqu'à 2 utilisateurs", "POS de base", "Support email"],
  },
  {
    plan: "pro",
    monthly: SUBSCRIPTION_PLAN_PRICES.pro,
    annual: SUBSCRIPTION_PLAN_ANNUAL_PRICES.pro,
    features: ["3 commerces", "Jusqu'à 10 utilisateurs", "Stats avancées", "Support prioritaire"],
  },
  {
    plan: "enterprise",
    monthly: SUBSCRIPTION_PLAN_PRICES.enterprise,
    annual: SUBSCRIPTION_PLAN_ANNUAL_PRICES.enterprise,
    features: ["Commerces illimités", "Utilisateurs illimités", "API + Webhooks", "Support dédié"],
  },
];

function SubscriptionsPage() {
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [editAmountId, setEditAmountId] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState("");
  const [editPlanId, setEditPlanId] = useState<string | null>(null);
  const [editPlanValue, setEditPlanValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ tenantId: "", plan: "starter", amount: "5000", billingPeriod: "monthly" });

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter !== "all"
          ? `/api/superadmin/subscriptions?status=${statusFilter}`
          : "/api/superadmin/subscriptions";
      const res = await saFetch(url);
      if (res.ok) setSubs(await res.json());
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const updateSubStatus = async (id: string, status: string, label: string) => {
    setActionLoadingId(id);
    try {
      const res = await saFetch(`/api/superadmin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success(`Abonnement ${label} avec succès`);
      await fetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveAmount = async (id: string) => {
    const amount = parseInt(editAmountValue.replace(/\D/g, ""), 10);
    if (Number.isNaN(amount) || amount < 0) {
      toast.error("Montant invalide");
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await saFetch(`/api/superadmin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Montant mis à jour");
      setEditAmountId(null);
      await fetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSavePlan = async (id: string) => {
    if (!editPlanValue || !["starter", "pro", "enterprise"].includes(editPlanValue)) {
      toast.error("Plan invalide");
      return;
    }
    setActionLoadingId(id);
    try {
      const res = await saFetch(`/api/superadmin/subscriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: editPlanValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Plan mis à jour");
      setEditPlanId(null);
      await fetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateSub = async () => {
    if (!createForm.tenantId) {
      toast.error("Sélectionnez un tenant");
      return;
    }
    setActionLoadingId("create");
    try {
      const res = await saFetch(`/api/superadmin/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: createForm.tenantId,
          plan: createForm.plan,
          amount: parseInt(createForm.amount) || 5000,
          billingPeriod: createForm.billingPeriod,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Abonnement créé");
      setCreateOpen(false);
      setCreateForm({ tenantId: "", plan: "starter", amount: "5000", billingPeriod: "monthly" });
      await fetchSubs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoadingId(deleteId);
    try {
      const res = await saFetch(`/api/superadmin/subscriptions/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Tenant + abonnement supprimés");
      setDeleteId(null);
      await fetchSubs();
      // Also refresh tenants list
      useSuperadminStore.getState().setTenantsLoading(true);
      try {
        const tRes = await saFetch("/api/superadmin/tenants");
        if (tRes.ok) useSuperadminStore.getState().setTenants(await tRes.json());
      } finally {
        useSuperadminStore.getState().setTenantsLoading(false);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abonnements</h1>
          <p className="text-muted-foreground text-sm">
            Gestion des abonnements tenants
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background border-border">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="suspended">Suspendus</SelectItem>
              <SelectItem value="past_due">En retard</SelectItem>
              <SelectItem value="expired">Expirés</SelectItem>
              <SelectItem value="cancelled">Annulés</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Dialog: Créer un abonnement */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel abonnement</DialogTitle>
            <DialogDescription>Créez un abonnement pour un tenant existant.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tenant ID</Label>
              <Input
                value={createForm.tenantId}
                onChange={(e) => setCreateForm({ ...createForm, tenantId: e.target.value })}
                placeholder="cmv..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plan</Label>
                <Select
                  value={createForm.plan}
                  onValueChange={(v) => setCreateForm({ ...createForm, plan: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Période</Label>
                <Select
                  value={createForm.billingPeriod}
                  onValueChange={(v) => setCreateForm({ ...createForm, billingPeriod: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="annual">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Montant (FCFA)</Label>
              <Input
                type="number"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                placeholder="5000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={handleCreateSub} disabled={actionLoadingId === "create"}>
              {actionLoadingId === "create" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Créer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan pricing cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLAN_PRICING_INFO.map((info) => {
          const price = billingPeriod === "monthly" ? info.monthly : info.annual;
          const isHighlight = info.plan === "pro";
          return (
            <Card
              key={info.plan}
              className={`bg-background border ${
                isHighlight ? "border-[#338BE2] shadow-md" : "border-border"
              } relative overflow-hidden`}
            >
              {isHighlight && (
                <div className="absolute top-0 right-0 bg-[#338BE2] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                  POPULAIRE
                </div>
              )}
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {SUBSCRIPTION_PLAN_LABELS[info.plan]}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {billingPeriod === "annual" && (
                      <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[9px]">
                        -2 mois
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatFCFA(price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {billingPeriod === "monthly" ? "par mois" : "par an (10 mois)"}
                  </p>
                </div>
                <ul className="space-y-1 pt-1">
                  {info.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${billingPeriod === "monthly" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
          Mensuel
        </span>
        <Switch
          checked={billingPeriod === "annual"}
          onCheckedChange={(v) => setBillingPeriod(v ? "annual" : "monthly")}
        />
        <span className={`text-sm ${billingPeriod === "annual" ? "font-bold text-foreground" : "text-muted-foreground"}`}>
          Annuel
        </span>
        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px]">
          2 mois offerts
        </Badge>
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-background border border-border">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <Card className="bg-background border border-border">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun abonnement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((sub, i) => {
            const isLoadingThis = actionLoadingId === sub.id;
            const isEditingAmount = editAmountId === sub.id;
            const isEditingPlan = editPlanId === sub.id;
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-background border border-border hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {sub.tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.tenant.ownerEmail}
                        </p>
                      </div>
                      <SubscriptionStatusBadge
                        status={sub.status as SubscriptionStatus}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      {isEditingPlan ? (
                        <div className="flex items-center gap-1">
                          <Select
                            value={editPlanValue}
                            onValueChange={setEditPlanValue}
                          >
                            <SelectTrigger className="h-7 w-[120px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="starter">Starter</SelectItem>
                              <SelectItem value="pro">Pro</SelectItem>
                              <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSavePlan(sub.id)}
                            disabled={isLoadingThis}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => setEditPlanId(null)}
                            disabled={isLoadingThis}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditPlanId(sub.id);
                            setEditPlanValue(sub.plan);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                          title="Modifier le plan"
                        >
                          {SUBSCRIPTION_PLAN_LABELS[sub.plan as SubscriptionPlan] ?? sub.plan}
                        </button>
                      )}
                      {isEditingAmount ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editAmountValue}
                            onChange={(e) => setEditAmountValue(e.target.value)}
                            className="h-7 w-28 text-xs"
                            type="text"
                            inputMode="numeric"
                          />
                          <Button
                            size="sm"
                            className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleSaveAmount(sub.id)}
                            disabled={isLoadingThis}
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => setEditAmountId(null)}
                            disabled={isLoadingThis}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditAmountId(sub.id);
                            setEditAmountValue(String(sub.amount));
                          }}
                          className="font-bold text-sm text-foreground hover:bg-muted px-2 py-0.5 rounded transition-colors"
                          title="Modifier le montant"
                        >
                          {formatFCFAShort(sub.amount)}
                        </button>
                      )}
                    </div>
                    {sub.billingPeriod && (
                      <Badge variant="outline" className="text-[10px]">
                        {SUBSCRIPTION_BILLING_PERIOD_LABELS[sub.billingPeriod as SubscriptionBillingPeriod] ?? sub.billingPeriod}
                      </Badge>
                    )}
                    {sub.nextBillingDate && (
                      <p className="text-xs text-muted-foreground">
                        Prochaine facturation :{" "}
                        {new Date(sub.nextBillingDate).toLocaleDateString("fr-FR")}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sub.status !== "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => updateSubStatus(sub.id, "active", "activé")}
                          disabled={isLoadingThis}
                        >
                          <Play className="w-3 h-3" />
                          Activer
                        </Button>
                      )}
                      {sub.status !== "suspended" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                          onClick={() => updateSubStatus(sub.id, "suspended", "suspendu")}
                          disabled={isLoadingThis}
                        >
                          <Pause className="w-3 h-3" />
                          Suspendre
                        </Button>
                      )}
                      {sub.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] gap-1 border-rose-200 text-rose-700 hover:bg-rose-50"
                          onClick={() => updateSubStatus(sub.id, "cancelled", "désactivé")}
                          disabled={isLoadingThis}
                        >
                          <Ban className="w-3 h-3" />
                          Désactiver
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px] gap-1 text-rose-600 hover:bg-rose-50 ml-auto"
                        onClick={() => setDeleteId(sub.id)}
                        disabled={isLoadingThis}
                      >
                        {isLoadingThis ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Supprimer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera l&apos;abonnement, le tenant, ses utilisateurs et ses commerces.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Métriques globales de la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={metricsLoading}
          className="bg-background border-border hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${metricsLoading ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCardRing
          icon={CircleDollarSign}
          title="MRR"
          value={metrics ? formatFCFAShort(metrics.mrr) : "—"}
          progress={metrics ? Math.min(100, (metrics.mrr / 500000) * 100) : 0}
          color={BLUE}
          delta="+8%"
          deltaUp
        />
        <StatCardRing
          icon={Activity}
          title="Activation"
          value={metrics ? `${metrics.activationRate}%` : "—"}
          progress={metrics ? metrics.activationRate : 0}
          color={EMERALD}
          delta="+3%"
          deltaUp
        />
        <StatCardRing
          icon={AlertTriangle}
          title="Churn"
          value={metrics ? `${metrics.churnRate}%` : "—"}
          progress={metrics ? metrics.churnRate * 5 : 0}
          color={AMBER}
          delta="+1%"
          deltaUp={false}
        />
        <StatCardRing
          icon={Users}
          title="Tenants actifs"
          value={metrics ? String(metrics.activeTenants) : "—"}
          progress={
            metrics
              ? Math.min(100, (metrics.activeTenants / Math.max(1, metrics.totalTenants)) * 100)
              : 0
          }
          color={LAVENDER}
          delta="+5"
          deltaUp
        />
      </div>

      <Card className="bg-background border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#338BE2]" />
            MRR — 12 derniers mois
          </CardTitle>
          <CardDescription>Évolution du revenu récurrent mensuel</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart height={240} />
        </CardContent>
      </Card>

      {metrics?.subscriptionBreakdown && (
        <Card className="bg-background border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Répartition des abonnements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["starter", "pro", "enterprise"] as SubscriptionPlan[]).map((plan, i) => (
                <div
                  key={plan}
                  className="text-center space-y-2 p-4 rounded-xl border border-border"
                >
                  <div
                    className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center"
                    style={{
                      background: `${[BLUE, EMERALD, LAVENDER][i]}1a`,
                    }}
                  >
                    <CreditCard
                      className="w-5 h-5"
                      style={{ color: [BLUE, EMERALD, LAVENDER][i] }}
                    />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
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
        const url =
          levelFilter !== "all"
            ? `/api/superadmin/logs?level=${levelFilter}`
            : "/api/superadmin/logs";
        const res = await saFetch(url);
        if (res.ok) setPlatformLogs(await res.json());
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [levelFilter, setPlatformLogs]);

  const levelColors: Record<string, string> = {
    info: "text-[#338BE2]",
    warning: "text-amber-500",
    error: "text-rose-500",
    critical: "text-rose-700 font-bold",
  };

  const levelBg: Record<string, string> = {
    info: "bg-[#338BE2]/5",
    warning: "bg-amber-50 dark:bg-amber-950/30",
    error: "bg-rose-50 dark:bg-rose-950/30",
    critical: "bg-rose-100 dark:bg-rose-950/50",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logs plateforme</h1>
          <p className="text-muted-foreground text-sm">
            Journal des événements globaux
          </p>
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border">
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

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : platformLogs.length === 0 ? (
        <Card className="bg-background border border-border">
          <CardContent className="py-12 text-center">
            <ScrollText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun log trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-background border border-border">
          <CardContent className="p-0">
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar p-4">
              {platformLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border border-border ${
                    levelBg[log.level] ?? "bg-background"
                  }`}
                >
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${levelColors[log.level] ?? ""}`}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="secondary" className="text-[9px]">
                        {log.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground truncate">
                      {log.message}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// PAGE: USERS — with suspend / delete + select all + bulk delete
// ============================================================

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  isActive?: boolean;
  businessId?: string | null;
  tenantId?: string | null;
  createdAt?: string;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  superadmin: "bg-[#338BE2]/10 text-[#338BE2] border-[#338BE2]/20",
  patron: "bg-emerald-100 text-emerald-700 border-emerald-200",
  gerant: "bg-amber-100 text-amber-700 border-amber-200",
  vendeur: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-muted dark:text-muted-foreground",
};

const ROLE_LABELS_FR: Record<string, string> = {
  superadmin: "Superadmin",
  patron: "Patron",
  gerant: "Gérant",
  vendeur: "Vendeur",
  employee: "Employé",
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "patron" as string,
    password: "",
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({ name: "", email: "", phone: "", role: "patron", password: "" });
    setCreateError(null);
    setShowPassword(false);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        roleFilter !== "all"
          ? `/api/superadmin/users?role=${roleFilter}`
          : "/api/superadmin/users";
      const res = await saFetch(url);
      if (res.ok) {
        const data = (await res.json()) as AdminUserRow[];
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.role) {
      setCreateError("Tous les champs obligatoires doivent être remplis.");
      return;
    }
    if (form.password.length < 6) {
      setCreateError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await saFetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Échec de la création de l'utilisateur");
      }
      setCreateOpen(false);
      resetForm();
      await fetchUsers();
      toast.success("Utilisateur créé avec succès");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  };

  const toggleSuspend = async (u: AdminUserRow) => {
    setActionLoadingId(u.id);
    const newActive = !u.isActive;
    try {
      const res = await saFetch(`/api/superadmin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success(newActive ? "Utilisateur activé" : "Utilisateur suspendu");
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoadingId(deleteId);
    try {
      const res = await saFetch(`/api/superadmin/users/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Utilisateur supprimé");
      setDeleteId(null);
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(deleteId);
        return n;
      });
      await fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setActionLoadingId("bulk");
    let okCount = 0;
    let failCount = 0;
    for (const id of ids) {
      try {
        const res = await saFetch(`/api/superadmin/users/${id}`, { method: "DELETE" });
        if (res.ok) okCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    await fetchUsers();
    if (okCount > 0) toast.success(`${okCount} utilisateur(s) supprimé(s)`);
    if (failCount > 0) toast.error(`${failCount} suppression(s) échouée(s)`);
    setActionLoadingId(null);
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q)
    );
  });

  const visibleIds = useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of visibleIds) n.delete(id);
        return n;
      });
    } else {
      setSelectedIds((prev) => {
        const n = new Set(prev);
        for (const id of visibleIds) n.add(id);
        return n;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">
            {users.length} utilisateurs enregistrés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={loading}
            className="bg-background border-border hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
            className="bg-[#338BE2] hover:bg-[#2074C6] text-white shadow-md shadow-[#338BE2]/25"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background border-border"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="superadmin">Superadmin</SelectItem>
            <SelectItem value="patron">Patron</SelectItem>
            <SelectItem value="gerant">Gérant</SelectItem>
            <SelectItem value="vendeur">Vendeur</SelectItem>
            <SelectItem value="employee">Employé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected count + bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center gap-2 text-sm">
            <CheckSquare className="w-4 h-4 text-[#338BE2]" />
            <span className="font-medium text-foreground">
              {selectedIds.size} utilisateur(s) sélectionné(s)
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={actionLoadingId === "bulk"}
            className="gap-1.5"
          >
            {actionLoadingId === "bulk" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Supprimer la sélection
          </Button>
        </div>
      )}

      <Card className="bg-background border border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 w-10">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Sélectionner tout"
                      />
                    </th>
                    <th className="text-left font-semibold text-muted-foreground px-2 py-3 uppercase tracking-wider text-[10px]">
                      Nom
                    </th>
                    <th className="text-left font-semibold text-muted-foreground px-2 py-3 uppercase tracking-wider text-[10px]">
                      Email
                    </th>
                    <th className="text-left font-semibold text-muted-foreground px-2 py-3 uppercase tracking-wider text-[10px]">
                      Rôle
                    </th>
                    <th className="text-left font-semibold text-muted-foreground px-2 py-3 uppercase tracking-wider text-[10px]">
                      Statut
                    </th>
                    <th className="text-right font-semibold text-muted-foreground px-4 py-3 uppercase tracking-wider text-[10px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => {
                    const isActive = u.isActive ?? u.status === "active";
                    const isChecked = selectedIds.has(u.id);
                    const isLoadingThis = actionLoadingId === u.id;
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${
                          isChecked ? "bg-[#338BE2]/5" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleSelect(u.id)}
                            aria-label={`Sélectionner ${u.name}`}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#338BE2]/10 flex items-center justify-center text-[#338BE2] font-bold text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {u.name}
                              </p>
                              {u.phone && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                  <Phone className="w-2.5 h-2.5" />
                                  {u.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-muted-foreground/60" />
                            {u.email}
                          </span>
                        </td>
                        <td className="px-2 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${ROLE_BADGE_COLORS[u.role] ?? ""}`}
                          >
                            {ROLE_LABELS_FR[u.role] ?? u.role}
                          </Badge>
                        </td>
                        <td className="px-2 py-3">
                          {isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900">
                              <PauseCircle className="w-3 h-3 mr-1" />
                              Suspendu
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] gap-1 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/30"
                              onClick={() => toggleSuspend(u)}
                              disabled={isLoadingThis || u.role === "superadmin"}
                              title={isActive ? "Suspendre" : "Activer"}
                            >
                              {isLoadingThis ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isActive ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  Suspendre
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  Activer
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => setDeleteId(u.id)}
                              disabled={isLoadingThis || u.role === "superadmin"}
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Dialog : Nouvel utilisateur --- */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Créer un nouvel utilisateur
            </DialogTitle>
            <DialogDescription>
              Ajoutez un utilisateur à la plateforme. Le mot de passe sera
              chiffré avec bcrypt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Nom complet</Label>
              <Input
                id="user-name"
                placeholder="Ibrahima Fall"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                disabled={creating}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="ibrahima@yonukom.sn"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  disabled={creating}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-phone">Téléphone</Label>
                <Input
                  id="user-phone"
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-role">Rôle</Label>
              <Select
                value={form.role}
                onValueChange={(val) => setField("role", val)}
                disabled={creating}
              >
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Superadmin</SelectItem>
                  <SelectItem value="patron">Patron</SelectItem>
                  <SelectItem value="gerant">Gérant</SelectItem>
                  <SelectItem value="vendeur">Vendeur</SelectItem>
                  <SelectItem value="employee">Employé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="user-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  disabled={creating}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Minimum 6 caractères.
              </p>
            </div>

            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
              disabled={creating}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.name || !form.email || !form.password || !form.role}
              className="bg-[#338BE2] hover:bg-[#2074C6] text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Créer l&apos;utilisateur
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete single user */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;utilisateur perdra l&apos;accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedIds.size} utilisateur(s) ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement tous les utilisateurs sélectionnés.
              Les superadmins et les derniers patrons d&apos;un tenant seront ignorés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Supprimer la sélection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// PAGE: SETTINGS — SEO + Email + Compte + Plateforme
// ============================================================

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [settings, setSettings] = useState<PlatformSettingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (local)
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");

  const [googleAnalyticsId, setGoogleAnalyticsId] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await saFetch("/api/superadmin/settings");
        if (res.ok) {
          const data = (await res.json()) as PlatformSettingData;
          setSettings(data);
          setSeoTitle(data.seoTitle ?? "");
          setSeoDescription(data.seoDescription ?? "");
          setSeoKeywords(data.seoKeywords ?? "");
          setOgImageUrl(data.ogImageUrl ?? "");
          setSmtpHost(data.smtpHost ?? "");
          setSmtpPort(data.smtpPort ? String(data.smtpPort) : "");
          setSmtpUser(data.smtpUser ?? "");
          setSmtpPassword(data.smtpPassword ?? "");
          setSmtpFromEmail(data.smtpFromEmail ?? "");
          setSmtpFromName(data.smtpFromName ?? "");
          setGoogleAnalyticsId(data.googleAnalyticsId ?? "");
          setFacebookPixelId(data.facebookPixelId ?? "");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        seoTitle,
        seoDescription,
        seoKeywords,
        ogImageUrl,
        smtpHost,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null,
        smtpUser,
        smtpPassword,
        smtpFromEmail,
        smtpFromName,
        googleAnalyticsId,
        facebookPixelId,
      };
      const res = await saFetch("/api/superadmin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec de la sauvegarde");
      }
      const updated = (await res.json()) as PlatformSettingData;
      setSettings(updated);
      toast.success("Paramètres enregistrés avec succès");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground text-sm">
            Configuration de la plateforme YonuKom
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-[#338BE2] hover:bg-[#2074C6] text-white gap-1.5"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Enregistrer
        </Button>
      </div>

      {loading ? (
        <Card className="bg-background border border-border">
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#338BE2]" />
            <p className="text-sm text-muted-foreground mt-3">Chargement des paramètres...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* SEO Section */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#338BE2]" />
                SEO — Référencement
              </CardTitle>
              <CardDescription>
                Métadonnées SEO partagées sur tout le site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="seo-title">Titre SEO</Label>
                <Input
                  id="seo-title"
                  placeholder="YonuKom — Gestion commerciale pour l'Afrique"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Recommandé : 50-60 caractères. Actuel : {seoTitle.length}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-desc">Description SEO</Label>
                <Textarea
                  id="seo-desc"
                  placeholder="Gérez votre commerce au Sénégal : POS, stock, factures, paiements Wave..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-[10px] text-muted-foreground">
                  Recommandé : 150-160 caractères. Actuel : {seoDescription.length}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seo-keywords">Mots-clés SEO</Label>
                <Input
                  id="seo-keywords"
                  placeholder="POS Sénégal, gestion commerce, factures FCFA..."
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Séparés par des virgules
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="og-image">Image OpenGraph (URL)</Label>
                <Input
                  id="og-image"
                  placeholder="https://yonukom.sn/og-image.png"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                />
                {ogImageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border bg-muted/40 max-w-xs">
                    <img
                      src={ogImageUrl}
                      alt="Aperçu OpenGraph"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Email SMTP Section */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-[#338BE2]" />
                Email — Configuration SMTP
              </CardTitle>
              <CardDescription>
                Serveur d&apos;envoi d&apos;emails transactionnels (factures, rappels, notifications)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-host">Hôte SMTP</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-user">Utilisateur</Label>
                  <Input
                    id="smtp-user"
                    placeholder="user@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-pass">Mot de passe</Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    placeholder="••••••••"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-from-email">Email expéditeur</Label>
                  <Input
                    id="smtp-from-email"
                    type="email"
                    placeholder="noreply@yonukom.sn"
                    value={smtpFromEmail}
                    onChange={(e) => setSmtpFromEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="smtp-from-name">Nom expéditeur</Label>
                  <Input
                    id="smtp-from-name"
                    placeholder="YonuKom"
                    value={smtpFromName}
                    onChange={(e) => setSmtpFromName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics IDs */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#338BE2]" />
                Analytics & Tracking
              </CardTitle>
              <CardDescription>
                Identifiants de suivi marketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ga-id">Google Analytics ID</Label>
                  <Input
                    id="ga-id"
                    placeholder="G-XXXXXXXXXX"
                    value={googleAnalyticsId}
                    onChange={(e) => setGoogleAnalyticsId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fb-pixel">Facebook Pixel ID</Label>
                  <Input
                    id="fb-pixel"
                    placeholder="123456789012345"
                    value={facebookPixelId}
                    onChange={(e) => setFacebookPixelId(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compte Superadmin */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground">
                Compte Superadmin
              </CardTitle>
              <CardDescription>
                Informations du compte administrateur
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#338BE2]/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#338BE2]" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {user?.name ?? "Superadmin"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email ?? "admin@yonukom.sn"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2">
                <Badge className="bg-[#338BE2]/10 text-[#338BE2] border border-[#338BE2]/20">
                  <Shield className="w-3 h-3 mr-1" />
                  Superadmin
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Accès complet à la plateforme
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </CardContent>
          </Card>

          {/* Configuration plateforme */}
          <Card className="bg-background border border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold text-foreground">
                Configuration plateforme
              </CardTitle>
              <CardDescription>Paramètres globaux de YonuKom</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Devise par défaut</span>
                <Badge variant="outline" className="border-border">
                  FCFA (XOF)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Région</span>
                <Badge variant="outline" className="border-border">
                  Sénégal (SN)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Mode</span>
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                  Production
                </Badge>
              </div>
              {settings && (
                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                  Dernière mise à jour : {new Date(settings.updatedAt).toLocaleString("fr-FR")}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ============================================================
// MESSAGES PAGE
// ============================================================

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "read" | "archived";
  adminNote: string | null;
  createdAt: string;
}

function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({ new: 0, read: 0, archived: 0 });
  const [filter, setFilter] = useState<"all" | "new" | "read" | "archived">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ContactMessageItem | null>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await saFetch(`/api/superadmin/messages${qs}`);
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      setMessages(data.messages || []);
      setCounts(data.counts || { new: 0, read: 0, archived: 0 });
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (id: string, status: "new" | "read" | "archived") => {
    await saFetch(`/api/superadmin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchMessages();
    if (selected?.id === id) {
      setSelected((s) => (s ? { ...s, status } : s));
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Supprimer ce message définitivement ?")) return;
    await saFetch(`/api/superadmin/messages/${id}`, { method: "DELETE" });
    if (selected?.id === id) setSelected(null);
    fetchMessages();
  };

  const openMessage = (msg: ContactMessageItem) => {
    setSelected(msg);
    if (msg.status === "new") {
      updateStatus(msg.id, "read");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#338BE2]" />
            Messages de contact
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Messages reçus depuis le formulaire de la page /contact
          </p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Rafraîchir
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`text-left p-4 rounded-xl border transition-all ${
            filter === "all"
              ? "bg-[#338BE2]/5 border-[#338BE2]/30"
              : "bg-background border-border hover:border-[#338BE2]/30"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {(counts.new || 0) + (counts.read || 0) + (counts.archived || 0)}
          </p>
        </button>
        <button
          onClick={() => setFilter("new")}
          className={`text-left p-4 rounded-xl border transition-all ${
            filter === "new"
              ? "bg-[#338BE2]/5 border-[#338BE2]/30"
              : "bg-background border-border hover:border-[#338BE2]/30"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#338BE2]">Non lus</p>
          <p className="text-2xl font-bold text-[#338BE2] mt-1">{counts.new || 0}</p>
        </button>
        <button
          onClick={() => setFilter("read")}
          className={`text-left p-4 rounded-xl border transition-all ${
            filter === "read"
              ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900"
              : "bg-background border-border hover:border-emerald-300"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Lus</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{counts.read || 0}</p>
        </button>
        <button
          onClick={() => setFilter("archived")}
          className={`text-left p-4 rounded-xl border transition-all ${
            filter === "archived"
              ? "bg-muted border-border"
              : "bg-background border-border hover:border-[#338BE2]/30"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archivés</p>
          <p className="text-2xl font-bold text-foreground mt-1">{counts.archived || 0}</p>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-background rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
              {filter === "all" ? "Tous les messages" : filter === "new" ? "Non lus" : filter === "read" ? "Lus" : "Archivés"}
            </h3>
            <span className="text-xs text-muted-foreground">{messages.length}</span>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-muted-foreground mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground mt-2">Chargement...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">Aucun message pour ce filtre</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {messages.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => openMessage(m)}
                      className={`w-full text-left p-4 hover:bg-muted/60 transition-colors ${
                        selected?.id === m.id ? "bg-[#338BE2]/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          m.status === "new" ? "bg-[#338BE2] animate-pulse" : "bg-muted-foreground/40"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${
                              m.status === "new" ? "font-bold text-foreground" : "font-medium text-foreground"
                            }`}>
                              {m.name}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDate(m.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{m.email}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.message}</p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-background rounded-2xl border border-border overflow-hidden lg:sticky lg:top-4 h-fit">
          {selected ? (
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#338BE2] flex items-center justify-center text-white font-bold">
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{selected.name}</p>
                    <a href={`mailto:${selected.email}`} className="text-sm text-[#338BE2] hover:underline">
                      {selected.email}
                    </a>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-full ${
                  selected.status === "new" ? "bg-[#338BE2]/10 text-[#338BE2]" :
                  selected.status === "read" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {selected.status === "new" ? "Non lu" : selected.status === "read" ? "Lu" : "Archivé"}
                </span>
              </div>

              <div className="text-xs text-muted-foreground">
                Reçu le {formatDate(selected.createdAt)}
              </div>

              <div className="bg-muted/60 rounded-xl p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Message</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <a
                  href={`mailto:${selected.email}?subject=Re: Votre message à YonuKom&body=Bonjour ${encodeURIComponent(selected.name)},%0D%0A%0D%0AMerci pour votre message.%0D%0A%0D%0A`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#338BE2] hover:bg-[#2074C6] text-white text-xs font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Répondre par email
                </a>
                <button
                  onClick={() => updateStatus(selected.id, selected.status === "archived" ? "read" : "archived")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-muted text-xs font-semibold"
                >
                  {selected.status === "archived" ? "Désarchiver" : "Archiver"}
                </button>
                <button
                  onClick={() => deleteMessage(selected.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold ml-auto"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Mail className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">
                Sélectionnez un message pour voir le détail
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
