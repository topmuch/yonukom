// ============================================================
// YonuKom — Store Zustand : Superadmin Dashboard
// Gère la navigation, les tenants, les métriques plateforme,
// l'impersonation et les filtres du dashboard superadmin
// ============================================================

import { create } from "zustand";
import type {
  SuperadminPage,
  TenantInfo,
  PlatformMetrics,
  ImpersonationState,
} from "@/types";

// --- Clé localStorage pour l'impersonation ---
const IMPERSONATION_KEY = "yonukom_impersonation";

// --- Type des logs plateforme ---
export interface PlatformLogEntry {
  id: string;
  level: string;
  category: string;
  message: string;
  metadata?: string;
  createdAt: string;
}

// --- Interface du store ---

interface SuperadminState {
  // Navigation
  activePage: SuperadminPage;
  setActivePage: (page: SuperadminPage) => void;

  // Selected tenant for detail view
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;

  // Tenants data
  tenants: TenantInfo[];
  setTenants: (tenants: TenantInfo[]) => void;
  tenantsLoading: boolean;
  setTenantsLoading: (loading: boolean) => void;

  // Platform metrics
  metrics: PlatformMetrics | null;
  setMetrics: (metrics: PlatformMetrics | null) => void;
  metricsLoading: boolean;
  setMetricsLoading: (loading: boolean) => void;

  // Platform logs
  platformLogs: PlatformLogEntry[];
  setPlatformLogs: (logs: PlatformLogEntry[]) => void;

  // Impersonation
  impersonation: ImpersonationState;
  startImpersonation: (tenantId: string, tenantName: string) => void;
  endImpersonation: () => void;

  // Search/filter
  tenantSearch: string;
  setTenantSearch: (search: string) => void;
  subscriptionFilter: string; // "all" | "active" | "expired" | "past_due" | "cancelled"
  setSubscriptionFilter: (filter: string) => void;
}

// --- Hydratation de l'impersonation depuis localStorage ---
function hydrateImpersonation(): ImpersonationState {
  if (typeof window === "undefined") {
    return {
      isImpersonating: false,
      tenantId: null,
      tenantName: null,
      startedAt: null,
    };
  }

  try {
    const stored = localStorage.getItem(IMPERSONATION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ImpersonationState;
      if (parsed.isImpersonating && parsed.tenantId && parsed.tenantName) {
        return parsed;
      }
    }
  } catch {
    localStorage.removeItem(IMPERSONATION_KEY);
  }

  return {
    isImpersonating: false,
    tenantId: null,
    tenantName: null,
    startedAt: null,
  };
}

// --- Store ---

export const useSuperadminStore = create<SuperadminState>((set) => ({
  // Navigation
  activePage: "overview",
  setActivePage: (page) => set({ activePage: page }),

  // Selected tenant
  selectedTenantId: null,
  setSelectedTenantId: (id) => set({ selectedTenantId: id }),

  // Tenants
  tenants: [],
  setTenants: (tenants) => set({ tenants }),
  tenantsLoading: false,
  setTenantsLoading: (loading) => set({ tenantsLoading: loading }),

  // Metrics
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
  metricsLoading: false,
  setMetricsLoading: (loading) => set({ metricsLoading: loading }),

  // Platform logs
  platformLogs: [],
  setPlatformLogs: (logs) => set({ platformLogs: logs }),

  // Impersonation — hydraté depuis localStorage
  impersonation: hydrateImpersonation(),

  startImpersonation: (tenantId, tenantName) => {
    const impersonation: ImpersonationState = {
      isImpersonating: true,
      tenantId,
      tenantName,
      startedAt: new Date().toISOString(),
    };
    set({ impersonation });
    if (typeof window !== "undefined") {
      localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonation));
    }
  },

  endImpersonation: () => {
    const impersonation: ImpersonationState = {
      isImpersonating: false,
      tenantId: null,
      tenantName: null,
      startedAt: null,
    };
    set({ impersonation });
    if (typeof window !== "undefined") {
      localStorage.removeItem(IMPERSONATION_KEY);
    }
  },

  // Search / filter
  tenantSearch: "",
  setTenantSearch: (search) => set({ tenantSearch: search }),
  subscriptionFilter: "all",
  setSubscriptionFilter: (filter) => set({ subscriptionFilter: filter }),
}));
