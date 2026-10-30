// ============================================================
// YonuKom — Onboarding Wizard (Premium Edition)
// Split-screen layout : branding à gauche, formulaire à droite.
// Stepper numéroté 1-5, transitions animées, écran de succès
// avec confettis CSS. Inspiré des flows Stripe / Linear / Vercel.
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
import {
  StepIllustration,
  CelebrationIllustration,
} from "./step-illustrations";
import { Button } from "@/components/ui/button";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  Users,
  CreditCard,
  Package,
  Settings,
} from "lucide-react";

// --- Mapping étape → composant de formulaire ---
const STEP_COMPONENTS: Record<OnboardingStep, React.ComponentType> = {
  business_type: StepBusinessType,
  team: StepTeam,
  payments: StepPayments,
  stock: StepStock,
  equipment: StepEquipment,
};

// --- Métadonnées marketing affichées sur le panneau de branding (gauche) ---
const STEP_BRANDING: Record<
  OnboardingStep,
  { eyebrow: string; title: string; description: string; icon: React.ReactNode }
> = {
  business_type: {
    eyebrow: "Configuration",
    title: "Construisons votre espace ensemble",
    description:
      "Choisissez votre univers et YonuKom s'adapte instantanément à votre activité.",
    icon: <Settings className="w-4 h-4" />,
  },
  team: {
    eyebrow: "Collaboration",
    title: "Votre équipe, votre force",
    description:
      "Définissez les rôles et sécurisez l'accès à votre business en toute confiance.",
    icon: <Users className="w-4 h-4" />,
  },
  payments: {
    eyebrow: "Encaissement",
    title: "Encaissez sans limites",
    description:
      "Activez les moyens de paiement que vos clients utilisent au quotidien.",
    icon: <CreditCard className="w-4 h-4" />,
  },
  stock: {
    eyebrow: "Inventaire",
    title: "Pilotez votre stock en temps réel",
    description:
      "Suivez chaque produit et recevez des alertes intelligentes avant la rupture.",
    icon: <Package className="w-4 h-4" />,
  },
  equipment: {
    eyebrow: "Personnalisation",
    title: "Configurez votre caisse sur mesure",
    description:
      "Imprimante, scanner, langue : adaptez YonuKom à votre poste de travail.",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
};

interface OnboardingWizardProps {
  /** Appelé quand l'utilisateur clique sur "Accéder à mon espace" après l'onboarding réussi */
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
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

  // --- Valeurs dérivées ---
  const step = ONBOARDING_STEPS[currentStepIndex];
  const StepComponent = STEP_COMPONENTS[step];
  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

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

  // --- Écran de succès : célébration plein écran ---
  // Quand l'utilisateur clique sur "Accéder à mon espace", on sauvegarde la
  // config générée dans useConfigStore → isOnboarded passe à true → AppView
  // bascule du wizard vers le dashboard. (submit() ne fait que marquer
  // isCompleted=true SANS saveConfig, pour laisser le temps à SuccessScreen
  // de s'afficher.)
  if (isCompleted) {
    const enterDashboard = async () => {
      try {
        const config = useOnboardingStore.getState().generatedConfig;
        if (config) {
          const { useConfigStore } = await import("@/stores/use-config-store");
          useConfigStore.getState().saveConfig(config);
        }
      } catch {
        /* fallback */
      }
      // Si un onComplete externe est fourni, l'appeler aussi
      if (onComplete) onComplete();
    };
    return <SuccessScreen onComplete={enterDashboard} />;
  }

  const branding = STEP_BRANDING[step];

  return (
    <div className="min-h-screen flex flex-col bg-yk-surface">
      <ConnectivityBanner />

      {/* === SPLIT-SCREEN GRID === */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[42%_58%] lg:min-h-screen">
        {/* ===================================================
            PANNEAU BRANDING (gauche — desktop uniquement)
            =================================================== */}
        <BrandingPanel
          step={step}
          currentStepIndex={currentStepIndex}
          branding={branding}
        />

        {/* ===================================================
            PANNEAU FORMULAIRE (droite)
            =================================================== */}
        <main className="flex flex-col bg-white min-h-screen lg:min-h-0">
          {/* Header branding compact (mobile uniquement) */}
          <MobileBrandingHeader
            step={step}
            currentStepIndex={currentStepIndex}
            branding={branding}
          />

          {/* Stepper numéroté premium en haut du panneau formulaire */}
          <div className="px-6 sm:px-10 lg:px-14 pt-6 lg:pt-10">
            <NumberedStepper currentStepIndex={currentStepIndex} />
          </div>

          {/* Contenu de l'étape (avec transitions slide/fade) */}
          <div className="flex-1 px-6 sm:px-10 lg:px-14 py-7 lg:py-9 overflow-y-auto custom-scrollbar">
            <div className="max-w-xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                >
                  <StepComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer navigation (sticky) */}
          <footer className="sticky bottom-0 border-t border-border bg-white/85 backdrop-blur-md z-20">
            <div className="max-w-xl mx-auto w-full px-6 sm:px-10 lg:px-14 py-4 flex items-center justify-between gap-4">
              {/* Retour — bouton fantôme */}
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={!canGoPrev}
                className="touch-target text-foreground hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>

              {/* Zone d'erreur (centrée) */}
              <AnimatePresence>
                {submitError && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-destructive flex-1 text-center truncate"
                  >
                    {submitError}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Suivant / Terminer — bouton dégradé premium */}
              {isLastStep ? (
                <Button
                  onClick={submit}
                  disabled={!canGoNext || isSubmitting}
                  className="touch-target min-w-[170px] text-white shadow-lg shadow-[#338BE2]/30 transition-all hover:shadow-xl hover:shadow-[#338BE2]/40 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
                  style={{
                    background:
                      "linear-gradient(135deg, #338BE2 0%, #2074C6 100%)",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Configuration...
                    </>
                  ) : (
                    <>
                      Terminer la configuration
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Passer — visible sur les étapes optionnelles (pas l'étape 1
                      business_type qui est obligatoire). Signale que l'étape
                      peut être ignorée (les valeurs par défaut seront utilisées). */}
                  {currentStepIndex >= 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextStep}
                      className="text-muted-foreground hover:text-foreground text-xs"
                      title="Passer cette étape — les valeurs par défaut seront utilisées"
                    >
                      Passer
                    </Button>
                  )}
                  <Button
                    onClick={nextStep}
                    disabled={!canGoNext}
                    className="touch-target min-w-[150px] text-white shadow-lg shadow-[#338BE2]/30 transition-all hover:shadow-xl hover:shadow-[#338BE2]/40 hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-none"
                    style={{
                      background:
                        "linear-gradient(135deg, #338BE2 0%, #2074C6 100%)",
                    }}
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ============================================================
// PANNEAU BRANDING (gauche) — dégradé bleu + illustration + orbes
// ============================================================
function BrandingPanel({
  step,
  currentStepIndex,
  branding,
}: {
  step: OnboardingStep;
  currentStepIndex: number;
  branding: {
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ReactNode;
  };
}) {
  return (
    <aside
      className="hidden lg:flex lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] flex-col justify-between overflow-hidden p-10 xl:p-14 relative"
      style={{
        background:
          "linear-gradient(135deg, #338BE2 0%, #2074C6 55%, #1B5FA8 100%)",
      }}
    >
      {/* Orbes décoratifs (glassmorphism) */}
      <DecorativeOrbs />

      {/* Logo YonuKom en haut */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-lg shadow-black/10">
          <span className="text-white font-bold text-base tracking-tight">YK</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-xl text-white tracking-tight">YonuKom</span>
          <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">
            Configuration guidée
          </span>
        </div>
      </motion.div>

      {/* Contenu central : eyebrow, titre, description, illustration */}
      <div className="relative z-10 max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Eyebrow + numéro d'étape */}
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm ring-1 ring-white/25">
                {branding.icon}
                {branding.eyebrow}
              </span>
              <span className="text-xs font-mono text-white/60 tabular-nums">
                {String(currentStepIndex + 1).padStart(2, "0")} / {String(ONBOARDING_STEPS.length).padStart(2, "0")}
              </span>
            </div>

            {/* Titre marketing + description */}
            <div className="space-y-3">
              <h2 className="text-3xl xl:text-4xl font-bold text-white leading-[1.15] tracking-tight">
                {branding.title}
              </h2>
              <p className="text-white/75 text-base xl:text-lg leading-relaxed">
                {branding.description}
              </p>
            </div>

            {/* Illustration réelle de l'étape */}
            <div className="relative pt-2">
              <div
                className="absolute -inset-3 bg-white/15 blur-2xl rounded-3xl"
                aria-hidden
              />
              <StepIllustration
                step={step}
                className="relative w-full aspect-[16/10] rounded-2xl shadow-2xl ring-1 ring-white/20"
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stepper dots en bas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-10 flex items-center gap-3"
      >
        <div className="flex items-center gap-2">
          {ONBOARDING_STEPS.map((s, i) => {
            const isCurrent = i === currentStepIndex;
            const isPast = i < currentStepIndex;
            return (
              <motion.div
                key={s}
                layout
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: isCurrent ? 36 : 14,
                  backgroundColor: isCurrent
                    ? "#FFFFFF"
                    : isPast
                    ? "rgba(255,255,255,0.7)"
                    : "rgba(255,255,255,0.25)",
                }}
              />
            );
          })}
        </div>
        <span className="text-xs text-white/70 font-medium">
          {ONBOARDING_STEP_LABELS[step]}
        </span>
      </motion.div>
    </aside>
  );
}

// ============================================================
// ORBES DÉCORATIFS — effet glassmorphism sur panneau branding
// ============================================================
function DecorativeOrbs() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden
    >
      <motion.div
        animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -right-20 w-80 h-80 rounded-full blur-3xl opacity-40"
        style={{
          background: "radial-gradient(circle, #B7BEDA 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ y: [0, 22, 0], x: [0, -12, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
        }}
      />
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, #FFFFFF 0%, transparent 70%)",
        }}
      />
      {/* Motif grille subtil */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
    </div>
  );
}

