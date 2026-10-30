// ============================================================
// YonuKom — Étape 1 : Type de Business (Onboarding V3)
// 8 métiers spécifiques (boutique, fast-food, restaurant, salon,
// cosmétiques, grossiste, tiktok, vente ambulante).
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
  Store,
  Sandwich,
  UtensilsCrossed,
  Scissors,
  Sparkles,
  Boxes,
  Smartphone,
  Bike,
  Radio,
} from "lucide-react";

// Icônes Lucide pour les 8 métiers (record indexé par BusinessType).
const BUSINESS_ICONS: Record<BusinessType, React.ReactNode> = {
  retail_shop: <Store className="w-8 h-8" />,
  fast_food: <Sandwich className="w-8 h-8" />,
  restaurant: <UtensilsCrossed className="w-8 h-8" />,
  salon: <Scissors className="w-8 h-8" />,
  cosmetics: <Sparkles className="w-8 h-8" />,
  wholesaler: <Boxes className="w-8 h-8" />,
  tiktok_seller: <Smartphone className="w-8 h-8" />,
  mobile_vendor: <Bike className="w-8 h-8" />,
  // Legacy (non affichées dans la grille mais gardées pour Record complet)
  ecommerce_social: <Smartphone className="w-8 h-8" />,
  pipeline_b2b: <Boxes className="w-8 h-8" />,
  mixte: <Sparkles className="w-8 h-8" />,
};

const BUSINESS_DESCRIPTIONS: Record<BusinessType, string> = {
  retail_shop:
    "Vente de produits au détail. Suivi de stock, code-barres, alertes de rupture.",
  fast_food:
    "Vente rapide de repas et combos. Interface optimisée pour le rush. (Combos/Menus à venir)",
  restaurant:
    "Vente de plats et boissons. Déclaration de perte, plats finis, maquis.",
  salon:
    "Vente de services et produits. Pas de stock déduit pour les prestations, durée estimée.",
  cosmetics:
    "Vente de produits et soins. Catalogue beauté, fidélité client.",
  wholesaler:
    "Vente en gros B2B. Devis → BL → Facture, acomptes, stock réservé.",
  tiktok_seller:
    "Vente via réseaux sociaux. Kanban de commandes, lien WhatsApp auto, live selling.",
  mobile_vendor:
    "Vente en déplacement. Saisie ultra-rapide, mode hors-ligne, ticket mobile.",
  // Legacy
  ecommerce_social:
    "Vendez sur TikTok, Facebook, WhatsApp. Saisie ultra-rapide, suivi Kanban.",
  pipeline_b2b:
    "Flux Devis → Validation → BL → Facture. Gestion acomptes, stock réservé, B2B.",
  mixte: "Activez tous les modules. Pour les commerçants multi-activités.",
};

// Les 8 métiers affichés dans la grille d'onboarding (ordre = ordre d'affichage).
// Les types legacy (ecommerce_social, pipeline_b2b, mixte) ne sont pas affichés
// mais restent valides pour les configs existantes (rétro-compatibilité).
const BUSINESS_TYPES: BusinessType[] = [
  "retail_shop",
  "fast_food",
  "restaurant",
  "salon",
  "cosmetics",
  "wholesaler",
  "tiktok_seller",
  "mobile_vendor",
];

// Métiers orientés "vente sociale / en ligne" → options e-com affichées.
const ECOM_OPTIONS_TYPES: BusinessType[] = [
  "tiktok_seller",
  "mobile_vendor",
  "ecommerce_social",
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
      // Les métiers "vente en ligne / mobile" activent la vente sociale par défaut.
      sellOnSocialMedia: ECOM_OPTIONS_TYPES.includes(type),
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

      {/* Grille de cartes — Mobile-first : 1 col, sm: 2 cols, lg: 3 cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {BUSINESS_TYPES.map((type, idx) => {
          const isSelected = selectedType === type;

          return (
            <motion.button
              key={type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
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

      {/* Options E-Commerce Social — pour les métiers en ligne / mobile */}
      {selectedType && ECOM_OPTIONS_TYPES.includes(selectedType) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 p-4 bg-muted/50 rounded-xl"
        >
          <h4 className="font-medium text-sm">Options Vente en Ligne / Social</h4>
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
                <span className="text-sm">Vente via réseaux sociaux (TikTok, Facebook, WhatsApp)</span>
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
                <span className="text-sm">Live selling (vente en direct / streaming)</span>
              </div>
            </label>
          </div>
        </motion.div>
      )}

      {/* Note Salon : rappelle que les services n'ont pas de stock */}
      {selectedType === "salon" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground text-center"
        >
          💡 Pour les salons : créez des <strong>Services</strong> (coiffure, soin) sans stock
          et des <strong>Produits</strong> (shampoing, accessoires) avec stock. Le toggle
          Produit/Service est disponible dans le formulaire d&apos;article.
        </motion.div>
      )}
    </div>
  );
}
