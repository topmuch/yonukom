// ============================================================
// YonuKom — Analytics prédictifs IA (UI)
// 3 sections : Forecast chart, Restock recommendations, AI Insights
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  AlertTriangle,
  Lightbulb,
  Loader2,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  ShoppingCart,
  Brain,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatFCFA } from "@/lib/fcfa";

// --- Types miroir des routes API ---
interface ForecastDay {
  date: string;
  revenue: number;
  isWeekend: boolean;
}

interface RestockRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  avgDailySales: number;
  daysUntilStockout: number;
  recommendedReorderQty: number;
  urgency: "critical" | "high" | "medium" | "low";
}

interface Anomaly {
  date: string;
  actualRevenue: number;
  expectedRevenue: number;
  ratio: number;
  type: "spike" | "drop";
}

interface PredictData {
  salesForecast: ForecastDay[];
  predictedMonthTotal: number;
  growthRate: number;
  previousMonthTotal: number;
  restockRecommendations: RestockRecommendation[];
  anomalies: Anomaly[];
  lastUpdated: string;
}

interface InsightsData {
  insights: string[];
  source: "ai" | "fallback";
  generatedAt: string;
}

// --- Couleurs d'urgence ---
const URGENCY_STYLES: Record<
  RestockRecommendation["urgency"],
  { label: string; className: string }
> = {
  critical: {
    label: "Critique",
    className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
  },
  high: {
    label: "Élevée",
    className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900",
  },
  medium: {
    label: "Moyenne",
    className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  },
  low: {
    label: "Faible",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800",
  },
};

// Détecte le type d'insight à partir de mots-clés
function getInsightIcon(text: string) {
  const lower = text.toLowerCase();
  if (
    lower.includes("stock") ||
    lower.includes("rupture") ||
    lower.includes("réappro") ||
    lower.includes("⚠") ||
    lower.includes("alerte")
  ) {
    return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
  }
  if (
    lower.includes("hausse") ||
    lower.includes("croissance") ||
    lower.includes("progress") ||
    lower.includes("augment") ||
    lower.includes("augmenter") ||
    lower.includes("pire produits") ||
    lower.includes("top produit")
  ) {
    return <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
  }
  if (
    lower.includes("baisse") ||
    lower.includes("chute") ||
    lower.includes("régress") ||
    lower.includes("décrois")
  ) {
    return <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
  }
  return <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />;
}

