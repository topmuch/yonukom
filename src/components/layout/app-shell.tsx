// ============================================================
// YonuKom — AppShell (Phase 5) — Premium Blue Theme + Vibrant accents
// Main application shell wrapping the dashboard after onboarding.
// Blue sidebar + sticky header with search + bottom nav (mobile)
// Tabs are dynamic based on active modules (config)
// ============================================================

"use client";

import { useMemo, useState } from "react";
import { ConnectivityDot } from "@/components/layout/connectivity-banner";
import { RoleBadge } from "@/components/auth/permission-guard";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  Home,
  ShoppingBag,
  Package,
  ClipboardList,
  Settings,
  Building2,
  Search,
  Bell,
  X,
  History,
  LogOut,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export type TabId =
  | "home"
  | "pos"
  | "stock"
  | "orders"
  | "history"
  | "pipeline"
  | "settings";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
  /** Tailwind gradient classes (from-x to-y) used as accent */
  gradient: string;
  /** Solid accent color used on the mobile bottom nav indicator */
  accent: string;
  /** Hex used for the desktop sidebar active icon color */
  color: string;
}

// All possible tabs — filtered dynamically per business config
// Each tab carries its own vibrant accent color (POS=blue, Stock=emerald, etc.)
const ALL_TABS: TabConfig[] = [
  {
    id: "home",
    label: "Accueil",
    icon: Home,
    gradient: "from-blue-500 to-indigo-500",
    accent: "bg-blue-500",
    color: "#3B82F6",
  },
  {
    id: "pos",
    label: "Vente",
    icon: ShoppingBag,
    gradient: "from-[#338BE2] to-cyan-500",
    accent: "bg-[#338BE2]",
    color: "#338BE2",
  },
  {
    id: "stock",
    label: "Stock",
    icon: Package,
    gradient: "from-emerald-500 to-teal-500",
    accent: "bg-emerald-500",
    color: "#10B981",
  },
  {
    id: "orders",
    label: "Commandes",
    icon: ClipboardList,
    gradient: "from-amber-500 to-orange-500",
    accent: "bg-amber-500",
    color: "#F59E0B",
  },
  {
    id: "history",
    label: "Historique",
    icon: History,
    gradient: "from-rose-500 to-pink-500",
    accent: "bg-rose-500",
    color: "#F43F5E",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Building2,
    gradient: "from-violet-500 to-purple-500",
    accent: "bg-violet-500",
    color: "#8B5CF6",
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    gradient: "from-slate-500 to-slate-700",
    accent: "bg-slate-500",
    color: "#64748B",
  },
];

