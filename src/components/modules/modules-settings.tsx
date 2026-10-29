"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Puzzle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { ModuleGrid } from "./ModuleGrid";
import { getModulesWithState, type ModulesJson } from "@/lib/modules/module-utils";
import type { ModuleId } from "@/lib/modules/module-config";

// ============================================================
// YonuKom — Paramètres des Modules (côté client / tenant)
// Affiché dans l'onglet Paramètres → section "Modules".
// Le client peut activer/désactiver les modules non-verrouillés.
// Les modules verrouillés (locked) sont grisés avec un badge.
// ============================================================

export function ModulesSettings() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const [modules, setModules] = useState<ModulesJson | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // moduleId being saved

  const fetchModules = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/tenant/modules?businessId=${encodeURIComponent(businessId)}`, {
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
  }, [businessId]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const handleToggle = async (moduleId: ModuleId, enabled: boolean) => {
    if (!businessId || !modules) return;
    // Optimistic UI : update immédiat
    setModules((prev) =>
      prev ? { ...prev, [moduleId]: { ...prev[moduleId], enabled } } : prev
    );
    setSaving(moduleId);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch("/api/tenant/modules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ businessId, moduleId, enabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec");
      }
      const data = await res.json();
      setModules(data.modules); // sync avec le serveur
      toast.success(`${enabled ? "Module activé" : "Module désactivé"}`);
    } catch (err: any) {
      // Revert optimistic update
      setModules((prev) =>
        prev ? { ...prev, [moduleId]: { ...prev[moduleId], enabled: !enabled } } : prev
      );
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement des modules…</span>
        </CardContent>
      </Card>
    );
  }

  if (!modules) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Impossible de charger les modules.
        </CardContent>
      </Card>
    );
  }

  const modulesWithState = getModulesWithState(modules);
  const enabledCount = modulesWithState.filter((m) => m.enabled).length;
  const lockedCount = modulesWithState.filter((m) => m.locked).length;

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Puzzle className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold text-base">Modules</h3>
              <p className="text-xs text-muted-foreground">
                {enabledCount} activé{enabledCount > 1 ? "s" : ""} sur {modulesWithState.length}
                {lockedCount > 0 && ` · ${lockedCount} verrouillé${lockedCount > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchModules} className="gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualiser
          </Button>
        </div>

        <p className="text-xs text-muted-foreground -mt-2">
          Activez ou désactivez les modules selon vos besoins. Les modules{" "}
          <span className="font-medium text-amber-700">Premium</span> nécessitent un
          abonnement supérieur. Les modules <span className="font-medium text-slate-700">Verrouillés</span>{" "}
          sont inclus dans votre offre et ne peuvent pas être désactivés.
        </p>

        {/* Grille de modules */}
        <ModuleGrid modules={modulesWithState} onToggle={handleToggle} />
      </CardContent>
    </Card>
  );
}