export function PredictiveAnalytics() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [predictData, setPredictData] = useState<PredictData | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [loadingPredict, setLoadingPredict] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [view, setView] = useState<"history" | "forecast">("forecast");

  // Charger les prévisions
  const fetchPredict = useCallback(async () => {
    if (!businessId || businessId === "demo") {
      setLoadingPredict(false);
      setPredictData(null);
      return;
    }
    setLoadingPredict(true);
    try {
      const res = await fetch(
        `/api/analytics/predict?businessId=${encodeURIComponent(businessId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setPredictData(data as PredictData);
      } else {
        toast.error("Échec du chargement des prévisions");
        setPredictData(null);
      }
    } catch {
      toast.error("Erreur réseau — prévisions indisponibles");
      setPredictData(null);
    } finally {
      setLoadingPredict(false);
    }
  }, [businessId]);

  // Charger les insights IA
  const fetchInsights = useCallback(
    async (isRefresh = false) => {
      if (!businessId || businessId === "demo") {
        setLoadingInsights(false);
        return;
      }
      if (isRefresh) setRefreshingInsights(true);
      else setLoadingInsights(true);
      try {
        const res = await fetch(
          `/api/analytics/insights?businessId=${encodeURIComponent(businessId)}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setInsightsData(data as InsightsData);
          if (isRefresh) {
            toast.success("Insights régénérés", {
              description:
                data.source === "ai" ? "Générés par IA" : "Insights de secours",
            });
          }
        } else {
          toast.error("Échec du chargement des insights");
        }
      } catch {
        toast.error("Erreur réseau — insights indisponibles");
      } finally {
        setLoadingInsights(false);
        setRefreshingInsights(false);
      }
    },
    [businessId]
  );

  useEffect(() => {
    fetchPredict();
    fetchInsights(false);
  }, [fetchPredict, fetchInsights]);

  // --- État de chargement global ---
  if (loadingPredict) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!businessId || businessId === "demo" || !predictData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Les prévisions IA sont disponibles une fois votre commerce configuré
            et vos premières ventes enregistrées.
          </p>
        </CardContent>
      </Card>
    );
  }

  const growthPositive = predictData.growthRate >= 0;

  return (
    <div className="space-y-5">
      {/* --- HEADER --- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Analytics prédictifs</h2>
            <p className="text-xs text-muted-foreground">
              Modèle statistique basé sur {predictData.anomalies.length >= 0 ? "90 jours" : ""} d&apos;historique
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPredict()}
          disabled={loadingPredict}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Actualiser
        </Button>
      </motion.div>

      {/* === SECTION 1 : FORECAST === */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Prévision des ventes — 30 jours
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={view === "history" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setView("history")}
                >
                  Historique (30j)
                </Button>
                <Button
                  variant={view === "forecast" ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setView("forecast")}
                >
                  Prévision (30j)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    CA prévu (30j)
                  </span>
                </div>
                <p className="text-xl font-bold text-primary">
                  {formatFCFA(predictData.predictedMonthTotal)}
                </p>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-1">
                  {growthPositive ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                  )}
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Croissance vs 30j
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xl font-bold ${
                      growthPositive ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {growthPositive ? "+" : ""}
                    {predictData.growthRate}%
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      growthPositive
                        ? "text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
                        : "text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800"
                    }`}
                  >
                    {growthPositive ? "Hausse" : "Baisse"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Chart */}
            {predictData.salesForecast.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart
                  data={predictData.salesForecast}
                  margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="ykForecastGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#338BE2" stopOpacity={0.5} />
                      <stop
                        offset="60%"
                        stopColor="#4ECDC4"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="100%"
                        stopColor="#4ECDC4"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={Math.floor(
                      predictData.salesForecast.length / 6
                    )}
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
                    }
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatFCFA(value),
                      view === "forecast" ? "Prévision" : "Revenu",
                    ]}
                    labelFormatter={(label: string) => {
                      const d = new Date(label);
                      return d.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      });
                    }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#338BE2"
                    strokeWidth={2.5}
                    fill="url(#ykForecastGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#4ECDC4", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                Données insuffisantes pour la prévision.
              </div>
            )}

            <p className="text-[10px] text-muted-foreground">
              Méthode : moyenne mobile 7 jours × coefficient de saisonnalité
              hebdomadaire (basé sur 90j d&apos;historique).
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* === SECTION 2 : RESTOCK RECOMMENDATIONS === */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              Recommandations de réapprovisionnement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictData.restockRecommendations.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium">
                  Tous vos stocks sont sains.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Aucun réapprovisionnement nécessaire. ✅
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-96 w-full rounded-md">
                <div className="space-y-2 pr-2">
                  {predictData.restockRecommendations.map((rec, i) => {
                    const urgency =
                      URGENCY_STYLES[rec.urgency] || URGENCY_STYLES.low;
                    return (
                      <motion.div
                        key={rec.productId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {rec.productName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Vente moy. : {rec.avgDailySales} u/jour
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[9px] ${urgency.className}`}
                          >
                            {urgency.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <p className="text-muted-foreground">Stock actuel</p>
                            <p className="font-semibold">
                              {rec.currentStock} u
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Rupture dans
                            </p>
                            <p
                              className={`font-semibold ${
                                rec.daysUntilStockout <= 3
                                  ? "text-rose-600"
                                  : rec.daysUntilStockout <= 7
                                  ? "text-amber-600"
                                  : ""
                              }`}
                            >
                              {rec.daysUntilStockout === 999
                                ? "—"
                                : `${rec.daysUntilStockout} j`}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              À recommander
                            </p>
                            <p className="font-semibold text-primary">
                              +{rec.recommendedReorderQty} u
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* Anomalies détectées (bonus) */}
            {predictData.anomalies.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium">
                    Anomalies détectées ({predictData.anomalies.length})
                  </span>
                </div>
                <ScrollArea className="max-h-32 w-full">
                  <div className="space-y-1 pr-2">
                    {predictData.anomalies.slice(0, 8).map((a, i) => {
                      const d = new Date(a.date);
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-muted/40"
                        >
                          <span className="flex items-center gap-1.5">
                            {a.type === "spike" ? (
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-rose-500" />
                            )}
                            {d.toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="font-mono">
                            {formatFCFA(a.actualRevenue)}{" "}
                            <span className="text-muted-foreground">
                              ({a.ratio}×)
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Jours où le CA s&apos;écarte de ±2× la moyenne hebdomadaire.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* === SECTION 3 : AI INSIGHTS === */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Insights IA
                {insightsData && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      insightsData.source === "ai"
                        ? "text-primary border-primary/30 bg-primary/5"
                        : "text-muted-foreground border-muted-foreground/30 bg-muted/30"
                    }`}
                  >
                    {insightsData.source === "ai" ? "Génération IA" : "Défaut"}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInsights(true)}
                disabled={refreshingInsights || loadingInsights}
              >
                {refreshingInsights ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                )}
                Régénérer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingInsights ? (
              <div className="space-y-2 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
                <div className="flex items-center justify-center pt-2 gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Génération en cours…
                </div>
              </div>
            ) : insightsData && insightsData.insights.length > 0 ? (
              <ul className="space-y-2.5">
                {insightsData.insights.map((insight, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5"
                  >
                    {getInsightIcon(insight)}
                    <span className="text-sm leading-relaxed">{insight}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <div className="py-6 text-center">
                <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Pas encore assez de ventes pour générer des insights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
