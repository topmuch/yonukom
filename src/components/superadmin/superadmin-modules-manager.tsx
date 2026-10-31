"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Puzzle, Lock, Unlock, Crown } from "lucide-react";
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
// YonuKom — Superadmin : Gestionnaire de modules d'un tenant
// Affiché dans le panneau de détail tenant. Le superadmin peut :
// - Activer/désactiver chaque module (enabled)
// - Verrouiller/déverrouiller (locked) — empêche le client de modifier
// ============================================================

interface SuperadminModulesManagerProps {
  tenantId: string;
}

export function SuperadminModulesManager({ tenantId }: SuperadminModulesManagerProps) {
  const [modules, setModules] = useState<ModulesJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchModules = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/modules`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleUpdate = async (moduleId: ModuleId, field: "enabled" | "locked", value: boolean) => {
    if (!modules) return;
    // Optimistic
    setModules((prev) =>
      prev ? { ...prev, [moduleId]: { ...prev[moduleId], [field]: value } } : prev
    );
    setSaving(moduleId + field);
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
      setModules(data.modules);
      toast.success(
        field === "enabled"
          ? `Module ${value ? "activé" : "désactivé"}`
          : `Module ${value ? "verrouillé" : "déverrouillé"}`
      );
    } catch (err: any) {
      // Revert
      setModules((prev) =>
        prev ? { ...prev, [moduleId]: { ...prev[moduleId], [field]: !value } } : prev
      );
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement des modules…
      </div>
    );
  }

  if (!modules) {
    return <p className="text-sm text-muted-foreground">Impossible de charger les modules.</p>;
  }

  return (
    <div className="space-y-2">
      {MODULE_IDS.map((id) => {
        const config = MODULES_CONFIG[id];
        const Icon = config.icon;
        const mod = modules[id] || { enabled: config.defaultEnabled, locked: false };
        return (
          <div
            key={id}
            className={`flex items-center gap-3 p-2.5 rounded-lg border ${
              mod.enabled ? "border-primary/20 bg-primary/5" : "border-border"
            }`}
          >
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                mod.enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>

            {/* Name + badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold truncate">{config.name}</p>
                {config.premium && (
                  <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{config.description}</p>
            </div>

            {/* Lock toggle */}
            <button
              type="button"
              onClick={() => handleUpdate(id, "locked", !mod.locked)}
              disabled={saving === id + "locked"}
              className={`shrink-0 p-1.5 rounded-md transition-colors ${
                mod.locked
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={mod.locked ? "Verrouillé — cliquez pour déverrouiller" : "Déverrouillé — cliquez pour verrouiller"}
              aria-label={mod.locked ? "Déverrouiller le module" : "Verrouiller le module"}
            >
              {saving === id + "locked" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : mod.locked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Enabled toggle */}
            <Switch
              checked={mod.enabled}
              onCheckedChange={(v) => handleUpdate(id, "enabled", v)}
              disabled={saving === id + "enabled"}
              aria-label={`Activer ${config.name}`}
            />
          </div>
        );
      })}
    </div>
  );
}
