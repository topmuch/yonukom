// ============================================================
// YonuKom — AppShell (Phase 5) — Premium Blue Theme
// Main application shell wrapping the dashboard after onboarding.
// Blue sidebar + sticky header + bottom nav (mobile) + content area
// Tabs are dynamic based on active modules (config)
// Shows RoleBadge + user info in header/sidebar
// ============================================================

"use client";

import { useMemo } from "react";
import { ConnectivityDot } from "@/components/layout/connectivity-banner";
import { RoleBadge } from "@/components/auth/permission-guard";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { Home, ShoppingBag, Package, ClipboardList, Settings, Building2 } from "lucide-react";
import { motion } from "framer-motion";

export type TabId = "home" | "pos" | "stock" | "orders" | "pipeline" | "settings";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

// All possible tabs — filtered dynamically per business config
const ALL_TABS: TabConfig[] = [
  { id: "home", label: "Accueil", icon: Home },
  { id: "pos", label: "Vente", icon: ShoppingBag },
  { id: "stock", label: "Stock", icon: Package },
  { id: "orders", label: "Commandes", icon: ClipboardList },
  { id: "pipeline", label: "Pipeline", icon: Building2 },
  { id: "settings", label: "Paramètres", icon: Settings },
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

  // Dynamic tabs based on active modules
  const tabs = useMemo(() => {
    const isB2B = config?.pipeline_b2b ?? false;
    const isEcom = config?.ecommerce_social ?? false;

    // If B2B is active, replace generic "Commandes" with specific tabs
    if (isB2B && !isEcom) {
      // Pure B2B: show Pipeline instead of Commandes
      return ALL_TABS.filter((t) => t.id !== "orders");
    }
    if (isB2B && isEcom) {
      // Mixte: show both Commandes (e-com) and Pipeline (B2B)
      return ALL_TABS;
    }
    // Default (e-com only): no pipeline tab
    return ALL_TABS.filter((t) => t.id !== "pipeline");
  }, [config?.pipeline_b2b, config?.ecommerce_social]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ---- Sticky Header (mobile + tablet) ---- */}
      <header className="lg:hidden border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* YK Logo Badge — white on blue */}
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <span className="text-primary-foreground font-bold text-sm">YK</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base leading-tight">YonuKom</span>
              {user && (
                <span className="text-[10px] text-muted-foreground leading-tight">
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
      <main className="flex-1 max-w-4xl mx-auto w-full pb-20 lg:pb-4 lg:ml-56">
        {/* ---- Desktop Header (sticky top bar inside content) ---- */}
        <header className="hidden lg:flex sticky top-0 z-30 px-6 py-3 items-center justify-between bg-card/80 backdrop-blur-sm border-b border-border">
          <span className="font-semibold text-sm">
            {tabs.find((t) => t.id === activeTab)?.label ?? "Accueil"}
          </span>
          <div className="flex items-center gap-2">
            <RoleBadge />
            <ConnectivityDot />
            <ThemeToggle />
          </div>
        </header>

        {children}
      </main>

      {/* ---- Bottom Navigation (Mobile) ---- */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom"
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
                  flex flex-col items-center justify-center gap-0.5
                  min-h-[48px] min-w-[48px] flex-1 py-2
                  transition-colors duration-150
                  ${isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {isActive ? (
                  <motion.div
                    layoutId="nav-icon"
                    className="relative flex flex-col items-center"
                  >
                    <Icon className="w-5 h-5" strokeWidth={2.2} />
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  </motion.div>
                ) : (
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                )}
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---- Desktop Sidebar (lg+) — BLUE ---- */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 bg-sidebar text-sidebar-foreground shadow-xl flex-col z-40">
        {/* Logo header */}
        <div className="px-4 py-5 flex items-center gap-2.5 border-b border-white/15">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
            <span className="text-primary font-bold text-sm">YK</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight text-white">YonuKom</span>
            {user && (
              <span className="text-[10px] text-white/70 leading-tight">
                {user.businessName}
              </span>
            )}
          </div>
        </div>

        {/* Nav — white-on-blue */}
        <nav className="flex-1 py-4 px-3 space-y-1" role="tablist" aria-label="Navigation principale">
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
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150 min-h-[44px] font-medium
                  ${isActive
                    ? "bg-white text-primary shadow-sm"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer: user info + connectivity + theme toggle */}
        <div className="px-4 py-3 border-t border-white/15 space-y-2">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium truncate text-white/90">{user.name}</p>
                <RoleBadge className="text-[7px]" />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <ConnectivityDot />
            {/* Theme toggle on blue background — uses light variant */}
            <div className="[&_button]:text-white [&_button:hover]:bg-white/15">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
