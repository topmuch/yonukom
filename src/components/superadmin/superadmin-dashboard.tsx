// ============================================================
// YonuKom — Superadmin Dashboard (Premium Blue — matches uploaded design)
// 6 pages: Overview / Tenants / Subscriptions / Analytics / Logs / Settings
// Blue sidebar + blue top bar with search + SVG charts (rings, gauge, area, donut, bars)
// Keeps: tab switching, tenant list, logout, theme toggle, impersonation, Nouveau tenant dialog
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Building2,
  CreditCard,
  Settings as SettingsIcon,
  ScrollText,
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
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { useSuperadminStore } from "@/stores/use-superadmin-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import { TenantDetailPanel } from "@/components/superadmin/tenant-detail-panel";
import { ImpersonationBanner } from "@/components/superadmin/impersonation-banner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";
import type { SuperadminPage, SubscriptionPlan, SubscriptionStatus } from "@/types";
import {
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_PLAN_PRICES,
  TENANT_TYPE_LABELS,
} from "@/types";

// --- Sidebar Navigation Items ---
const NAV_ITEMS: { page: SuperadminPage; icon: typeof BarChart3; label: string }[] = [
  { page: "overview", icon: HomeIcon, label: "Vue d'ensemble" },
  { page: "tenants", icon: Building2, label: "Tenants" },
  { page: "subscriptions", icon: CreditCard, label: "Abonnements" },
  { page: "analytics", icon: TrendingUp, label: "Analytics" },
  { page: "logs", icon: ScrollText, label: "Logs" },
  { page: "settings", icon: SettingsIcon, label: "Paramètres" },
];

