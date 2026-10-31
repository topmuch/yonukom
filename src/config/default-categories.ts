// ============================================================
// YonuKom — Catégories par défaut selon le métier
// Pré-remplit les catégories à la fin de l'onboarding pour que le
// marchand démarre avec un catalogue structuré (au lieu d'une liste vide).
// Le marchard peut ensuite les renommer, en ajouter, en supprimer.
// ============================================================

import type { BusinessType } from "@/types";

export interface DefaultCategory {
  name: string;
  color: string;
}

export const DEFAULT_CATEGORIES_BY_BUSINESS_TYPE: Record<BusinessType, DefaultCategory[]> = {
  retail_shop: [
    { name: "Épicerie", color: "#3B82F6" },
    { name: "Boissons", color: "#10B981" },
    { name: "Hygiène", color: "#F59E0B" },
    { name: "Maison", color: "#EC4899" },
  ],
  fast_food: [
    { name: "Burgers", color: "#EF4444" },
    { name: "Menus", color: "#F59E0B" },
    { name: "Sandwichs", color: "#10B981" },
    { name: "Boissons", color: "#06B6D4" },
    { name: "Desserts", color: "#EC4899" },
  ],
  restaurant: [
    { name: "Entrées", color: "#10B981" },
    { name: "Plats", color: "#3B82F6" },
    { name: "Grillades", color: "#EF4444" },
    { name: "Boissons", color: "#06B6D4" },
    { name: "Desserts", color: "#EC4899" },
  ],
  salon: [
    { name: "Tresses", color: "#8B5CF6" },
    { name: "Tissage", color: "#EC4899" },
    { name: "Soins", color: "#10B981" },
    { name: "Coiffure Homme", color: "#3B82F6" },
    { name: "Manucure", color: "#F59E0B" },
  ],
  cosmetics: [
    { name: "Soins visage", color: "#EC4899" },
    { name: "Maquillage", color: "#8B5CF6" },
    { name: "Parfums", color: "#F59E0B" },
    { name: "Cheveux", color: "#10B981" },
  ],
  wholesaler: [
    { name: "Gros Alimentaire", color: "#3B82F6" },
    { name: "Gros Cosmétique", color: "#EC4899" },
    { name: "Gros Épicerie", color: "#10B981" },
    { name: "Autre", color: "#64748B" },
  ],
  tiktok_seller: [
    { name: "Tendances", color: "#EC4899" },
    { name: "Promos", color: "#EF4444" },
    { name: "Nouveautés", color: "#10B981" },
    { name: "Best-sellers", color: "#F59E0B" },
  ],
  mobile_vendor: [
    { name: "Snacks", color: "#F59E0B" },
    { name: "Boissons", color: "#06B6D4" },
    { name: "Fruits", color: "#10B981" },
    { name: "Accessoires", color: "#8B5CF6" },
  ],
  // Legacy
  ecommerce_social: [
    { name: "Produits", color: "#3B82F6" },
    { name: "Promos", color: "#EF4444" },
  ],
  pipeline_b2b: [
    { name: "Gros", color: "#3B82F6" },
  ],
  mixte: [
    { name: "Catégorie 1", color: "#3B82F6" },
    { name: "Catégorie 2", color: "#10B981" },
  ],
};

/**
 * Retourne les catégories par défaut pour un type de business.
 * Fallback sur "mixte" si le type est inconnu.
 */
export function getDefaultCategories(businessType: string): DefaultCategory[] {
  return (
    DEFAULT_CATEGORIES_BY_BUSINESS_TYPE[businessType as BusinessType] ??
    DEFAULT_CATEGORIES_BY_BUSINESS_TYPE.mixte
  );
}
