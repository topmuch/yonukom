// ============================================================
// YonuKom — AppShell (Phase 5) — Premium Blue Theme + Vibrant accents
// Main application shell wrapping the dashboard after onboarding.
// Blue sidebar + sticky header with search + bottom nav (mobile)
// Tabs are dynamic based on active modules (config)
// ============================================================

"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { ConnectivityDot } from "@/components/layout/connectivity-banner";
import { RoleBadge } from "@/components/auth/permission-guard";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useModulesStore } from "@/stores/use-modules-store";
import type { ModuleId } from "@/lib/modules/module-config";

/**
 * Mapping TabId → ModuleId. Les onglets sans mapping sont toujours visibles.
 * Les onglets avec mapping ne s'affichent que si le module correspondant est
 * activé pour le tenant (Tenant.modules JSON).
 */
const TAB_MODULE_MAP: Partial<Record<TabId, ModuleId>> = {
  pos: "pos",
  products: "products",
  categories: "products",
  stock: "stock",
  "online-orders": "online_store",
  pipeline: "wholesale",
  invoices: "wholesale",
  debts: "debts",
  stats: "reports",
  team: "multi_users",
  notifications: "whatsapp_auto",
  "analytics-ai": "analytics_pro",
  appointments: "salon_booking",
};
import {
  Home,
  ShoppingBag,
  Package,
  Boxes,
  ClipboardList,
  Settings,
  Building2,
  Search,
  Bell,
  X,
  History,
  CalendarClock,
  LogOut,
  FileText,
  Users,
  Truck,
  MessageCircle,
  BarChart3,
  Calculator,
  Landmark,
  Tag,
  Menu,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useBusinessLogo } from "@/lib/business-logo";
import type { UserRole } from "@/types";

