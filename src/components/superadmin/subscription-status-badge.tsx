"use client";

import { Badge } from "@/components/ui/badge";
import type { SubscriptionStatus } from "@/types";

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
}

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; dot: string; className: string }
> = {
  active: {
    label: "Active",
    dot: "🟢",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
  suspended: {
    label: "Suspendu",
    dot: "🟣",
    className: "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100",
  },
  past_due: {
    label: "En retard",
    dot: "🟠",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  expired: {
    label: "Expiré",
    dot: "🔴",
    className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  },
  cancelled: {
    label: "Annulé",
    dot: "⚫",
    className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
  },
};

export function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    dot: "⚪",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge variant="outline" className={config.className}>
      <span className="mr-1 text-xs">{config.dot}</span>
      {config.label}
    </Badge>
  );
}
