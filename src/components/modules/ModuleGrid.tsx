"use client";

import { ModuleCard } from "./ModuleCard";
import { motion } from "framer-motion";
import { MODULES_CONFIG, isModuleApplicable, type ModuleId } from "@/lib/modules/module-config";

interface ModuleWithState {
  id: string;
  name: string;
  description: string;
  icon: any;
  premium: boolean;
  defaultEnabled: boolean;
  applicableBusinessTypes: readonly string[];
  enabled: boolean;
  locked: boolean;
}

interface ModuleGridProps {
  modules: ModuleWithState[];
  onToggle: (moduleId: ModuleId, enabled: boolean) => void;
  /** businessType du tenant — filtre les modules visibles côté client */
  businessType?: string;
  /** true = superadmin → affiche TOUS les modules sans filtre */
  isAdmin?: boolean;
}

export function ModuleGrid({ modules, onToggle, businessType, isAdmin }: ModuleGridProps) {
  // RÈGLE 1 : Filtrer par applicableBusinessTypes côté client.
  // RÈGLE 3 : Le superadmin (isAdmin=true) voit TOUT sans filtre.
  const visibleModules = isAdmin
    ? modules
    : businessType
    ? modules.filter((m) => {
        const types = m.applicableBusinessTypes as readonly string[];
        return (
          types.includes("all") ||
          types.includes(businessType) ||
          businessType === "mixte" ||
          m.enabled
        );
      })
    : modules;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {visibleModules.map((mod, idx) => {
        const Icon = mod.icon;
        return (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <ModuleCard
              moduleId={mod.id}
              name={mod.name}
              description={mod.description}
              icon={Icon}
              enabled={mod.enabled}
              locked={mod.locked}
              premium={mod.premium}
              onToggle={(enabled) => onToggle(mod.id as ModuleId, enabled)}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
