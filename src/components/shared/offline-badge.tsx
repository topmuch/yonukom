// ============================================================
// YonuKom — Offline Badge
// Badge "Mode Hors Ligne" pour les formulaires/actions
// ============================================================

"use client";

import { CloudOff } from "lucide-react";

interface OfflineBadgeProps {
  /** Nombre d'actions en attente */
  pendingCount?: number;
  className?: string;
}

export function OfflineBadge({ pendingCount = 0, className = "" }: OfflineBadgeProps) {
  if (pendingCount === 0) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yk-amber/10 text-yk-amber text-xs font-medium ${className}`}
    >
      <CloudOff className="w-3.5 h-3.5" />
      <span>{pendingCount} action{pendingCount > 1 ? "s" : ""} hors ligne</span>
    </div>
  );
}
