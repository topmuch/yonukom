// ============================================================
// YonuKom — Étape 3 : Moyens de Paiement
// "Comment vos clients vous paient-ils ?"
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { OnboardingPayments } from "@/types/onboarding";
import type { PaymentMethod } from "@/types";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Banknote,
  Smartphone,
  CreditCard,
  FileText,
  ArrowRightLeft,
} from "lucide-react";

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-6 h-6" />,
  wave: <Smartphone className="w-6 h-6" />,
  orange_money: <Smartphone className="w-6 h-6" />,
  cb: <CreditCard className="w-6 h-6" />,
  cheque: <FileText className="w-6 h-6" />,
  virement: <ArrowRightLeft className="w-6 h-6" />,
};

// Ordre logique pour les commerçants sénégalais
const PAYMENT_ORDER: PaymentMethod[] = [
  "cash",
  "wave",
  "orange_money",
  "cb",
  "cheque",
  "virement",
];

// Couleurs spécifiques par méthode
const METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "bg-yk-emerald/10 text-yk-emerald",
  wave: "bg-blue-500/10 text-blue-600",
  orange_money: "bg-orange-500/10 text-orange-600",
  cb: "bg-purple-500/10 text-purple-600",
  cheque: "bg-muted text-muted-foreground",
  virement: "bg-muted text-muted-foreground",
};

export function StepPayments() {
  const payments = useOnboardingStore((s) => s.payments);
  const setPayments = useOnboardingStore((s) => s.setPayments);

  const methods = payments?.methods ?? ["cash"];
  const primaryMethod = payments?.primaryMethod ?? "cash";
  const waveNumber = payments?.waveNumber ?? "";
  const orangeMoneyNumber = payments?.orangeMoneyNumber ?? "";

  // Helper pour toujours écrire dans le store (même si pas encore initialisé)
  const ensurePayments = (overrides?: Partial<OnboardingPayments>) => {
    setPayments({
      methods,
      primaryMethod,
      waveNumber,
      orangeMoneyNumber,
      ...overrides,
    });
  };

  const toggleMethod = (method: PaymentMethod) => {
    const currentMethods = payments?.methods ?? ["cash"];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter((m) => m !== method)
      : [...currentMethods, method];

    // Toujours garder au moins un moyen de paiement
    if (newMethods.length === 0) return;

    // Si on retire le moyen principal, le remplacer par le premier disponible
    const currentPrimary = payments?.primaryMethod ?? "cash";
    const newPrimary = newMethods.includes(currentPrimary)
      ? currentPrimary
      : newMethods[0];

    ensurePayments({
      methods: newMethods,
      primaryMethod: newPrimary,
    });
  };

  const update = (partial: Partial<OnboardingPayments>) => {
    ensurePayments(partial);
  };



  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Comment vos clients vous paient-ils ?
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez les moyens de paiement que vous acceptez.
        </p>
      </div>

      {/* Grille de moyens de paiement */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PAYMENT_ORDER.map((method) => {
          const isSelected = methods.includes(method);
          const isPrimary = primaryMethod === method;

          return (
            <motion.button
              key={method}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggleMethod(method)}
              className="touch-target w-full"
            >
              <Card
                className={`cursor-pointer transition-all duration-200 border-2 relative ${
                  isPrimary
                    ? "border-yk-emerald bg-yk-emerald/5 shadow-md"
                    : isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-transparent hover:border-primary/20"
                }`}
              >
                {isPrimary && (
                  <div className="absolute top-2 right-2 text-[10px] font-bold bg-yk-emerald text-white px-1.5 py-0.5 rounded-full">
                    Principal
                  </div>
                )}
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`p-2 rounded-lg ${isSelected ? METHOD_COLORS[method] : "bg-muted text-muted-foreground"}`}>
                    {PAYMENT_ICONS[method]}
                  </div>
                  <h4 className="font-semibold text-sm">{PAYMENT_METHOD_LABELS[method]}</h4>
                </CardContent>
              </Card>
            </motion.button>
          );
        })}
      </div>

      {/* Sélection du moyen principal */}
      {methods.length > 1 && (
        <div className="p-4 bg-muted/50 rounded-xl space-y-3">
          <Label className="text-sm font-medium">Moyen de paiement principal</Label>
          <div className="flex flex-wrap gap-2">
            {methods.map((method) => (
              <button
                key={method}
                onClick={() => update({ primaryMethod: method })}
                className={`touch-target px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  primaryMethod === method
                    ? "bg-yk-emerald text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Numéros Wave / OM */}
      {methods.includes("wave") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="wave-number" className="text-sm font-medium flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
              <Smartphone className="w-3 h-3 text-blue-600" />
            </div>
            Numéro Wave
          </Label>
          <Input
            id="wave-number"
            type="tel"
            placeholder="77 123 45 67"
            value={waveNumber}
            onChange={(e) => update({ waveNumber: e.target.value })}
            className="text-lg"
          />
        </motion.div>
      )}

      {methods.includes("orange_money") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label htmlFor="om-number" className="text-sm font-medium flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center">
              <Smartphone className="w-3 h-3 text-orange-600" />
            </div>
            Numéro Orange Money
          </Label>
          <Input
            id="om-number"
            type="tel"
            placeholder="77 123 45 67"
            value={orangeMoneyNumber}
            onChange={(e) => update({ orangeMoneyNumber: e.target.value })}
            className="text-lg"
          />
        </motion.div>
      )}
    </div>
  );
}
