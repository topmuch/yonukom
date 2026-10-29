// ============================================================
// YonuKom — Étape 4 : Gestion du Stock
// "Comment gérez-vous votre stock ?"
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import type { OnboardingStock } from "@/types/onboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  Lock,
  PackageCheck,
} from "lucide-react";

export function StepStock() {
  const stock = useOnboardingStore((s) => s.stock);
  const setStock = useOnboardingStore((s) => s.setStock);
  const businessType = useOnboardingStore((s) => s.businessType);

  const trackStock = stock?.trackStock ?? true;
  const lowStockAlert = stock?.lowStockAlert ?? true;
  const alertThreshold = stock?.alertThreshold ?? 5;
  const manageReservations = stock?.manageReservations ?? false;

  const isB2B = businessType?.type === "pipeline_b2b" || businessType?.type === "mixte";

  const update = (partial: Partial<OnboardingStock>) => {
    setStock({
      trackStock,
      lowStockAlert,
      alertThreshold,
      manageReservations,
      ...partial,
    });
  };



  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Comment gérez-vous votre stock ?
        </h2>
        <p className="text-muted-foreground">
          YonuKom peut suivre votre stock automatiquement à chaque vente.
        </p>
      </div>

      {/* Suivi du stock — Oui/Non */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => update({ trackStock: true })}
          className="touch-target w-full"
        >
          <Card className={`cursor-pointer transition-all duration-200 border-2 ${
            trackStock
              ? "border-primary bg-primary/5 shadow-md"
              : "border-transparent hover:border-primary/30"
          }`}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-xl ${trackStock ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <PackageCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold">Oui, suivre le stock</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Chaque vente déduit automatiquement le stock
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => update({ trackStock: false, lowStockAlert: false })}
          className="touch-target w-full"
        >
          <Card className={`cursor-pointer transition-all duration-200 border-2 ${
            !trackStock
              ? "border-primary bg-primary/5 shadow-md"
              : "border-transparent hover:border-primary/30"
          }`}>
            <CardContent className="p-5 flex flex-col items-center text-center gap-3">
              <div className={`p-3 rounded-xl ${!trackStock ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold">Non, pas de suivi</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous gérez le stock manuellement ou n&apos;en avez pas besoin
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.button>
      </div>

      {/* Options avancées si suivi activé */}
      {trackStock && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5 p-5 bg-muted/50 rounded-xl"
        >
          {/* Alerte stock bas */}
          <label className="flex items-start gap-3 cursor-pointer touch-target">
            <Checkbox
              checked={lowStockAlert}
              onCheckedChange={(checked) => update({ lowStockAlert: !!checked })}
              className="mt-1"
            />
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yk-amber shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium">Alerte stock bas</span>
                <p className="text-xs text-muted-foreground">
                  Notification quand le stock passe en dessous du seuil
                </p>
              </div>
            </div>
          </label>

          {/* Seuil d'alerte */}
          {lowStockAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 pl-8"
            >
              <Label className="text-sm font-medium">
                Seuil d&apos;alerte : <span className="text-primary font-bold">{alertThreshold} unités</span>
              </Label>
              <Slider
                value={[alertThreshold]}
                onValueChange={([val]) => update({ alertThreshold: val })}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>50</span>
              </div>
            </motion.div>
          )}

          {/* Stock réservé B2B */}
          {isB2B && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <label className="flex items-start gap-3 cursor-pointer touch-target">
                <Checkbox
                  checked={manageReservations}
                  onCheckedChange={(checked) => update({ manageReservations: !!checked })}
                  className="mt-1"
                />
                <div className="flex items-start gap-2">
                  <Lock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Gérer le stock réservé</span>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Un devis validé réserve le stock sans le déduire physiquement.
                      Stock disponible = Stock physique - Stock réservé
                    </p>
                  </div>
                </div>
              </label>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
