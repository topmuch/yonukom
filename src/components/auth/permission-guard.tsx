// ============================================================
// YonuKom — Permission Guard
// Restricts UI based on user role permissions
// Anti-fraud: vendeur can't see purchase prices, margins, etc.
// ============================================================

"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import type { PermissionSet } from "@/types";
import { Shield, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface PermissionGuardProps {
  /** The permission key to check */
  permission: keyof PermissionSet;
  /** Content to render if permission is granted */
  children: React.ReactNode;
  /** Optional: content to render if permission is denied (default: null) */
  fallback?: React.ReactNode;
  /** Optional: show a "locked" message instead of hiding completely */
  showLocked?: boolean;
  /** Optional: custom message for the locked state */
  lockedMessage?: string;
}

/**
 * Permission Guard — hides or replaces content based on user role.
 * 
 * Usage:
 * ```tsx
 * <PermissionGuard permission="canViewPurchasePrice" showLocked>
 *   <PurchasePriceDisplay />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  showLocked = false,
  lockedMessage,
}: PermissionGuardProps) {
  const can = useAuthStore((s) => s.can);

  if (can(permission)) {
    return <>{children}</>;
  }

  if (showLocked) {
    return (
      <LockedPlaceholder
        permission={permission}
        message={lockedMessage}
      />
    );
  }

  return <>{fallback}</>;
}

// --- Locked Placeholder ---
function LockedPlaceholder({
  permission,
  message,
}: {
  permission: keyof PermissionSet;
  message?: string;
}) {
  const PERMISSION_LABELS: Record<keyof PermissionSet, string> = {
    canViewPurchasePrice: "Prix d'achat",
    canViewMargins: "Marges",
    canDeleteSale: "Supprimer vente",
    canCancelSale: "Annuler vente",
    canManageStock: "Gérer le stock",
    canManageUsers: "Gérer l'équipe",
    canCloseCashSession: "Clôturer la caisse",
    canViewAuditLog: "Journal d'audit",
    canManageProducts: "Gérer les produits",
    canViewAllOrders: "Voir toutes les commandes",
    canChangeRoles: "Changer les rôles",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-3 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            {message || `${PERMISSION_LABELS[permission]} — accès restreint`}
          </span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Role Badge ---
interface RoleBadgeProps {
  className?: string;
}

/**
 * Displays the current user's role as a badge.
 * Used in the header/sidebar for quick role visibility.
 */
export function RoleBadge({ className }: RoleBadgeProps) {
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const ROLE_STYLES: Record<string, string> = {
    patron: "bg-yk-emerald/10 text-yk-emerald border-yk-emerald/30",
    gerant: "bg-primary/10 text-primary border-primary/30",
    vendeur: "bg-yk-amber/10 text-yk-amber border-yk-amber/30",
  };

  const ROLE_LABELS_LOCAL: Record<string, string> = {
    patron: "Patron",
    gerant: "Gérant",
    vendeur: "Vendeur",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-medium ${ROLE_STYLES[user.role] || ""} ${className || ""}`}
    >
      <Shield className="w-2.5 h-2.5" />
      {ROLE_LABELS_LOCAL[user.role] || user.role}
    </span>
  );
}
