// ============================================================
// YonuKom — FCFA Amount Display
// Composant réutilisable pour afficher des montants FCFA
// ============================================================

"use client";

import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";

interface FcfaAmountProps {
  amount: number;
  /** Format court (ex: "15K FCFA") pour les espaces restreints */
  short?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Afficher en gras */
  bold?: boolean;
  /** Couleur pour les montants négatifs (restes à payer) */
  negativeColor?: boolean;
}

export function FcfaAmount({
  amount,
  short = false,
  className = "",
  bold = true,
  negativeColor = true,
}: FcfaAmountProps) {
  const formatted = short ? formatFCFAShort(amount) : formatFCFA(amount);
  const isNegative = amount < 0;

  return (
    <span
      className={[
        bold ? "font-semibold" : "font-normal",
        isNegative && negativeColor ? "text-destructive" : "",
        className,
      ].join(" ")}
    >
      {formatted}
    </span>
  );
}
