"use client";

import { motion } from "framer-motion";
import { Building2, DollarSign, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";

interface MetricsCardsProps {
  metrics: {
    totalTenants: number;
    mrr: number;
    activationRate: number;
    pastDueCount: number;
  } | null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const cards = [
    {
      title: "Total Tenants",
      value: metrics ? String(metrics.totalTenants) : "—",
      label: "commerces inscrits",
      icon: Building2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "MRR",
      value: metrics ? formatFCFAShort(metrics.mrr) : "—",
      label: "Revenu Récurrent Mensuel",
      icon: DollarSign,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "Taux d'Activation",
      value: metrics ? `${metrics.activationRate}%` : "—",
      label: "ont fait au moins 1 vente",
      icon: Activity,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      title: "En Retard",
      value: metrics ? String(metrics.pastDueCount) : "—",
      label: "abonnements en retard",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
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
            <Card className="h-full">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
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
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
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