interface AppShellProps {
  /** Currently active tab */
  activeTab: TabId;
  /** Callback when a tab is changed */
  onTabChange: (tab: TabId) => void;
  /** Content to render in the main area */
  children: React.ReactNode;
}

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const config = useConfigStore((s) => s.config);
  const user = useAuthStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamic tabs based on active modules
  const tabs = useMemo(() => {
    const isB2B = config?.pipeline_b2b ?? false;
    const isEcom = config?.ecommerce_social ?? false;
    if (isB2B && !isEcom) {
      return ALL_TABS.filter((t) => t.id !== "orders");
    }
    if (isB2B && isEcom) {
      return ALL_TABS;
    }
    return ALL_TABS.filter((t) => t.id !== "pipeline");
  }, [config?.pipeline_b2b, config?.ecommerce_social]);

  const activeTabConfig =
    tabs.find((t) => t.id === activeTab) ?? ALL_TABS[0];
  const activeTabLabel = activeTabConfig.label;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FE]">
      {/* ---- Sticky Header (mobile + tablet) ---- */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#338BE2]/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${activeTabConfig.gradient} flex items-center justify-center shadow-md`}>
              <span className="text-white font-bold text-sm">YK</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight text-slate-900">
                YonuKom
              </span>
              {user && (
                <span className="text-[10px] text-slate-500 leading-tight">
                  {user.businessName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <RoleBadge />
            <ConnectivityDot />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ---- Content Area ---- */}
      <main className="flex-1 max-w-7xl mx-auto w-full pb-20 lg:pb-6 lg:ml-60">
        {/* ---- Desktop Header (sticky top bar with search) ---- */}
        <header className="hidden lg:flex sticky top-0 z-30 px-6 py-3.5 items-center justify-between bg-white/85 backdrop-blur-xl border-b border-[#338BE2]/10">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={`Rechercher dans ${activeTabLabel.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-10 bg-[#F6F9FE] border-[#338BE2]/15 rounded-xl text-sm focus:bg-white focus:border-[#338BE2]/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="w-9 h-9 rounded-lg bg-[#F6F9FE] border border-[#338BE2]/15 hover:bg-[#338BE2]/5 hover:border-[#338BE2]/30 flex items-center justify-center text-slate-500 hover:text-[#338BE2] transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
            </button>
            <RoleBadge />
            <ConnectivityDot />
            <ThemeToggle />
          </div>
        </header>

        <div className="px-4 lg:px-6 pt-4 lg:pt-6">{children}</div>
      </main>

      {/* ---- Bottom Navigation (Mobile) ---- */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#338BE2]/10 safe-area-bottom"
        role="tablist"
        aria-label="Navigation principale"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center gap-1
                  min-h-[56px] min-w-[48px] flex-1 py-2
                  transition-colors duration-150 relative
                  ${isActive ? "text-slate-900" : "text-slate-400 hover:text-slate-600"}
                `}
                style={isActive ? { color: tab.color } : undefined}
              >
                {isActive ? (
                  <motion.div
                    layoutId="nav-icon"
                    className="relative flex flex-col items-center"
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.4} />
                    <motion.div
                      layoutId="nav-indicator"
                      className={`absolute -bottom-1 h-0.5 w-5 rounded-full ${tab.accent}`}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                )}
                <span className="text-[10px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---- Desktop Sidebar (lg+) — BLUE with vibrant per-tab accents ---- */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-gradient-to-b from-[#338BE2] to-[#2074C6] text-white shadow-[8px_0_24px_-12px_rgba(51,139,226,0.4)] flex-col z-40">
        {/* Logo header */}
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/15">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
            <span className="text-[#338BE2] font-bold text-base">YK</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight text-white">
              YonuKom
            </span>
            {user && (
              <span className="text-[10px] text-white/70 leading-tight truncate max-w-[150px]">
                {user.businessName}
              </span>
            )}
          </div>
        </div>

        {/* Search mini */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/60" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg bg-white/10 border border-white/15 placeholder:text-white/50 text-white focus:outline-none focus:bg-white/20 focus:border-white/30 transition-colors"
            />
          </div>
        </div>

        {/* Nav — white-on-blue, with vibrant accent for the active item */}
        <nav
          className="flex-1 py-3 px-3 space-y-1 overflow-y-auto"
          role="tablist"
          aria-label="Navigation principale"
        >
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Menu
          </p>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => onTabChange(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  transition-all duration-150 min-h-[44px] font-medium text-sm relative overflow-hidden
                  ${
                    isActive
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-white/90 hover:bg-white/15 hover:text-white"
                  }
                `}
              >
                {/* Vibrant gradient strip on the left for active items */}
                {isActive && (
                  <span
                    className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.gradient}`}
                  />
                )}
                {/* Icon — colored when active */}
                <Icon
                  className="w-5 h-5 relative z-10"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={isActive ? { color: tab.color } : undefined}
                />
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="px-4 py-3 border-t border-white/15 space-y-2">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate text-white">
                  {user.name}
                </p>
                <RoleBadge className="text-[8px]" />
              </div>
              <button
                onClick={() => useAuthStore.getState().logout()}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white/70 hover:text-white transition-colors shrink-0"
                title="Déconnexion"
                aria-label="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <ConnectivityDot />
            <div className="[&_button]:text-white [&_button:hover]:bg-white/15">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
