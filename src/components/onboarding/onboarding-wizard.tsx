// ============================================================
// YonuKom — Onboarding Wizard
// Flux en 5 étapes avec navigation, progress bar, animations
// ============================================================

"use client";

import { useOnboardingStore } from "@/stores/use-onboarding-store";
import { ONBOARDING_STEPS, ONBOARDING_STEP_LABELS } from "@/types/onboarding";
import type { OnboardingStep } from "@/types/onboarding";
import { StepBusinessType } from "./step-business-type";
import { StepTeam } from "./step-team";
import { StepPayments } from "./step-payments";
import { StepStock } from "./step-stock";
import { StepEquipment } from "./step-equipment";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Rocket,
} from "lucide-react";

// Mapping étape → composant
const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  business_type: StepBusinessType,
  team: StepTeam,
  payments: StepPayments,
  stock: StepStock,
  equipment: StepEquipment,
};

// Icônes d'étape
const STEP_ICONS: Record<OnboardingStep, string> = {
  business_type: "🏪",
  team: "👥",
  payments: "💳",
  stock: "📦",
  equipment: "⚙️",
};

export function OnboardingWizard() {
  // --- État du store (sélecteurs atomiques pour le re-render) ---
  const currentStepIndex = useOnboardingStore((s) => s.currentStepIndex);
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const isSubmitting = useOnboardingStore((s) => s.isSubmitting);
  const submitError = useOnboardingStore((s) => s.submitError);
  const businessType = useOnboardingStore((s) => s.businessType);
  const team = useOnboardingStore((s) => s.team);
  const payments = useOnboardingStore((s) => s.payments);
  const stock = useOnboardingStore((s) => s.stock);
  const equipment = useOnboardingStore((s) => s.equipment);

  // --- Actions ---
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const submit = useOnboardingStore((s) => s.submit);

  // --- Valeurs dérivées (calculées à chaque render) ---
  const step = ONBOARDING_STEPS[currentStepIndex];
  const StepComponent = STEP_COMPONENTS[step];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;
  const progressValue = Math.round(((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100);

  // canGoNext : vérifie si l'étape courante a ses données remplies
  const canGoNext = (() => {
    switch (currentStepIndex) {
      case 0: return businessType !== null;
      case 1: return team !== null;
      case 2: return payments !== null;
      case 3: return stock !== null;
      case 4: return equipment !== null;
      default: return false;
    }
  })();

  const canGoPrev = currentStepIndex > 0;

  // Écran de succès après onboarding
  if (isCompleted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <ConnectivityBanner />
        <main className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="text-center space-y-6 max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
              className="mx-auto w-20 h-20 rounded-full bg-yk-emerald flex items-center justify-center"
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                YonuKom est prêt !
              </h1>
              <p className="text-muted-foreground text-lg">
                Votre espace est configuré. Bienvenue dans votre nouveau compagnon de gestion.
              </p>
            </div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                size="lg"
                className="touch-target w-full sm:w-auto px-8 text-lg bg-yk-emerald hover:bg-yk-emerald/90 text-white"
                onClick={() => window.location.reload()}
              >
                Accéder à mon espace
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConnectivityBanner />

      {/* Header avec logo et progress */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
          {/* Logo + titre */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">YK</span>
              </div>
              <span className="font-bold text-lg text-foreground">YonuKom</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Étape {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <Progress value={progressValue} className="h-2" />

          {/* Steps indicators */}
          <div className="flex justify-between">
            {ONBOARDING_STEPS.map((stepKey, i) => {
              const isCurrent = i === currentStepIndex;
              const isPast = i < currentStepIndex;

              return (
                <div
                  key={stepKey}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    isCurrent
                      ? "text-primary font-semibold"
                      : isPast
                      ? "text-yk-emerald"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <span>{STEP_ICONS[stepKey]}</span>
                  )}
                  <span className="hidden sm:inline">
                    {ONBOARDING_STEP_LABELS[stepKey]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Contenu de l'étape */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <StepComponent />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer avec navigation */}
      <footer className="border-t border-border bg-card/80 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={!canGoPrev}
            className="touch-target"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>

          {isLastStep ? (
            <Button
              onClick={submit}
              disabled={!canGoNext || isSubmitting}
              className="touch-target bg-yk-emerald hover:bg-yk-emerald/90 text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuration...
                </>
              ) : (
                <>
                  Terminer
                  <Check className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canGoNext}
              className="touch-target min-w-[140px]"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Erreur de soumission */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-3"
          >
            <p className="text-sm text-destructive text-center">{submitError}</p>
          </motion.div>
        )}
      </footer>
    </div>
  );
}
