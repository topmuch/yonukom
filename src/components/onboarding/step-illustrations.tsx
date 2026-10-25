// ============================================================
// YonuKom — Illustrations SVG inline pour l'onboarding
// Remplacent les icônes lucide-react par des vraies illustrations
// ============================================================

import type { OnboardingStep } from "@/types/onboarding";

interface IllustrationProps {
  className?: string;
}

// --- Illustration grande (en-tête d'étape) ---

export function StepIllustration({
  step,
  className,
}: { step: OnboardingStep } & IllustrationProps) {
  switch (step) {
    case "business_type":
      return <ShopIllustration className={className} />;
    case "team":
      return <TeamIllustration className={className} />;
    case "payments":
      return <PaymentIllustration className={className} />;
    case "stock":
      return <InventoryIllustration className={className} />;
    case "equipment":
      return <GearIllustration className={className} />;
    default:
      return <ShopIllustration className={className} />;
  }
}

// --- Petite icône SVG (indicateur de progression en haut) ---

export function StepIndicatorIcon({
  step,
  className,
}: { step: OnboardingStep } & IllustrationProps) {
  switch (step) {
    case "business_type":
      return <ShopIcon className={className} />;
    case "team":
      return <TeamIcon className={className} />;
    case "payments":
      return <PaymentIcon className={className} />;
    case "stock":
      return <InventoryIcon className={className} />;
    case "equipment":
      return <GearIcon className={className} />;
    default:
      return <ShopIcon className={className} />;
  }
}

// ============================================================
// ILLUSTRATIONS COMPLÈTES (en-tête d'étape)
// ============================================================

function ShopIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Boutique"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shop-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B3A5C" />
          <stop offset="100%" stopColor="#2E5A87" />
        </linearGradient>
      </defs>
      {/* Awning */}
      <rect x="14" y="28" width="92" height="14" rx="3" fill="url(#shop-grad)" />
      <path d="M14 35 L26 42 L14 42 Z M26 42 L38 35 L50 42 L38 42 Z M50 42 L62 35 L74 42 L62 42 Z M74 42 L86 35 L98 42 L86 42 Z M98 42 L106 35 L106 42 Z" fill="#F59E0B" />
      {/* Building */}
      <rect x="20" y="42" width="80" height="60" rx="2" fill="#FFFFFF" stroke="#1B3A5C" strokeWidth="2" />
      {/* Door */}
      <rect x="52" y="70" width="16" height="32" rx="1" fill="#1B3A5C" />
      <circle cx="64" cy="86" r="1.2" fill="#F59E0B" />
      {/* Windows */}
      <rect x="28" y="52" width="18" height="14" rx="1" fill="#E0F2FE" stroke="#1B3A5C" strokeWidth="1.5" />
      <rect x="74" y="52" width="18" height="14" rx="1" fill="#E0F2FE" stroke="#1B3A5C" strokeWidth="1.5" />
      {/* Sign */}
      <rect x="40" y="18" width="40" height="10" rx="2" fill="#10B981" />
      <text x="60" y="26" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold" fontFamily="sans-serif">YK</text>
    </svg>
  );
}

function TeamIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Équipe"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="50" fill="#E0F2FE" />
      {/* Person 1 (left, patron) */}
      <circle cx="38" cy="48" r="10" fill="#1B3A5C" />
      <path d="M22 84 Q22 64 38 64 Q54 64 54 84 Z" fill="#1B3A5C" />
      <circle cx="38" cy="48" r="3" fill="#F59E0B" />
      {/* Person 2 (center, gerant) */}
      <circle cx="60" cy="44" r="11" fill="#2E5A87" />
      <path d="M42 86 Q42 64 60 64 Q78 64 78 86 Z" fill="#2E5A87" />
      {/* Person 3 (right, vendeur) */}
      <circle cx="82" cy="48" r="10" fill="#10B981" />
      <path d="M66 84 Q66 64 82 64 Q98 64 98 84 Z" fill="#10B981" />
      {/* Faces */}
      <circle cx="38" cy="46" r="0.8" fill="white" />
      <circle cx="40" cy="46" r="0.8" fill="white" />
      <circle cx="60" cy="42" r="0.8" fill="white" />
      <circle cx="62" cy="42" r="0.8" fill="white" />
      <circle cx="82" cy="46" r="0.8" fill="white" />
      <circle cx="84" cy="46" r="0.8" fill="white" />
    </svg>
  );
}

function PaymentIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Paiement"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pay-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0E9F6E" />
        </linearGradient>
      </defs>
      {/* Background */}
      <circle cx="60" cy="60" r="50" fill="#D1FAE5" />
      {/* Credit card */}
      <rect x="22" y="32" width="76" height="50" rx="6" fill="#1B3A5C" />
      <rect x="22" y="42" width="76" height="10" fill="url(#pay-grad)" />
      {/* Chip */}
      <rect x="30" y="56" width="14" height="10" rx="2" fill="#F59E0B" />
      <line x1="32" y1="59" x2="42" y2="59" stroke="#D97706" strokeWidth="0.6" />
      <line x1="32" y1="63" x2="42" y2="63" stroke="#D97706" strokeWidth="0.6" />
      {/* Card number lines */}
      <line x1="50" y1="60" x2="86" y2="60" stroke="#94A3B8" strokeWidth="2" />
      <line x1="50" y1="68" x2="74" y2="68" stroke="#94A3B8" strokeWidth="2" />
      {/* Coins */}
      <circle cx="88" cy="86" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      <text x="88" y="90" textAnchor="middle" fontSize="9" fill="#92400E" fontWeight="bold" fontFamily="sans-serif">F</text>
      <circle cx="32" cy="92" r="6" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
      {/* Mobile money symbol (phone) */}
      <rect x="46" y="84" width="14" height="22" rx="2" fill="#1B3A5C" />
      <line x1="46" y1="88" x2="60" y2="88" stroke="#10B981" strokeWidth="1" />
      <circle cx="53" cy="102" r="1" fill="#10B981" />
    </svg>
  );
}

function InventoryIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Inventaire"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <circle cx="60" cy="60" r="50" fill="#FEF3C7" />
      {/* Shelving */}
      <rect x="20" y="26" width="80" height="76" rx="2" fill="#FFFFFF" stroke="#1B3A5C" strokeWidth="2" />
      <line x1="20" y1="52" x2="100" y2="52" stroke="#1B3A5C" strokeWidth="2" />
      <line x1="20" y1="76" x2="100" y2="76" stroke="#1B3A5C" strokeWidth="2" />
      {/* Top shelf boxes */}
      <rect x="26" y="32" width="14" height="18" rx="1" fill="#F59E0B" />
      <rect x="44" y="34" width="14" height="16" rx="1" fill="#10B981" />
      <rect x="62" y="32" width="14" height="18" rx="1" fill="#1B3A5C" />
      <rect x="80" y="36" width="14" height="14" rx="1" fill="#2E5A87" />
      {/* Middle shelf boxes */}
      <rect x="26" y="58" width="18" height="16" rx="1" fill="#10B981" />
      <rect x="48" y="58" width="14" height="16" rx="1" fill="#F59E0B" />
      <rect x="66" y="60" width="16" height="14" rx="1" fill="#1B3A5C" />
      <rect x="86" y="58" width="10" height="16" rx="1" fill="#2E5A87" />
      {/* Bottom shelf boxes */}
      <rect x="26" y="82" width="20" height="18" rx="1" fill="#1B3A5C" />
      <rect x="50" y="84" width="16" height="16" rx="1" fill="#10B981" />
      <rect x="70" y="82" width="14" height="18" rx="1" fill="#F59E0B" />
      <rect x="88" y="86" width="8" height="14" rx="1" fill="#2E5A87" />
    </svg>
  );
}

function GearIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Matériel"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <circle cx="60" cy="60" r="50" fill="#E0F2FE" />
      {/* Receipt printer */}
      <rect x="20" y="42" width="36" height="40" rx="3" fill="#1B3A5C" />
      <rect x="26" y="24" width="24" height="22" fill="#FFFFFF" stroke="#1B3A5C" strokeWidth="1.5" />
      <line x1="29" y1="30" x2="47" y2="30" stroke="#94A3B8" strokeWidth="1" />
      <line x1="29" y1="34" x2="43" y2="34" stroke="#94A3B8" strokeWidth="1" />
      <line x1="29" y1="38" x2="47" y2="38" stroke="#94A3B8" strokeWidth="1" />
      <line x1="29" y1="42" x2="40" y2="42" stroke="#94A3B8" strokeWidth="1" />
      <rect x="26" y="68" width="24" height="6" rx="1" fill="#10B981" />
      <circle cx="50" cy="62" r="2" fill="#F59E0B" />
      {/* Barcode scanner */}
      <rect x="68" y="44" width="32" height="22" rx="3" fill="#2E5A87" />
      <rect x="72" y="48" width="24" height="14" rx="1" fill="#1B3A5C" />
      <line x1="76" y1="51" x2="92" y2="51" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="76" y1="54" x2="92" y2="54" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="76" y1="57" x2="92" y2="57" stroke="#F59E0B" strokeWidth="0.6" />
      <line x1="76" y1="60" x2="88" y2="60" stroke="#F59E0B" strokeWidth="0.6" />
      {/* Scanner beam */}
      <line x1="84" y1="66" x2="84" y2="86" stroke="#10B981" strokeWidth="2" />
      <line x1="74" y1="86" x2="94" y2="86" stroke="#10B981" strokeWidth="1.5" />
      {/* Gear */}
      <circle cx="76" cy="92" r="8" fill="none" stroke="#1B3A5C" strokeWidth="2" />
      <circle cx="76" cy="92" r="3" fill="#1B3A5C" />
    </svg>
  );
}

export function CelebrationIllustration({ className }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Succès"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="celeb-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#0E9F6E" />
        </linearGradient>
      </defs>
      {/* Confetti */}
      <rect x="14" y="14" width="6" height="6" fill="#F59E0B" transform="rotate(20 17 17)" />
      <rect x="98" y="18" width="5" height="5" fill="#1B3A5C" transform="rotate(-15 100 20)" />
      <rect x="20" y="86" width="6" height="6" fill="#2E5A87" transform="rotate(35 23 89)" />
      <rect x="92" y="92" width="5" height="5" fill="#F59E0B" transform="rotate(-30 94 94)" />
      <circle cx="30" cy="32" r="3" fill="#1B3A5C" />
      <circle cx="92" cy="42" r="2.5" fill="#10B981" />
      <circle cx="28" cy="68" r="2.5" fill="#F59E0B" />
      <circle cx="100" cy="72" r="3" fill="#1B3A5C" />
      {/* Trophy / Success circle */}
      <circle cx="60" cy="60" r="40" fill="url(#celeb-grad)" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="3 4" />
      {/* Checkmark */}
      <path d="M44 60 L56 72 L78 48" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Star sparkles */}
      <path d="M22 50 L24 54 L28 56 L24 58 L22 62 L20 58 L16 56 L20 54 Z" fill="#F59E0B" />
      <path d="M100 88 L101 90 L103 91 L101 92 L100 94 L99 92 L97 91 L99 90 Z" fill="#F59E0B" />
    </svg>
  );
}

// ============================================================
// PETITES ICÔNES SVG (indicateurs de progression)
// ============================================================

function ShopIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M5 9v11h14V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function TeamIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M15 20c0-2 1-3 3-3s3 1 3 3" />
    </svg>
  );
}

function PaymentIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  );
}

function InventoryIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

function GearIcon({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
