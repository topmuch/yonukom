"use client";

import { motion, type Variants } from "framer-motion";
import { Building2, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFAShort } from "@/lib/fcfa";

interface MetricsCardsProps {
  metrics: {
    totalTenants: number;
    mrr: number;
    activationRate: number;
    pastDueCount: number;
  } | null;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

/** Small circular progress ring (SVG) — premium dashboard feel */
function CircularProgress({
  value,
  size = 44,
  stroke = 4,
  color = "var(--yk-deep)",
  trackColor = "rgba(51,139,226,0.12)",
  children,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Tenants",
      value: metrics ? String(metrics.totalTenants) : "—",
      label: "commerces inscrits",
      progress: metrics ? Math.min(100, (metrics.totalTenants / 100) * 100) : 0,
      icon: Building2,
      iconColor: "text-yk-deep",
      iconBg: "bg-yk-deep/10",
      ringColor: "var(--yk-deep)",
    },
    {
      title: "MRR",
      value: metrics ? formatFCFAShort(metrics.mrr) : "—",
      label: "Revenu Récurrent Mensuel",
      progress: metrics ? Math.min(100, (metrics.mrr / 500000) * 100) : 0,
      icon: DollarSign,
      iconColor: "text-yk-emerald",
      iconBg: "bg-yk-emerald/10",
      ringColor: "var(--yk-emerald)",
    },
    {
      title: "Taux d'Activation",
      value: metrics ? `${metrics.activationRate}%` : "—",
      label: "ont fait au moins 1 vente",
      progress: metrics ? metrics.activationRate : 0,
      icon: Activity,
      iconColor: "text-yk-deep-light",
      iconBg: "bg-yk-deep-light/10",
      ringColor: "var(--yk-deep-light)",
    },
    {
      title: "En Retard",
      value: metrics ? String(metrics.pastDueCount) : "—",
      label: "abonnements en retard",
      progress: metrics ? Math.min(100, metrics.pastDueCount * 10) : 0,
      icon: AlertTriangle,
      iconColor: "text-yk-amber",
      iconBg: "bg-yk-amber/10",
      ringColor: "var(--yk-amber)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-muted-foreground text-xs font-medium">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold tracking-tight md:text-3xl">
                      {card.value}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {card.label}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <CircularProgress value={card.progress} color={card.ringColor}>
                      <div className={`p-1.5 rounded-md ${card.iconBg}`}>
                        <Icon className={`h-4 w-4 ${card.iconColor}`} />
                      </div>
                    </CircularProgress>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
