"use client";

import { ModuleCard } from "./ModuleCard";
import { motion } from "framer-motion";
import type { ModuleDefinition } from "@/lib/modules/module-config";
import type { ModuleId } from "@/lib/modules/module-config";

interface ModuleGridProps {
  modules: Array<ModuleDefinition & { enabled: boolean; locked: boolean }>;
  onToggle: (moduleId: ModuleId, enabled: boolean) => void;
}

export function ModuleGrid({ modules, onToggle }: ModuleGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {modules.map((mod, idx) => {
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
