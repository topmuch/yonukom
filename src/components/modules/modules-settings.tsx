"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Puzzle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { useModulesStore } from "@/stores/use-modules-store";
import { ModuleGrid } from "./ModuleGrid";
import { getModulesWithState, type ModulesJson } from "@/lib/modules/module-utils";
import { MODULES_CONFIG, getRelevantModules, type ModuleId } from "@/lib/modules/module-config";

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
  const [saving, setSaving] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<string>("mixte");

  const fetchModules = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      // Récupérer les modules + le profil business (pour le type)
      const [modsRes, profileRes] = await Promise.all([
        fetch(`/api/tenant/modules?businessId=${encodeURIComponent(businessId)}`, { headers, credentials: "include" }),
        fetch(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`, { headers, credentials: "include" }),
      ]);
      if (modsRes.ok) {
        const data = await modsRes.json();
        setModules(data.modules);
      }
      if (profileRes.ok) {
        const profile = await profileRes.json();
        // Le type du business détermine quels modules sont pertinents
        if (profile.type) setBusinessType(profile.type);
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
      // Rafraîchir le store partagé (pour que la nav + ModuleGuard se mettent à jour)
      useModulesStore.getState().fetchModules(businessId);
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
  // Ne montrer que les modules pertinents au métier du client.
  // Un restaurant ne voit pas les modules salon, un salon ne voit pas
  // wholesale, etc. Le superadmin peut activer des modules non-pertinents
  // via sa page dédiée — dans ce cas ils apparaissent ici aussi.
  const relevantModuleIds = new Set(getRelevantModules(businessType));
  const visibleModules = modulesWithState.filter(
    (m) => relevantModuleIds.has(m.id) || m.enabled
  );
  const enabledCount = visibleModules.filter((m) => m.enabled).length;
  const lockedCount = visibleModules.filter((m) => m.locked).length;

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
                {enabledCount} activé{enabledCount > 1 ? "s" : ""} sur {visibleModules.length}
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
        <ModuleGrid modules={visibleModules} onToggle={handleToggle} />
      </CardContent>
    </Card>
  );
}