// ============================================================
// HEADER BRANDING MOBILE — bandeau bleu compact en haut du panneau form
// ============================================================
function MobileBrandingHeader({
  step,
  currentStepIndex,
  branding,
}: {
  step: OnboardingStep;
  currentStepIndex: number;
  branding: {
    eyebrow: string;
    title: string;
    description: string;
    icon: React.ReactNode;
  };
}) {
  return (
    <div
      className="lg:hidden relative overflow-hidden px-6 pt-6 pb-5"
      style={{
        background: "linear-gradient(135deg, #338BE2 0%, #2074C6 100%)",
      }}
    >
      {/* Orbe décoratif */}
      <div
        className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-30"
        style={{
          background: "radial-gradient(circle, #B7BEDA 0%, transparent 70%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -bottom-10 -left-8 w-40 h-40 rounded-full blur-3xl opacity-25"
        style={{
          background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 space-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25">
            {branding.icon}
            {branding.eyebrow}
          </span>
          <span className="text-[11px] font-mono text-white/60 tabular-nums">
            {String(currentStepIndex + 1).padStart(2, "0")} / {String(ONBOARDING_STEPS.length).padStart(2, "0")}
          </span>
        </div>
        <h2 className="text-xl font-bold text-white leading-tight tracking-tight">
          {branding.title}
        </h2>
        <p className="text-white/75 text-sm leading-relaxed">
          {branding.description}
        </p>

        {/* Mini illustration */}
        <div className="pt-1">
          <StepIllustration
            step={step}
            className="w-full aspect-[16/8] rounded-xl shadow-lg ring-1 ring-white/20"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// STEPPER NUMÉROTÉ PREMIUM (1-5) avec ligne connective
// Completed = checkmark emerald, Current = blue filled, Upcoming = gray outline
// ============================================================
function NumberedStepper({ currentStepIndex }: { currentStepIndex: number }) {
  const progressWidth = useMemo(
    () =>
      currentStepIndex === 0
        ? 0
        : (currentStepIndex / (ONBOARDING_STEPS.length - 1)) * 100,
    [currentStepIndex],
  );

  return (
    <div className="max-w-xl mx-auto w-full">
      <div className="relative flex items-center justify-between">
        {/* Ligne de fond */}
        <div
          className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-border"
          aria-hidden
        />

        {/* Ligne de progression (emerald) */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] rounded-full"
          style={{ backgroundColor: "#10B981" }}
          initial={false}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          aria-hidden
        />

        {/* Cercles numérotés */}
        {ONBOARDING_STEPS.map((stepKey, i) => {
          const isCurrent = i === currentStepIndex;
          const isPast = i < currentStepIndex;

          const bg = isPast
            ? "#10B981"
            : isCurrent
            ? "#338BE2"
            : "#FFFFFF";
          const color = isPast || isCurrent ? "#FFFFFF" : "#94A3B8";
          const border =
            isPast || isCurrent ? "none" : "2px solid #E2E8F0";

          return (
            <div
              key={stepKey}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <motion.div
                initial={false}
                animate={{ scale: isCurrent ? 1.12 : 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
                className="relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ring-4 ring-white"
                style={{
                  backgroundColor: bg,
                  color,
                  border,
                  boxShadow: isCurrent
                    ? "0 8px 24px -6px rgba(51,139,226,0.55)"
                    : "none",
                }}
              >
                <AnimatePresence mode="wait">
                  {isPast ? (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 22,
                      }}
                    >
                      <Check className="w-5 h-5" strokeWidth={3} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="num"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="tabular-nums"
                    >
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Label (desktop uniquement) */}
              <span
                className={`hidden xl:block text-[11px] font-medium transition-colors -mt-0.5 ${
                  isCurrent
                    ? "text-foreground"
                    : isPast
                    ? "text-[#10B981]"
                    : "text-muted-foreground/60"
                }`}
              >
                {ONBOARDING_STEP_LABELS[stepKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// ÉCRAN DE SUCCÈS — célébration plein écran avec confettis CSS
// ============================================================
function SuccessScreen({ onComplete }: { onComplete?: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-yk-surface relative overflow-hidden">
      <ConnectivityBanner />

      {/* Halo d'arrière-plan */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 35%, rgba(51,139,226,0.08) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.08) 0%, transparent 50%)",
        }}
      />

      {/* Confettis animés */}
      <Confetti />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative max-w-lg w-full text-center space-y-7"
        >
          {/* Pastille de succès */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              boxShadow: "0 20px 60px -15px rgba(16,185,129,0.5)",
            }}
          >
            {/* Halo pulsé */}
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: "#10B981" }}
              aria-hidden
            />
            <Check className="relative w-12 h-12 text-white" strokeWidth={3} />
          </motion.div>

          {/* Eyebrow + titre + sous-titre */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 ring-1 ring-[#10B981]/20">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">
                Configuration terminée
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Bienvenue sur YonuKom !
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
              Votre espace est configuré avec succès. Bienvenue dans votre
              nouveau compagnon de gestion.
            </p>
          </motion.div>

          {/* Illustration de célébration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mx-auto max-w-sm"
          >
            <CelebrationIllustration className="w-full aspect-[16/9] rounded-2xl shadow-xl ring-1 ring-border" />
          </motion.div>

          {/* Bouton d'accès — dégradé premium */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              onClick={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  window.location.reload();
                }
              }}
              className="touch-target w-full sm:w-auto px-8 text-base text-white transition-all hover:-translate-y-0.5"
              style={{
                background:
                  "linear-gradient(135deg, #338BE2 0%, #2074C6 100%)",
                boxShadow: "0 15px 40px -10px rgba(51,139,226,0.5)",
              }}
            >
              Accéder à mon espace
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

// ============================================================
// CONFETTIS — animation CSS pure via framer-motion
// ============================================================
function Confetti() {
  // Couleurs de la palette YonuKom
  const colors = [
    "#338BE2",
    "#10B981",
    "#B7BEDA",
    "#FBBF24",
    "#F472B6",
    "#FFFFFF",
  ];

  // Génère 48 confettis avec positions / délais aléatoires stables
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.6 + Math.random() * 2,
        color: colors[i % colors.length],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 100,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "110vh",
            x: p.drift,
            rotate: p.rotate + 720,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: p.shape === "rect" ? `${p.size * 0.4}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === "rect" ? "2px" : "9999px",
          }}
        />
      ))}
    </div>
  );
}
