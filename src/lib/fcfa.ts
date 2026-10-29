// ============================================================
// YonuKom — Formatage FCFA (Franc CFA)
// ⚠️ Toutes les valeurs monétaires sont des ENTIERS en FCFA.
// JAMAIS de flottants — arrondi à l'unité la plus proche.
// ============================================================

/**
 * Formate un montant en FCFA avec séparateur de milliers.
 * Ex: 15000 → "15 000 FCFA"
 * Ex: 1250500 → "1 250 500 FCFA"
 */
export function formatFCFA(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Espace tous les 3 chiffres
  const sign = amount < 0 ? "-" : "";
  return `${sign}${formatted} FCFA`;
}

/**
 * Format court pour les espaces restreints (badges, etc.)
 * Ex: 15000 → "15K FCFA"
 * Ex: 1500000 → "1.5M FCFA"
 */
export function formatFCFAShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(".0", "")}M FCFA`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1).replace(".0", "")}K FCFA`;
  }
  return `${sign}${abs} FCFA`;
}

/**
 * Calcule la marge bénéficiaire en pourcentage.
 * ⚠️ Un vendeur ne DOIT PAS voir cette valeur (règle anti-fraude).
 * margin = ((salePrice - purchasePrice) / purchasePrice) × 100
 */
export function calculateMargin(purchasePrice: number, salePrice: number): number {
  if (purchasePrice === 0) return 0;
  return Math.round(((salePrice - purchasePrice) / purchasePrice) * 100);
}

/**
 * Calcule le bénéfice en FCFA.
 * profit = salePrice - purchasePrice
 */
export function calculateProfit(purchasePrice: number, salePrice: number): number {
  return salePrice - purchasePrice;
}

/**
 * Parse un montant saisi par l'utilisateur en FCFA.
 * Supprime les espaces et les caractères non numériques.
 * Ex: "15 000" → 15000
 * Ex: "1,250,500" → 1250500
 */
export function parseFCFA(input: string): number {
  const cleaned = input.replace(/[^\d-]/g, "");
  return parseInt(cleaned, 10) || 0;
}
