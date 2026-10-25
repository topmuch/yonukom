// ============================================================
// YonuKom — Vérification de permissions (Anti-Fraude)
// Centralise TOUTES les vérifications de rôle/permission
// ============================================================

import type { UserRole, PermissionSet } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";

/**
 * Récupère les permissions pour un rôle donné.
 */
export function getPermissions(role: UserRole): PermissionSet {
  return ROLE_PERMISSIONS[role];
}

/**
 * Vérifie si un rôle a une permission spécifique.
 */
export function hasPermission(
  role: UserRole,
  permission: keyof PermissionSet
): boolean {
  return ROLE_PERMISSIONS[role][permission] === true;
}

/**
 * Vérifie si un utilisateur peut annuler une vente.
 * ⚠️ RÈGLE ANTI-FRADE : Un vendeur PEUT annuler mais avec motif OBLIGATOIRE.
 * Cette fonction vérifie seulement la permission, pas le motif.
 */
export function canCancelSale(role: UserRole): boolean {
  return hasPermission(role, "canCancelSale");
}

/**
 * Vérifie si un utilisateur peut voir le prix d'achat.
 * ⚠️ RÈGLE ANTI-FRADE : Un vendeur ne voit JAMAIS le prix d'achat.
 */
export function canViewPurchasePrice(role: UserRole): boolean {
  return hasPermission(role, "canViewPurchasePrice");
}

/**
 * Vérifie si un utilisateur peut voir les marges bénéficiaires.
 * ⚠️ RÈGLE ANTI-FRADE : Un vendeur ne voit JAMAIS les marges.
 */
export function canViewMargins(role: UserRole): boolean {
  return hasPermission(role, "canViewMargins");
}

/**
 * Vérifie si un utilisateur peut gérer le stock.
 */
export function canManageStock(role: UserRole): boolean {
  return hasPermission(role, "canManageStock");
}

/**
 * Vérifie si un utilisateur peut clôturer la caisse.
 */
export function canCloseCashSession(role: UserRole): boolean {
  return hasPermission(role, "canCloseCashSession");
}

/**
 * Détermine les données de produit filtrées selon le rôle.
 * - Un vendeur ne reçoit PAS purchasePrice ni les marges
 * - Un gérant/patron voit tout
 */
export function filterProductForRole<T extends { purchasePrice?: number }>(
  product: T,
  role: UserRole
): Omit<T, "purchasePrice"> & { purchasePrice?: number } {
  if (canViewPurchasePrice(role)) {
    return product;
  }

  // Retirer le prix d'achat pour les vendeurs
  const { purchasePrice, ...rest } = product;
  return rest;
}

/**
 * Résumé des restrictions pour un rôle (utile pour l'UI).
 */
export function getRoleRestrictions(role: UserRole): string[] {
  const restrictions: string[] = [];

  if (!canViewPurchasePrice(role)) {
    restrictions.push("Prix d'achat masqués");
  }
  if (!canViewMargins(role)) {
    restrictions.push("Marges bénéficiaires masquées");
  }
  if (!hasPermission(role, "canDeleteSale")) {
    restrictions.push("Suppression de vente interdite (annulation avec motif uniquement)");
  }
  if (!canManageStock(role)) {
    restrictions.push("Gestion du stock interdite");
  }
  if (!canCloseCashSession(role)) {
    restrictions.push("Clôture de caisse interdite");
  }
  if (!hasPermission(role, "canViewAuditLog")) {
    restrictions.push("Journal d'audit inaccessible");
  }
  if (!hasPermission(role, "canViewAllOrders")) {
    restrictions.push("Ne voit que ses propres ventes");
  }

  return restrictions;
}
