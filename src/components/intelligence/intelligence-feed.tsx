// ============================================================
// YonuKom — Intelligence Feed
// Affiche le fil de recommandations de l'IA locale
// Cartes avec icônes de priorité :
//   🟠 Urgent  🔵 Suggestion  🟢 Positive
// ============================================================

"use client";

import { useEffect, useState } from "react";
import { useAIStore } from "@/stores/use-ai-store";
import { runAIAnalysis } from "@/lib/ai/scheduler";
import { getMockDataForAI } from "@/lib/db/historical-data";
import { generateRecommendations, type AIAlert, type AIPriority } from "@/lib/ai/rules-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingCart,
  Shield,
  DollarSign,
  CreditCard,
  Star,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Filter,
  Sparkles,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatFCFA } from "@/lib/fcfa";

// Icône par type d'alerte
const ALERT_ICON: Record<string, React.ElementType> = {
  STOCK_CRITICAL: AlertTriangle,
  STOCK_LOW: Package,
  STOCK_HEALTHY: CheckCircle2,
  REVENUE_DROP: TrendingDown,
  REVENUE_TREND_DOWN: TrendingDown,
  REVENUE_TREND_UP: TrendingUp,
  CANCELLATION_SPIKE: Shield,
  CASH_VARIANCE: DollarSign,
  PAYMENT_MIX_ALERT: CreditCard,
  TOP_PERFORMER: Star,
};

// Couleur par priorité
const PRIORITY_STYLES: Record<AIPriority, { border: string; bg: string; text: string; dot: string; badge: string }> = {
  urgent: {
    border: "border-yk-amber/40",
    bg: "bg-yk-amber/5",
    text: "text-yk-amber",
    dot: "bg-yk-amber",
    badge: "border-yk-amber/50 text-yk-amber",
  },
  suggestion: {
    border: "border-primary/20",
    bg: "bg-primary/5",
    text: "text-primary",
    dot: "bg-primary",
    badge: "border-primary/50 text-primary",
  },
  positive: {
    border: "border-yk-emerald/30",
    bg: "bg-yk-emerald/5",
    text: "text-yk-emerald",
    dot: "bg-yk-emerald",
    badge: "border-yk-emerald/50 text-yk-emerald",
  },
};

const PRIORITY_LABELS: Record<AIPriority, string> = {
  urgent: "Urgent",
  suggestion: "Suggestion",
  positive: "Positif",
};

export function IntelligenceFeed() {
  const alerts = useAIStore((s) => s.alerts);
  const urgentCount = useAIStore((s) => s.urgentCount);
  const isAnalyzing = useAIStore((s) => s.isAnalyzing);
  const isInitialized = useAIStore((s) => s.isInitialized);
  const priorityFilter = useAIStore((s) => s.priorityFilter);
  const setAlerts = useAIStore((s) => s.setAlerts);
  const setAnalyzing = useAIStore((s) => s.setAnalyzing);
  const setPriorityFilter = useAIStore((s) => s.setPriorityFilter);
  const dismissAlert = useAIStore((s) => s.dismissAlert);

  // Charger les analyses IA
  const loadAnalysis = async () => {
    setAnalyzing(true);
    try {
      const result = await runAIAnalysis();
      setAlerts(result);
    } catch {
      // Fallback: use mock data
      const mockData = getMockDataForAI();
      const mockAlerts = generateRecommendations(mockData);
      setAlerts(mockAlerts);
    }
  };

  // Initialiser l'IA au premier rendu
  useEffect(() => {
    if (!isInitialized) {
      loadAnalysis();
    }
  }, [isInitialized]);

  // Filtrer les alertes
  const filteredAlerts = priorityFilter === "all"
    ? alerts
    : alerts.filter((a) => a.priority === priorityFilter);

  // Loading
  if (!isInitialized || isAnalyzing) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary animate-pulse" />
          <Skeleton className="h-5 w-32" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">IA Locale</h2>
          {urgentCount > 0 && (
            <Badge className="bg-yk-amber text-white text-[9px]">
              {urgentCount} urgent{urgentCount > 1 ? "e" : ""}s
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={loadAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isAnalyzing ? "Analyse..." : "Rafraîchir"}
          </Button>
        </div>
      </motion.div>

      {/* Priority filters */}
      <div className="flex gap-2">
        {(["all", "urgent", "suggestion", "positive"] as const).map((f) => {
          const count = f === "all" ? alerts.length : alerts.filter((a) => a.priority === f).length;
          if (f !== "all" && count === 0) return null;
          return (
            <Button
              key={f}
              variant={priorityFilter === f ? "default" : "outline"}
              size="sm"
              className="text-[10px] h-7 gap-1"
              onClick={() => setPriorityFilter(f)}
            >
              {f === "all" ? "Tout" : f === "urgent" ? "🟠" : f === "suggestion" ? "🔵" : "🟢"}
              {count}
            </Button>
          );
        })}
      </div>

      {/* Alert feed */}
      {filteredAlerts.length > 0 ? (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.map((alert, i) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  index={i}
                  onDismiss={dismissAlert}
                />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      ) : (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-yk-emerald mx-auto" />
            <p className="text-sm font-medium text-yk-emerald">Tout va bien !</p>
            <p className="text-xs text-muted-foreground">
              Aucune alerte active. L&apos;IA surveille votre activité en permanence.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Alert Card ---
function AlertCard({
  alert,
  index,
  onDismiss,
}: {
  alert: AIAlert;
  index: number;
  onDismiss: (id: string) => void;
}) {
  const Icon = ALERT_ICON[alert.type] || Brain;
  const styles = PRIORITY_STYLES[alert.priority];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className={`${styles.border} ${styles.bg}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Icon with priority dot */}
            <div className={`p-2 rounded-lg ${styles.bg} shrink-0 relative`}>
              <Icon className={`w-4 h-4 ${styles.text}`} />
              <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${styles.dot} border-2 border-background`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-xs font-semibold ${styles.text} truncate`}>
                  {alert.message}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {alert.detail}
              </p>

              {/* Action button */}
              {alert.action && (
                <Button
                  variant="outline"
                  size="sm"
                  className={`mt-2 text-[10px] h-6 gap-1 ${styles.text} hover:${styles.bg}`}
                >
                  {alert.action.type === "REORDER" && <ShoppingCart className="w-3 h-3" />}
                  {alert.action.type === "INVESTIGATE" && <Shield className="w-3 h-3" />}
                  {alert.action.type === "PROMOTE" && <TrendingUp className="w-3 h-3" />}
                  {alert.action.type === "CHECK_CASH" && <DollarSign className="w-3 h-3" />}
                  {alert.action.label}
                  <ChevronRight className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>

            {/* Priority badge + dismiss */}
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className={`text-[7px] px-1 py-0 ${styles.badge}`}>
                {PRIORITY_LABELS[alert.priority]}
              </Badge>
              <button
                onClick={() => onDismiss(alert.id)}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Ignorer cette alerte"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
