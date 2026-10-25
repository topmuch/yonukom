// ============================================================
// YonuKom — Étape 2 : Équipe & Rôles
// "Qui travaille dans votre business ?"
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { OnboardingTeam } from "@/types/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { Users, UserCircle, ShieldCheck, Store } from "lucide-react";

const ROLE_OPTIONS = [
  {
    role: "patron" as const,
    label: "Patron",
    description: "Accès total — voit tout, gère tout",
    icon: <ShieldCheck className="w-5 h-5" />,
  },
  {
    role: "gerant" as const,
    label: "Gérant",
    description: "Gère le stock et la caisse",
    icon: <UserCircle className="w-5 h-5" />,
  },
  {
    role: "vendeur" as const,
    label: "Vendeur",
    description: "Enregistre les ventes uniquement",
    icon: <Store className="w-5 h-5" />,
  },
];

export function StepTeam() {
  const team = useOnboardingStore((s) => s.team);
  const setTeam = useOnboardingStore((s) => s.setTeam);

  const teamSize = team?.teamSize ?? 1;
  const roles = team?.roles ?? ["patron"];
  const needCashRegister = team?.needCashRegister ?? false;

  // Initialiser avec les valeurs par défaut si pas encore fait
  const ensureTeam = (overrides?: Partial<OnboardingTeam>) => {
    const current: OnboardingTeam = {
      teamSize,
      roles,
      needCashRegister,
      ...overrides,
    };
    setTeam(current);
  };

  const toggleRole = (role: "patron" | "gerant" | "vendeur") => {
    const currentRoles = team?.roles ?? ["patron"];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    // Toujours garder au moins le patron
    if (!newRoles.includes("patron")) return;

    ensureTeam({ roles: newRoles });
  };

  const update = (partial: Partial<OnboardingTeam>) => {
    ensureTeam(partial);
  };



  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Qui travaille dans votre business ?
        </h2>
        <p className="text-muted-foreground">
          Définissez les rôles pour sécuriser l&apos;accès à vos données.
        </p>
      </div>

      {/* Taille de l'équipe */}
      <div className="space-y-3">
        <Label htmlFor="team-size" className="text-sm font-medium">
          Nombre de personnes dans l&apos;équipe
        </Label>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <Input
            id="team-size"
            type="number"
            min={1}
            max={50}
            value={teamSize}
            onChange={(e) => update({ teamSize: Math.max(1, parseInt(e.target.value) || 1) })}
            className="max-w-[100px] text-center text-lg font-semibold"
          />
          <span className="text-sm text-muted-foreground">personne{teamSize > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Rôles */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Rôles à créer</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLE_OPTIONS.map((option) => {
            const isSelected = roles.includes(option.role);

            return (
              <motion.button
                key={option.role}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleRole(option.role)}
                className="touch-target w-full"
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 border-2 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {option.icon}
                    </div>
                    <h4 className="font-semibold text-sm">{option.label}</h4>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Clôture de caisse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-muted/50 rounded-xl space-y-3"
      >
        <h4 className="font-medium text-sm">Options de caisse</h4>
        <label className="flex items-center gap-3 cursor-pointer touch-target">
          <Checkbox
            checked={needCashRegister}
            onCheckedChange={(checked) => update({ needCashRegister: !!checked })}
          />
          <div>
            <span className="text-sm font-medium">Clôture de caisse quotidienne</span>
            <p className="text-xs text-muted-foreground">
              Calcul automatique des écarts entre montant théorique et réel
            </p>
          </div>
        </label>
      </motion.div>
    </div>
  );
}
