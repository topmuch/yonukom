// ============================================================
// YonuKom — Illustrations réelles pour l'onboarding
// Remplace les SVG inline par des images photo via Unsplash.
// Fallback automatique vers picsum.photos si l'image ne charge pas.
// ============================================================

"use client";

import { useState } from "react";
import type { OnboardingStep } from "@/types/onboarding";

interface IllustrationProps {
  className?: string;
}

// --- Mapping étape → image Unsplash ---
// Chaque entrée : URL Unsplash + fallback picsum.photos (seed) + label
const STEP_IMAGES: Record<
  string,
  { src: string; fallback: string; alt: string }
> = {
  restaurant: {
    src: "/images/onboarding/restaurant.jpg",
    fallback: "https://picsum.photos/seed/restaurant/400/300",
    alt: "Intérieur de restaurant",
  },
  boutique: {
    src: "/images/onboarding/boutique.jpg",
    fallback: "https://picsum.photos/seed/boutique/400/300",
    alt: "Boutique de détail",
  },
  service: {
    src: "/images/onboarding/service.jpg",
    fallback: "https://picsum.photos/seed/service/400/300",
    alt: "Bureau service entreprise",
  },
  team: {
    src: "/images/onboarding/team.jpg",
    fallback: "https://picsum.photos/seed/team/400/300",
    alt: "Équipe en collaboration",
  },
  payment: {
    src: "/images/onboarding/payment.jpg",
    fallback: "https://picsum.photos/seed/payment/400/300",
    alt: "Paiement par carte bancaire",
  },
  stock: {
    src: "/images/onboarding/stock.jpg",
    fallback: "https://picsum.photos/seed/stock/400/300",
    alt: "Entrepôt et inventaire",
  },
  equipment: {
    src: "/images/onboarding/equipment.jpg",
    fallback: "https://picsum.photos/seed/equipment/400/300",
    alt: "Matériel de caisse",
  },
  celebration: {
    src: "/images/onboarding/celebration.jpg",
    fallback: "https://picsum.photos/seed/celebration/400/300",
    alt: "Célébration et succès",
  },
};

// --- Composant image avec fallback onError ---
function SmartImage({
  src,
  fallback,
  alt,
  className,
}: {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  const [triedFallback, setTriedFallback] = useState(false);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (!triedFallback) {
          setTriedFallback(true);
          setCurrent(fallback);
        }
      }}
    />
  );
}

// --- Illustration grande (en-tête d'étape) ---

export function StepIllustration({
  step,
  className,
}: { step: OnboardingStep } & IllustrationProps) {
  // Selon le type de business on pourrait varier, ici on garde
  // une illustration par étape.
  const img = (() => {
    switch (step) {
      case "business_type":
        return STEP_IMAGES.boutique;
      case "team":
        return STEP_IMAGES.team;
      case "payments":
        return STEP_IMAGES.payment;
      case "stock":
        return STEP_IMAGES.stock;
      case "equipment":
        return STEP_IMAGES.equipment;
      default:
        return STEP_IMAGES.boutique;
    }
  })();

  return (
    <div
      className={`overflow-hidden rounded-2xl bg-muted shadow-md ${className ?? ""}`}
    >
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

// --- Petite icône (indicateur de progression en haut) ---
// On garde les icônes en SVG (lucide-react style) pour la barre de progression
// car les mini-images ralentiraient le chargement et pollueraient visuellement.

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
// VRAIES ILLUSTRATIONS PAR CATÉGORIE (exposées pour usage externe)
// ============================================================

export function RestaurantIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.restaurant;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function BoutiqueIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.boutique;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function ServiceIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.service;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function TeamIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.team;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function PaymentIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.payment;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function InventoryIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.stock;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function CelebrationIllustration({ className }: IllustrationProps) {
  const img = STEP_IMAGES.celebration;
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ${className ?? ""}`}>
      <SmartImage
        src={img.src}
        fallback={img.fallback}
        alt={img.alt}
        className="w-full h-full object-cover"
      />
    </div>
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
