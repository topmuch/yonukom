"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Puzzle,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  Crown,
  Search,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import {
  MODULES_CONFIG,
  MODULE_IDS,
  type ModuleId,
} from "@/lib/modules/module-config";
import {
  normalizeModules,
  type ModulesJson,
} from "@/lib/modules/module-utils";

// ============================================================
// YonuKom — Superadmin : Page Modules (onglet sidebar)
// Liste tous les tenants + permet de gérer leurs modules.
// ============================================================

interface TenantBasic {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  businessType: string;
  storeSlug?: string | null;
}

export function SuperadminModulesPage() {
  const [tenants, setTenants] = useState<TenantBasic[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modulesCache, setModulesCache] = useState<Record<string, ModulesJson>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch("/api/superadmin/tenants", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.tenants || [];
        setTenants(list.map((t: any) => ({
          id: t.id,
          name: t.name,
          ownerName: t.ownerName,
          ownerEmail: t.ownerEmail,
          businessType: t.businessType,
          storeSlug: t.storeSlug,
        })));
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const fetchModules = useCallback(async (tenantId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/modules`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setModulesCache((prev) => ({ ...prev, [tenantId]: data.modules }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleToggle = async (
    tenantId: string,
    moduleId: ModuleId,
    field: "enabled" | "locked",
    value: boolean
  ) => {
    // Optimistic
    setModulesCache((prev) => {
      const mods = prev[tenantId];
      if (!mods) return prev;
      return {
        ...prev,
        [tenantId]: {
          ...mods,
          [moduleId]: { ...mods[moduleId], [field]: value },
        },
      };
    });
    setSaving(tenantId + moduleId + field);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/modules`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ moduleId, [field]: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec");
      }
      const data = await res.json();
      setModulesCache((prev) => ({ ...prev, [tenantId]: data.modules }));
    } catch (err: any) {
      // Revert
      setModulesCache((prev) => {
        const mods = prev[tenantId];
        if (!mods) return prev;
        return {
          ...prev,
          [tenantId]: {
            ...mods,
            [moduleId]: { ...mods[moduleId], [field]: !value },
          },
        };
      });
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(null);
    }
  };

  const toggleExpand = (tenantId: string) => {
    setExpandedId((prev) => {
      if (prev === tenantId) return null;
      // Fetch modules if not cached
      if (!modulesCache[tenantId]) {
        fetchModules(tenantId);
      }
      return tenantId;
    });
  };

  const filtered = tenants.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.ownerName.toLowerCase().includes(q) ||
      t.ownerEmail.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-[#E91E63] animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement des tenants…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Puzzle className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold">Gestion des Modules</h2>
          <Badge variant="secondary" className="text-xs">
            {tenants.length} tenants
          </Badge>
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un tenant…"
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* Tenant list */}
      <div className="space-y-2">
        {filtered.map((tenant) => {
          const isExpanded = expandedId === tenant.id;
          const mods = modulesCache[tenant.id];
          const enabledCount = mods
            ? Object.values(mods).filter((m) => m.enabled).length
            : null;

          return (
            <Card key={tenant.id} className="overflow-hidden">
              {/* Tenant row (clickable) */}
              <button
                onClick={() => toggleExpand(tenant.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <div className="w-8 h-8 rounded-lg bg-[#E91E63]/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#E91E63]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{tenant.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {tenant.ownerName} · {tenant.ownerEmail}
                  </p>
                </div>
                {enabledCount !== null && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {enabledCount}/{MODULE_IDS.length} modules
                  </Badge>
                )}
              </button>

              {/* Expanded: modules list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-3 space-y-1.5 bg-muted/30">
                      {!mods ? (
                        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Chargement des modules…
                        </div>
                      ) : (
                        MODULE_IDS.map((id) => {
                          const config = MODULES_CONFIG[id];
                          const Icon = config.icon;
                          const mod = mods[id] || { enabled: config.defaultEnabled, locked: false };
                          const saveKey = tenant.id + id;
                          return (
                            <div
                              key={id}
                              className={`flex items-center gap-3 p-2 rounded-lg border ${
                                mod.enabled ? "border-primary/20 bg-primary/5" : "border-border"
                              }`}
                            >
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                  mod.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-semibold truncate">{config.name}</p>
                                  {config.premium && <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                                </div>
                              </div>
                              {/* Lock toggle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggle(tenant.id, id, "locked", !mod.locked);
                                }}
                                disabled={saving === saveKey + "locked"}
                                className={`shrink-0 p-1 rounded transition-colors ${
                                  mod.locked ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" : "text-muted-foreground hover:bg-muted"
                                }`}
                                title={mod.locked ? "Verrouillé" : "Déverrouillé"}
                              >
                                {saving === saveKey + "locked" ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : mod.locked ? (
                                  <Lock className="w-3 h-3" />
                                ) : (
                                  <Unlock className="w-3 h-3" />
                                )}
                              </button>
                              {/* Enabled toggle */}
                              <Switch
                                checked={mod.enabled}
                                onCheckedChange={(v) => handleToggle(tenant.id, id, "enabled", v)}
                                disabled={saving === saveKey + "enabled"}
                                className="shrink-0"
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