// Blue accent color used in all SVG charts
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

  // Fetch initial data
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

  useEffect(() => {
    fetchMetrics();
    fetchTenants();
  }, [fetchMetrics, fetchTenants]);

  const handleViewTenant = useCallback((id: string) => {
    useSuperadminStore.getState().setSelectedTenantId(id);
  }, []);

  const handleImpersonate = useCallback(
    async (tenantId: string, tenantName: string) => {
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
    },
    [],
  );

  const selectedTenantId = useSuperadminStore((s) => s.selectedTenantId);
  const tenants = useSuperadminStore((s) => s.tenants);
  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FE]">
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
              >
                <Bell className="w-4 h-4 text-white" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-300 ring-2 ring-[#338BE2]" />
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
// SIDEBAR — matches uploaded dashboard (blue gradient, white text/icons)
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
              {isActive && (
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

/** Circular progress ring (used in stat cards) */
function CircularProgressRing({
  value,
  size = 70,
  stroke = 6,
  color = BLUE,
  trackColor = "rgba(51,139,226,0.12)",
  label,
  sublabel,
}: {
  value: number; // 0-100
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
            <span className="text-[9px] text-slate-400 mt-0.5">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Gauge meter (semicircle) — used in 5th stat card */
function GaugeMeter({
  value,
  size = 120,
  stroke = 10,
  color = BLUE,
  label,
  sublabel,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * radius; // half circle
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
            <span className="text-[10px] text-slate-400">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/** Area chart with smooth curve + gradient fill */
function AreaChart({ height = 220 }: { height?: number }) {
  // Static demo data — 12 monthly points
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

  // Smooth curve via Catmull-Rom → Bezier conversion (simplified)
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

      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={pad}
          x2={w - pad}
          y1={h - pad - p * (h - pad * 2)}
          y2={h - pad - p * (h - pad * 2)}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* Area fill */}
      <motion.path
        d={areaD}
        fill="url(#areaGrad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
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

      {/* Points */}
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

      {/* X-axis labels */}
      {months.map((m, i) => (
        <text
          key={i}
          x={pad + i * stepX}
          y={h - 5}
          textAnchor="middle"
          className="fill-slate-400"
          style={{ fontSize: "10px" }}
        >
          {m}
        </text>
      ))}
    </svg>
  );
}

/** Donut chart with multiple segments + center text */
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

  let cumulative = 0;
  const arcs = segments.map((seg, i) => {
    const fraction = seg.value / total;
    const dashLen = fraction * circumference;
    const dashOffset = -cumulative * circumference;
    cumulative += fraction;
    return { ...seg, dashLen, dashOffset, i };
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(51,139,226,0.06)"
          strokeWidth={stroke}
        />
        {/* Segments */}
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
          <span className="text-2xl font-bold text-slate-900">{centerLabel}</span>
          {centerSub && (
            <span className="text-xs text-slate-500 mt-0.5">{centerSub}</span>
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

/** Bar chart (bottom, with 2014-2020 timeline) */
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

      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((p) => (
        <line
          key={p}
          x1={pad}
          x2={w - pad}
          y1={h - pad - p * (h - pad * 2)}
          y2={h - pad - p * (h - pad * 2)}
          stroke="#E2E8F0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ))}

      {/* Bars */}
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
            {/* Value label on top */}
            <motion.text
              x={x + barWidth / 2}
              y={y - 8}
              textAnchor="middle"
              className="fill-slate-600"
              style={{ fontSize: "10px", fontWeight: 600 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              {d.value}
            </motion.text>
            {/* Year label */}
            <text
              x={x + barWidth / 2}
              y={h - 10}
              textAnchor="middle"
              className="fill-slate-400"
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
// PAGE: OVERVIEW — matches uploaded dashboard image
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vue d&apos;ensemble</h1>
          <p className="text-slate-500 text-sm">
            Pilotage de la plateforme YonuKom
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={metricsLoading}
          className="bg-white border-slate-200 hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
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
        {/* 5th card — gauge meter */}
        <Card className="bg-white border border-slate-200/60 hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow">
          <CardContent className="p-5 flex flex-col items-center">
            <div className="flex items-center gap-2 self-start mb-2">
              <div className="w-7 h-7 rounded-lg bg-[#338BE2]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#338BE2]" />
              </div>
              <p className="text-xs font-medium text-slate-500">Santé plateforme</p>
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

      {/* MIDDLE: area chart + 4 small data cards (left), donut + table (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left (2/3): area chart + 4 small cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Area chart card */}
          <Card className="bg-white border border-slate-200/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Statistic Graph
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Évolution mensuelle du revenu
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="all-categories">
                    <SelectTrigger className="w-[140px] h-8 text-xs bg-[#F6F9FE] border-slate-200">
                      <SelectValue placeholder="Toutes catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-categories">Toutes catégories</SelectItem>
                      <SelectItem value="tenants">Tenants</SelectItem>
                      <SelectItem value="subscriptions">Abonnements</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all-stats">
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-[#F6F9FE] border-slate-200">
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

          {/* 4 small colored data cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniDataCard
              value="1.650"
              label="Total Distance"
              color={BLUE}
              icon={TrendingUp}
            />
            <MiniDataCard
              value="650"
              label="Total Distance"
              color={EMERALD}
              icon={Activity}
            />
            <MiniDataCard
              value="1.100"
              label="Total Distance"
              color={AMBER}
              icon={CircleDollarSign}
            />
            <MiniDataCard
              value="490"
              label="Total Distance"
              color={LAVENDER}
              icon={Users}
            />
          </div>
        </div>

        {/* Right (1/3): donut chart + product table */}
        <div className="space-y-4">
          {/* Donut chart card */}
          <Card className="bg-white border border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Répartition
              </CardTitle>
              <p className="text-xs text-slate-500">Plans d&apos;abonnement</p>
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
              {/* Legend */}
              <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-slate-100">
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
                      <span className="text-[10px] font-medium text-slate-600">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product table */}
          <Card className="bg-white border border-slate-200/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900">
                Top produits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-[#F6F9FE]">
                      <th className="text-left font-semibold text-slate-500 px-4 py-2.5 uppercase tracking-wider text-[10px]">
                        Produit
                      </th>
                      <th className="text-right font-semibold text-slate-500 px-2 py-2.5 uppercase tracking-wider text-[10px]">
                        Qté
                      </th>
                      <th className="text-right font-semibold text-slate-500 px-2 py-2.5 uppercase tracking-wider text-[10px]">
                        Prix
                      </th>
                      <th className="text-right font-semibold text-slate-500 px-4 py-2.5 uppercase tracking-wider text-[10px]">
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
                        className="border-b border-slate-50 last:border-0 hover:bg-[#F6F9FE]/60 transition-colors"
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
                            <span className="font-medium text-slate-700">
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right text-slate-600">
                          {item.qty}
                        </td>
                        <td className="px-2 py-2.5 text-right text-slate-600">
                          {item.price.toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900">
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

      {/* BOTTOM: bar chart with 2014-2020 timeline */}
      <Card className="bg-white border border-slate-200/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Croissance annuelle
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Évolution 2014 — 2020
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: BLUE }}
                />
                <span className="text-slate-500">Revenus (M CFA)</span>
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BarChart height={200} />
        </CardContent>
      </Card>

      {/* Recent Tenants */}
      <Card className="bg-white border border-slate-200/60">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
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

// ============================================================
// HELPER: Stat Card with circular progress ring
// ============================================================

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
    <Card className="bg-white border border-slate-200/60 hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-slate-500 font-medium truncate">{title}</p>
            <p className="text-xl font-bold text-slate-900 tracking-tight">
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

// ============================================================
// HELPER: Mini data card (small colored stat)
// ============================================================

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
      className="bg-white border border-slate-200/60 hover:shadow-md transition-shadow overflow-hidden relative"
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
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================
// PAGE: TENANTS — with Nouveau tenant dialog
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

  // --- État du dialog "Nouveau tenant" ---
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
      const res = await fetch("/api/superadmin/tenants", {
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-slate-500 text-sm">
            {tenants.length} commerces inscrits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={tenantsLoading}
            className="bg-white border-slate-200 hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
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

      {/* Search (mobile-friendly — desktop uses top bar search) */}
      <div className="relative max-w-md lg:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Rechercher par nom, propriétaire ou email..."
          value={tenantSearch}
          onChange={(e) => setTenantSearch(e.target.value)}
          className="pl-9 bg-white border-slate-200"
        />
      </div>

      {/* Table card */}
      <Card className="bg-white border border-slate-200/60">
        <CardContent className="p-4 sm:p-6">
          <TenantTable
            tenants={filteredTenants}
            onViewTenant={onViewTenant}
            onImpersonate={onImpersonate}
          />
        </CardContent>
      </Card>

      {/* --- Dialog : Nouveau tenant --- */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
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
// PAGE: SUBSCRIPTIONS
// ============================================================

function SubscriptionsPage() {
  const [subs, setSubs] = useState<
    Array<{
      id: string;
      plan: string;
      status: string;
      amount: number;
      paymentMethod?: string;
      nextBillingDate?: string;
      tenant: { id: string; name: string; ownerName: string; ownerEmail: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const url =
          statusFilter !== "all"
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
          <h1 className="text-2xl font-bold text-slate-900">Abonnements</h1>
          <p className="text-slate-500 text-sm">
            Gestion des abonnements tenants
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="past_due">En retard</SelectItem>
            <SelectItem value="expired">Expirés</SelectItem>
            <SelectItem value="cancelled">Annulés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscription Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-white border border-slate-200">
              <CardContent className="p-6 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : subs.length === 0 ? (
        <Card className="bg-white border border-slate-200/60">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun abonnement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-white border border-slate-200/60 hover:shadow-[0_8px_24px_-12px_rgba(51,139,226,0.15)] transition-shadow h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {sub.tenant.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {sub.tenant.ownerEmail}
                      </p>
                    </div>
                    <SubscriptionStatusBadge
                      status={sub.status as SubscriptionStatus}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {SUBSCRIPTION_PLAN_LABELS[sub.plan as SubscriptionPlan] ??
                        sub.plan}
                    </Badge>
                    <span className="font-bold text-sm text-slate-900">
                      {formatFCFAShort(sub.amount)}
                    </span>
                  </div>
                  {sub.nextBillingDate && (
                    <p className="text-xs text-slate-500">
                      Prochaine facturation :{" "}
                      {new Date(sub.nextBillingDate).toLocaleDateString("fr-FR")}
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
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-500 text-sm">
            Métriques globales de la plateforme
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={metricsLoading}
          className="bg-white border-slate-200 hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 hover:text-[#338BE2]"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${metricsLoading ? "animate-spin" : ""}`}
          />
          Actualiser
        </Button>
      </div>

      {/* Key Metrics — 4 SVG rings */}
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

      {/* Revenue chart — Area */}
      <Card className="bg-white border border-slate-200/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#338BE2]" />
            MRR — 12 derniers mois
          </CardTitle>
          <CardDescription>Évolution du revenu récurrent mensuel</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaChart height={240} />
        </CardContent>
      </Card>

      {/* Subscription Breakdown */}
      {metrics?.subscriptionBreakdown && (
        <Card className="bg-white border border-slate-200/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Répartition des abonnements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(["starter", "pro", "enterprise"] as SubscriptionPlan[]).map((plan, i) => (
                <div
                  key={plan}
                  className="text-center space-y-2 p-4 rounded-xl border border-slate-100"
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
                  <p className="text-3xl font-bold text-slate-900">
                    {metrics.subscriptionBreakdown[plan]}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {SUBSCRIPTION_PLAN_LABELS[plan]}
                  </Badge>
                  <p className="text-xs text-slate-500">
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
    info: "text-[#338BE2]",
    warning: "text-amber-500",
    error: "text-rose-500",
    critical: "text-rose-700 font-bold",
  };

  const levelBg: Record<string, string> = {
    info: "bg-[#338BE2]/5",
    warning: "bg-amber-50",
    error: "bg-rose-50",
    critical: "bg-rose-100",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs plateforme</h1>
          <p className="text-slate-500 text-sm">
            Journal des événements globaux
          </p>
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
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
            <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      ) : platformLogs.length === 0 ? (
        <Card className="bg-white border border-slate-200/60">
          <CardContent className="py-12 text-center">
            <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun log trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border border-slate-200/60">
          <CardContent className="p-0">
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar p-4">
              {platformLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border border-slate-100 ${
                    levelBg[log.level] ?? "bg-white"
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
                      <span className="text-xs text-slate-500">
                        {new Date(log.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 truncate">
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
// PAGE: SETTINGS
// ============================================================

function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

      <Card className="bg-white border border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
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
              <p className="font-semibold text-slate-900">
                {user?.name ?? "Superadmin"}
              </p>
              <p className="text-sm text-slate-500">
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
            <span className="text-xs text-slate-500">
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

      <Card className="bg-white border border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-900">
            Configuration plateforme
          </CardTitle>
          <CardDescription>Paramètres globaux de YonuKom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Devise par défaut</span>
            <Badge variant="outline" className="border-slate-200">
              FCFA (XOF)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Région</span>
            <Badge variant="outline" className="border-slate-200">
              Sénégal (SN)
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-700">Mode</span>
            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
              Production
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
