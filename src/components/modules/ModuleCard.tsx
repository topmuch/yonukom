"use client";

import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ModuleCardProps {
  moduleId: string;
  name: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  locked: boolean;
  premium: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ModuleCard({
  moduleId,
  name,
  description,
  icon: Icon,
  enabled,
  locked,
  premium,
  onToggle,
}: ModuleCardProps) {
  const isDisabled = locked; // le client ne peut pas modifier un module verrouillé

  return (
    <div
      className={`relative rounded-2xl border p-4 transition-all ${
        enabled
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      } ${isDisabled ? "opacity-70" : "hover:shadow-md"}`}
    >
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        {premium && (
          <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-300 gap-0.5">
            <Crown className="w-2.5 h-2.5" />
            Premium
          </Badge>
        )}
        {locked && (
          <Badge className="text-[9px] px-1.5 py-0 h-4 bg-slate-200 text-slate-700 border border-slate-300 gap-0.5">
            <Lock className="w-2.5 h-2.5" />
            Verrouillé
          </Badge>
        )}
      </div>

      {/* Icône */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
          enabled ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Nom + description */}
      <h3 className="font-semibold text-sm pr-16">{name}</h3>
      <p className="text-xs text-muted-foreground mt-0.5 mb-3 leading-relaxed">
        {description}
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          {enabled ? "Activé" : "Désactivé"}
        </span>
        <Switch
          checked={enabled}
          disabled={isDisabled}
          onCheckedChange={onToggle}
          aria-label={`Activer le module ${name}`}
        />
      </div>

      {/* Message si verrouillé */}
      {locked && (
        <p className="text-[10px] text-muted-foreground mt-2 italic">
          Inclus dans votre abonnement — contactez-nous pour le modifier.
        </p>
      )}
    </div>
  );
}
