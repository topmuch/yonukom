// ============================================================
// YonuKom — Étape 5 : Matériel & Préférences
// "Quel matériel utilisez-vous ?"
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { OnboardingEquipment } from "@/types/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import {
  Printer,
  ScanBarcode,
  Globe,
} from "lucide-react";

const LANGUAGE_OPTIONS = [
  { code: "fr" as const, label: "Français", flag: "🇫🇷" },
  { code: "wo" as const, label: "Wolof", flag: "🇸🇳" },
  { code: "en" as const, label: "English", flag: "🇬🇧" },
];

export function StepEquipment() {
  const equipment = useOnboardingStore((s) => s.equipment);
  const setEquipment = useOnboardingStore((s) => s.setEquipment);

  const useReceiptPrinter = equipment?.useReceiptPrinter ?? false;
  const useBarcodeScanner = equipment?.useBarcodeScanner ?? false;
  const language = equipment?.language ?? "fr";

  const update = (partial: Partial<OnboardingEquipment>) => {
    setEquipment({
      useReceiptPrinter,
      useBarcodeScanner,
      language,
      currency: "XOF",
      ...partial,
    });
  };



  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Matériel & Préférences
        </h2>
        <p className="text-muted-foreground">
          Dernières questions pour personnaliser votre expérience.
        </p>
      </div>

      {/* Matériel */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base">Matériel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Imprimante ticket */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => update({ useReceiptPrinter: !useReceiptPrinter })}
            className="touch-target w-full"
          >
            <Card className={`cursor-pointer transition-all duration-200 border-2 ${
              useReceiptPrinter
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/30"
            }`}>
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${useReceiptPrinter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Printer className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Imprimante ticket</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impression automatique du reçu après chaque vente
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.button>

          {/* Scanner code-barres */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => update({ useBarcodeScanner: !useBarcodeScanner })}
            className="touch-target w-full"
          >
            <Card className={`cursor-pointer transition-all duration-200 border-2 ${
              useBarcodeScanner
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/30"
            }`}>
              <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                <div className={`p-3 rounded-xl ${useBarcodeScanner ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <ScanBarcode className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Scanner code-barres</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ajout rapide de produits par scan
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.button>
        </div>
      </div>

      {/* Langue de l'interface */}
      <div className="space-y-3">
        <h3 className="font-semibold text-base flex items-center gap-2">
          <Globe className="w-5 h-5 text-muted-foreground" />
          Langue de l&apos;interface
        </h3>
        <div className="flex flex-wrap gap-3">
          {LANGUAGE_OPTIONS.map((option) => (
            <motion.button
              key={option.code}
              whileTap={{ scale: 0.95 }}
              onClick={() => update({ language: option.code })}
              className="touch-target"
            >
              <Card className={`cursor-pointer transition-all duration-200 border-2 ${
                language === option.code
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-transparent hover:border-primary/30"
              }`}>
                <CardContent className="px-5 py-3 flex items-center gap-3">
                  <span className="text-2xl">{option.flag}</span>
                  <span className="font-medium text-sm">{option.label}</span>
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Résumé */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-yk-emerald/5 border border-yk-emerald/20 rounded-xl space-y-2"
      >
        <h4 className="font-semibold text-sm text-yk-emerald flex items-center gap-2">
          ✅ Configuration prête !
        </h4>
        <p className="text-xs text-muted-foreground">
          YonuKom va générer votre configuration personnalisée. Vous pourrez la modifier à tout moment
          dans les paramètres.
        </p>
      </motion.div>
    </div>
  );
}
