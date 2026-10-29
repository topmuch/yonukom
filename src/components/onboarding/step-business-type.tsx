// ============================================================
// YonuKom — Étape 1 : Type de Business
// "Quel type de commerce avez-vous ?"
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { BusinessType } from "@/types";
import { BUSINESS_TYPE_LABELS } from "@/types";
import type { OnboardingBusinessType } from "@/types/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Building2,
  UtensilsCrossed,
  Layers,
  Smartphone,
  Radio,
} from "lucide-react";

const BUSINESS_ICONS: Record<BusinessType, React.ReactNode> = {
  ecommerce_social: <ShoppingBag className="w-8 h-8" />,
  pipeline_b2b: <Building2 className="w-8 h-8" />,
  restaurant: <UtensilsCrossed className="w-8 h-8" />,
  mixte: <Layers className="w-8 h-8" />,
};

const BUSINESS_DESCRIPTIONS: Record<BusinessType, string> = {
  ecommerce_social:
    "Vendez sur TikTok, Facebook, WhatsApp. Saisie ultra-rapide, suivi Kanban, lien WhatsApp auto.",
  pipeline_b2b:
    "Flux Devis → Validation → BL → Facture. Gestion acomptes, stock réservé, B2B.",
  restaurant:
    "Plats finis, vente rapide, déclaration de perte. Simple et efficace.",
  mixte:
    "Activez tous les modules. Pour les commerçants multi-activités.",
};

const BUSINESS_TYPES: BusinessType[] = [
  "ecommerce_social",
  "pipeline_b2b",
  "restaurant",
  "mixte",
];

export function StepBusinessType() {
  const businessType = useOnboardingStore((s) => s.businessType);
  const setBusinessType = useOnboardingStore((s) => s.setBusinessType);

  const selectedType = businessType?.type ?? null;

  const handleSelect = (type: BusinessType) => {
    const data: OnboardingBusinessType = {
      type,
      subTypes: [],
      sellOnSocialMedia: type === "ecommerce_social" || type === "mixte",
      liveSelling: false,
    };
    setBusinessType(data);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Quel type de commerce avez-vous ?
        </h2>
        <p className="text-muted-foreground">
          YonuKom s&apos;adapte à votre business. Choisissez le profil le plus proche.
        </p>
      </div>

      {/* Grille de cartes — Mobile-first : 1 col, md: 2 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {BUSINESS_TYPES.map((type) => {
          const isSelected = selectedType === type;

          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect(type)}
              className="touch-target w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-200 border-2 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-transparent hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div
                    className={`p-3 rounded-xl ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {BUSINESS_ICONS[type]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base">{BUSINESS_TYPE_LABELS[type]}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {BUSINESS_DESCRIPTIONS[type]}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Options supplémentaires si e-com social ou mixte */}
      {(selectedType === "ecommerce_social" || selectedType === "mixte") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 p-4 bg-muted/50 rounded-xl"
        >
          <h4 className="font-medium text-sm">Options E-Commerce Social</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer touch-target">
              <Checkbox
                checked={businessType?.sellOnSocialMedia ?? false}
                onCheckedChange={(checked) => {
                  if (businessType) {
                    setBusinessType({
                      ...businessType,
                      sellOnSocialMedia: !!checked,
                    });
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Vente via réseaux sociaux</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer touch-target">
              <Checkbox
                checked={businessType?.liveSelling ?? false}
                onCheckedChange={(checked) => {
                  if (businessType) {
                    setBusinessType({
                      ...businessType,
                      liveSelling: !!checked,
                    });
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Live selling (vente en direct)</span>
              </div>
            </label>
          </div>
        </motion.div>
      )}
    </div>
  );
}