export type TabId =
  | "home"
  | "pos"
  | "stock"
  | "products"
  | "categories"
  | "customers"
  | "orders"
  | "online-orders"
  | "appointments"
  | "history"
  | "pipeline"
  | "invoices"
  | "debts"
  | "purchases"
  | "stats"
  | "team"
  | "notifications"
  | "analytics-ai"
  | "accounting"
  | "caisse"
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
// Each tab carries its own vibrant accent color (POS=pink, Stock=emerald, etc.)
const ALL_TABS: TabConfig[] = [
  {
    id: "home",
    label: "Accueil",
    icon: Home,
    gradient: "from-pink-500 to-rose-500",
    accent: "bg-pink-500",
    color: "#E91E63",
  },
  {
    id: "pos",
    label: "Vente",
    icon: ShoppingBag,
    gradient: "from-[#E91E63] to-cyan-500",
    accent: "bg-[#E91E63]",
    color: "#E91E63",
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
    id: "products",
    label: "Produits",
    icon: Boxes,
    gradient: "from-purple-500 to-fuchsia-500",
    accent: "bg-purple-500",
    color: "#A855F7",
  },
  {
    id: "categories",
    label: "Catégories",
    icon: Tag,
    gradient: "from-fuchsia-500 to-purple-500",
    accent: "bg-fuchsia-500",
    color: "#D946EF",
  },
  {
    id: "customers",
    label: "Clients",
    icon: Users,
    gradient: "from-rose-500 to-pink-600",
    accent: "bg-rose-500",
    color: "#F43F5E",
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
    id: "online-orders",
    label: "Cmds Online",
    icon: ShoppingBag,
    gradient: "from-cyan-500 to-teal-500",
    accent: "bg-cyan-500",
    color: "#06B6D4",
  },
  {
    id: "appointments",
    label: "RDV",
    icon: CalendarClock,
    gradient: "from-violet-500 to-purple-500",
    accent: "bg-violet-500",
    color: "#8B5CF6",
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
  // ─── Nouveaux modules métier (V2) ───
  {
    id: "invoices",
    label: "Factures",
    icon: FileText,
    gradient: "from-cyan-500 to-teal-500",
    accent: "bg-cyan-500",
    color: "#06B6D4",
  },
  {
    id: "debts",
    label: "Dettes",
    icon: Users,
    gradient: "from-red-500 to-rose-500",
    accent: "bg-red-500",
    color: "#EF4444",
  },
  {
    id: "purchases",
    label: "Achats",
    icon: Truck,
    gradient: "from-orange-500 to-amber-500",
    accent: "bg-orange-500",
    color: "#F97316",
  },
  {
    id: "stats",
    label: "Statistiques",
    icon: BarChart3,
    gradient: "from-violet-500 to-fuchsia-500",
    accent: "bg-violet-500",
    color: "#8B5CF6",
  },
  {
    id: "team",
    label: "Équipe",
    icon: Users,
    gradient: "from-pink-500 to-rose-500",
    accent: "bg-pink-500",
    color: "#EC4899",
  },
  {
    id: "notifications",
    label: "WhatsApp",
    icon: MessageCircle,
    gradient: "from-green-500 to-emerald-500",
    accent: "bg-green-500",
    color: "#22C55E",
  },
  {
    id: "analytics-ai",
    label: "IA Analytics",
    icon: BarChart3,
    gradient: "from-violet-500 to-fuchsia-500",
    accent: "bg-violet-500",
    color: "#8B5CF6",
  },
  {
    id: "accounting",
    label: "Compta",
    icon: Calculator,
    gradient: "from-teal-500 to-emerald-600",
    accent: "bg-teal-500",
    color: "#14B8A6",
  },
  {
    id: "caisse",
    label: "Caisse",
    icon: Landmark,
    gradient: "from-emerald-500 to-green-500",
    accent: "bg-emerald-500",
    color: "#10B981",
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

// ============================================================
// ROLE-BASED TAB FILTERING (Anti-Fraud — Navigation Layer)
// ------------------------------------------------------------
// The config-based filter (pipeline_b2b / ecommerce_social) decides
// which business modules are visible. This role-based filter decides
// which tabs each user role can navigate to.
//
// ⚠️ RÈGLE ANTI-FRADE :
//   - Un vendeur ne voit PAS les onglets liés au stock, achats,
//     marges/prix d'achat, comptabilité, statistiques, équipe, caisse
//     (clôture réservée patron/gérant). Il ne doit pas non plus voir
//     les dettes, factures, pipeline B2B, ni l'IA Analytics.
//   - Un gérant gère le stock, les achats, la compta, la caisse, les
//     stats — mais NE gère PAS l'équipe (canManageUsers = patron only).
//   - Le patron et le superadmin voient tout.
//
// This filter is defense-in-depth at the NAVIGATION layer. Server-side
// permission checks (PermissionGuard, hasPermission, ROLE_PERMISSIONS)
// remain authoritative for actions inside each tab.
// ============================================================

/** Tabs a vendeur can access. Everything else is hidden from them. */
const VENDEUR_ALLOWED_TABS: ReadonlySet<TabId> = new Set<TabId>([
  "home",
  "pos",
  "customers",
  "orders",
  "online-orders",
  "appointments",
  "history",
  "notifications",
  "settings",
]);

/**
 * Returns whether a given role can navigate to a given tab.
 *
 * - superadmin / patron → all tabs
 * - gerant              → all tabs except "team" (canManageUsers is patron-only)
 * - vendeur             → only VENDEUR_ALLOWED_TABS (see above)
 *
 * Default-deny for unknown roles.
 */
export function canAccessTab(role: UserRole | string | undefined, tabId: TabId): boolean {
  const r = (role || "vendeur") as UserRole;

  // Patron & superadmin see everything
  if (r === "patron" || r === "superadmin") {
    return true;
  }

  // Gerant: everything except team management (canManageUsers = false)
  if (r === "gerant") {
    return tabId !== "team";
  }

  // Vendeur: explicit allowlist
  if (r === "vendeur") {
    return VENDEUR_ALLOWED_TABS.has(tabId);
  }

  // Default-deny for unknown roles
  return false;
}

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
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const { logoUrl } = useBusinessLogo(user?.businessId);
  const businessName = user?.businessName ?? "YonuKom";
  const businessInitial = businessName.trim().charAt(0).toUpperCase() || "Y";

  // --- Badge de notifications : compteur de commandes en ligne en attente ---
  // Polling toutes les 30s pour détecter les nouvelles commandes PENDING.
  // Affiché sur l'onglet "Cmds Online" (mobile bottom nav + desktop sidebar).
  const onlineBusinessId = user?.businessId;
  const [pendingOnlineCount, setPendingOnlineCount] = useState(0);
  const fetchPendingOnlineCount = useCallback(async () => {
    if (!onlineBusinessId) return;
    try {
      const res = await fetch(
        `/api/online-orders?businessId=${onlineBusinessId}&status=PENDING`
      );
      if (!res.ok) return;
      const data = await res.json();
      setPendingOnlineCount(Array.isArray(data.orders) ? data.orders.length : 0);
    } catch {
      // Silencieux
    }
  }, [onlineBusinessId]);

  useEffect(() => {
    if (!onlineBusinessId) return;
    fetchPendingOnlineCount();
    const interval = setInterval(fetchPendingOnlineCount, 30000);
    return () => clearInterval(interval);
  }, [onlineBusinessId, fetchPendingOnlineCount]);

  // Mode plein écran pour le POS — masque le sidebar et occupe toute la largeur
  const isFullscreen = activeTab === "pos";

  // Dynamic tabs based on active modules (config) AND user role AND tenant modules.
  // - config filter : pipeline_b2b / ecommerce_social / appointments (onboarding)
  // - role filter : canAccessTab (anti-fraud nav layer)
  // - modules filter : TAB_MODULE_MAP → isModuleEnabled (tenant.modules JSON)
  const tenantModules = useModulesStore((s) => s.modules);

  const tabs = useMemo(() => {
    const isB2B = config?.pipeline_b2b ?? false;
    const isEcom = config?.ecommerce_social ?? false;
    const role = user?.role || "vendeur";

    let configFiltered: TabConfig[];
    if (isB2B && !isEcom) {
      configFiltered = ALL_TABS.filter((t) => t.id !== "orders");
    } else if (isB2B && isEcom) {
      configFiltered = ALL_TABS;
    } else {
      configFiltered = ALL_TABS.filter((t) => t.id !== "pipeline");
    }

    return configFiltered
      .filter((t) => {
        if (t.id !== "appointments") return true;
        // Show appointments if EITHER the onboarding config flag is set
        // OR the salon_booking module is enabled in Tenant.modules
        if (config?.appointments) return true;
        if (tenantModules && tenantModules["salon_booking"]?.enabled === true) return true;
        return false;
      })
      .filter((t) => canAccessTab(role, t.id))
      // Filtrage par modules activables (Tenant.modules JSON)
      // Si modules pas encore chargé (null) → on affiche tout (évite le flicker)
      .filter((t) => {
        if (!tenantModules) return true;
        const moduleId = TAB_MODULE_MAP[t.id];
        if (!moduleId) return true; // pas de restriction de module
        return tenantModules[moduleId]?.enabled === true;
      });
  }, [config?.pipeline_b2b, config?.ecommerce_social, config?.appointments, user?.role, tenantModules]);

  const activeTabConfig =
    tabs.find((t) => t.id === activeTab) ?? ALL_TABS[0];
  const activeTabLabel = activeTabConfig.label;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ---- Sticky Header (mobile + tablet) ---- */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-primary/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="h-9 w-9 rounded-xl object-contain bg-white border border-slate-200 shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] flex items-center justify-center shadow-md shrink-0">
                <span className="text-white font-bold text-sm">
                  {businessInitial}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-sm leading-tight text-foreground">
                YonuKom
              </span>
              {user && (
                <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[140px]">
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

      {/* ---- Floating menu button (visible only in fullscreen POS mode on desktop) ---- */}
      {isFullscreen && (
        <button
          type="button"
          onClick={() => onTabChange("home")}
          className="hidden lg:flex fixed top-4 left-4 z-50 items-center gap-2 px-3 py-2 rounded-xl bg-background/90 backdrop-blur-md border border-border shadow-md text-sm font-medium hover:bg-accent transition-colors"
          aria-label="Retour au menu"
          title="Retour au menu principal"
        >
          <Menu className="w-4 h-4" />
          <span className="hidden xl:inline">Menu</span>
        </button>
      )}

      {/* ---- Content Area ---- */}
      <main className={`flex-1 mx-auto w-full pb-20 lg:pb-6 ${isFullscreen ? "max-w-none lg:ml-0" : "max-w-7xl lg:ml-60"}`}>
        {/* ---- Desktop Header (sticky top bar with search) ---- */}
        {/* Masqué en mode plein écran (POS) car le POS a sa propre barre de recherche */}
        <header className={`hidden sticky top-0 z-30 px-6 py-3.5 items-center justify-between bg-background/85 backdrop-blur-xl border-b border-primary/10 ${isFullscreen ? "lg:hidden" : "lg:flex"}`}>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={`Rechercher dans ${activeTabLabel.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-9 h-10 bg-muted border-primary/15 rounded-xl text-sm focus:bg-card focus:border-primary/30 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange("notifications")}
              className="w-9 h-9 rounded-lg bg-muted border border-primary/15 hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors relative"
              aria-label="Voir les notifications"
              title="Notifications WhatsApp"
            >
              <Bell className="w-4 h-4" />
              {pendingOnlineCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background">
                  {pendingOnlineCount > 9 ? "9+" : pendingOnlineCount}
                </span>
              )}
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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-xl border-t border-primary/10 safe-area-bottom"
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
                  ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
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
                {/* Badge notifications commandes en ligne */}
                {tab.id === "online-orders" && pendingOnlineCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse">
                    {pendingOnlineCount > 9 ? "9+" : pendingOnlineCount}
                  </span>
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
      <aside className={`hidden fixed left-0 top-0 bottom-0 w-60 bg-gradient-to-b from-[#E91E63] to-[#AD1457] text-white shadow-[8px_0_24px_-12px_rgba(51,139,226,0.4)] flex-col z-40 ${isFullscreen ? "lg:hidden" : "lg:flex"}`}>
        {/* Logo header */}
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-white/15">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-10 w-10 rounded-xl object-contain bg-white border border-white/40 shrink-0 shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shrink-0">
              <span className="text-[#E91E63] font-bold text-base">
                {businessInitial}
              </span>
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm leading-tight text-white">
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

        {/* Nav — 3 sections (Principal / Gestion / Avancé) avec scroll visible fin.
             Le sidebar contient 17 onglets — on les regroupe pour faciliter
             la navigation, et on autorise un scroll discret si nécessaire. */}
        <nav
          className="flex-1 py-2 px-3 overflow-y-auto
            [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full
            [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
          role="tablist"
          aria-label="Navigation principale"
        >
          <p className="px-3 pt-1 pb-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Principal
          </p>
          {tabs.filter(t => ["home", "pos", "products", "categories", "stock", "customers", "caisse", "orders", "online-orders", "appointments"].includes(t.id)).map((tab) => {
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
                  w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg
                  transition-all duration-150 min-h-[36px] font-medium text-[13px] relative overflow-hidden mb-0.5
                  ${isActive ? "bg-white text-slate-900 shadow-md" : "text-white/90 hover:bg-white/15 hover:text-white"}
                `}
              >
                {isActive && (
                  <span className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.gradient}`} />
                )}
                <Icon
                  className="w-4 h-4 relative z-10 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={isActive ? { color: tab.color } : undefined}
                />
                <span className="relative z-10 truncate">{tab.label}</span>
                {/* Badge notifications commandes en ligne (sidebar desktop) */}
                {tab.id === "online-orders" && pendingOnlineCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {pendingOnlineCount > 9 ? "9+" : pendingOnlineCount}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}

          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Gestion
          </p>
          {tabs.filter(t => ["history", "pipeline", "invoices", "debts", "purchases", "stats"].includes(t.id)).map((tab) => {
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
                  w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg
                  transition-all duration-150 min-h-[36px] font-medium text-[13px] relative overflow-hidden mb-0.5
                  ${isActive ? "bg-white text-slate-900 shadow-md" : "text-white/90 hover:bg-white/15 hover:text-white"}
                `}
              >
                {isActive && (
                  <span className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.gradient}`} />
                )}
                <Icon
                  className="w-4 h-4 relative z-10 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={isActive ? { color: tab.color } : undefined}
                />
                <span className="relative z-10 truncate">{tab.label}</span>
                {/* Badge notifications commandes en ligne (sidebar desktop) */}
                {tab.id === "online-orders" && pendingOnlineCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {pendingOnlineCount > 9 ? "9+" : pendingOnlineCount}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: tab.color }}
                  />
                )}
              </button>
            );
          })}

          <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-white/50 uppercase tracking-wider">
            Avancé
          </p>
          {tabs.filter(t => ["team", "notifications", "analytics-ai", "accounting", "settings"].includes(t.id)).map((tab) => {
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
                  w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg
                  transition-all duration-150 min-h-[36px] font-medium text-[13px] relative overflow-hidden mb-0.5
                  ${isActive ? "bg-white text-slate-900 shadow-md" : "text-white/90 hover:bg-white/15 hover:text-white"}
                `}
              >
                {isActive && (
                  <span className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${tab.gradient}`} />
                )}
                <Icon
                  className="w-4 h-4 relative z-10 shrink-0"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  style={isActive ? { color: tab.color } : undefined}
                />
                <span className="relative z-10 truncate">{tab.label}</span>
                {/* Badge notifications commandes en ligne (sidebar desktop) */}
                {tab.id === "online-orders" && pendingOnlineCount > 0 && (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {pendingOnlineCount > 9 ? "9+" : pendingOnlineCount}
                  </span>
                )}
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-dot"
                    className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
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
