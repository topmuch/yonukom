"use client";

import { useModulesStore } from "@/stores/use-modules-store";
import type { ModuleId } from "@/lib/modules/module-config";

// ============================================================
// YonuKom — ModuleGuard : masque les features des modules désactivés
// Utilisation :
//   <ModuleGuard moduleId="ecommerce" fallback={<UpgradePrompt />}>
//     <EcommerceDashboard />
//   </ModuleGuard>
// ============================================================

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
  /** Affiché si le module est désactivé (null par défaut = rien) */
  fallback?: React.ReactNode;
}

export function ModuleGuard({ moduleId, children, fallback = null }: ModuleGuardProps) {
  const enabled = useModulesStore((s) => s.isModuleEnabled(moduleId));

  if (!enabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
