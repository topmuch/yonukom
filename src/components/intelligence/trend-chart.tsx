// ============================================================
// YonuKom — Trend Chart
// Graphique du CA sur les 30 derniers jours
// avec ligne de tendance (régression linéaire)
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { formatFCFA } from "@/lib/fcfa";
import { calculateTrendLine, movingAverage, type AIRevenuePoint } from "@/lib/ai/rules-engine";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendChartProps {
  revenueHistory?: AIRevenuePoint[];
}

export function TrendChart({ revenueHistory }: TrendChartProps) {
  const [showMovingAvg, setShowMovingAvg] = useState(true);

  // Calculer les données du chart — utilise revenueHistory passé en prop.
  // Si aucune donnée n'est fournie, on génère 7 jours à zéro (axe du temps
  // visible même sans ventes).
  const data = useMemo<AIRevenuePoint[]>(() => {
    if (revenueHistory && revenueHistory.length > 0) {
      return revenueHistory;
    }
    // Générer les 7 derniers jours à 0 pour ne pas afficher un graphe vide.
    const days: AIRevenuePoint[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split("T")[0],
        revenue: 0,
        orderCount: 0,
      });
    }
    return days;
  }, [revenueHistory]);

  // Calculer la tendance
  const trendData = (() => {
    if (data.length < 7) return { slope: 0, direction: "flat" as const, projected: 0 };

    const points = data.map((d, i) => ({ x: i, y: d.revenue }));
    const trend = calculateTrendLine(points);
    if (trend.length < 2) return { slope: 0, direction: "flat" as const, projected: 0 };

    const slope = (trend[1].y - trend[0].y) / (trend[1].x - trend[0].x);
    const avg = data.reduce((s, d) => s + d.revenue, 0) / data.length;
    const relativeSlope = avg > 0 ? (slope / avg) * 100 : 0;
    const projected = trend[1].y;

    return {
      slope: relativeSlope,
      direction: relativeSlope > 0.5 ? "up" as const : relativeSlope < -0.5 ? "down" as const : "flat" as const,
      projected: Math.max(0, Math.round(projected)),
    };
  })();

  // Préparer les données pour Recharts
  const chartData = data.map((d, i) => {
    const revenues = data.map((dd) => dd.revenue);
    const ma = movingAverage(revenues, 7);
    return {
      date: d.date,
      revenue: d.revenue,
      orders: d.orderCount,
      movingAvg: ma[i] !== null ? Math.round(ma[i]!) : undefined,
    };
  });

  // Ajouter la ligne de tendance
  const trendPoints = calculateTrendLine(data.map((d, i) => ({ x: i, y: d.revenue })));
  if (trendPoints.length === 2) {
    chartData.forEach((cd, i) => {
      const progress = data.length > 1 ? i / (data.length - 1) : 0;
      (cd as Record<string, unknown>).trend = Math.round(
        trendPoints[0].y + progress * (trendPoints[1].y - trendPoints[0].y)
      );
    });
  }

  // Tendance icône & couleur
  const TrendIcon = trendData.direction === "up" ? TrendingUp : trendData.direction === "down" ? TrendingDown : Minus;
  const trendColor = trendData.direction === "up" ? "text-yk-emerald" : trendData.direction === "down" ? "text-destructive" : "text-muted-foreground";

  // Détecter si on n'a AUCUNE donnée réelle (toutes à 0 ou pas de prop)
  const hasRealData =
    !!revenueHistory && revenueHistory.some((p) => p.revenue > 0 || p.orderCount > 0);

  if (!hasRealData) {
    return (
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Tendance CA (7 derniers jours)</h3>
            </div>
          </div>
          {/* Chart avec zeros */}
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(chartData.length / 6)}
              />
              <YAxis
                tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "revenue") return [formatFCFA(value), "CA"];
                  return [value, name];
                }}
                labelFormatter={(label: string) => {
                  const d = new Date(label);
                  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
                }}
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
              />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[3, 3, 0, 0]} opacity={0.7} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Pas encore de ventes enregistrées. Vos tendances apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Tendance CA (30 jours)</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showMovingAvg ? "default" : "outline"}
                size="sm"
                className="text-[9px] h-6 gap-1"
                onClick={() => setShowMovingAvg(!showMovingAvg)}
              >
                MA-7
              </Button>
              <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                <TrendIcon className="w-3.5 h-3.5" />
                {trendData.direction === "up" && `+${trendData.slope.toFixed(1)}%/j`}
                {trendData.direction === "down" && `${trendData.slope.toFixed(1)}%/j`}
                {trendData.direction === "flat" && "Stable"}
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [formatFCFA(value), "CA"];
                    if (name === "movingAvg") return [formatFCFA(value), "MA-7"];
                    if (name === "trend") return [formatFCFA(value), "Tendance"];
                    return [value, name];
                  }}
                  labelFormatter={(label: string) => {
                    const d = new Date(label);
                    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
                  }}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar dataKey="revenue" fill="var(--color-primary)" radius={[3, 3, 0, 0]} opacity={0.7} />
                <Line
                  dataKey="trend"
                  stroke="var(--color-yk-amber)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  type="linear"
                />
                {showMovingAvg && (
                  <Line
                    dataKey="movingAvg"
                    stroke="var(--color-yk-emerald)"
                    strokeWidth={2}
                    dot={false}
                    type="monotone"
                    connectNulls={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Pas assez de données</p>
            </div>
          )}

          {/* Projection */}
          {trendData.direction !== "flat" && trendData.projected > 0 && (
            <div className="mt-3 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">Projection J+7 :</span>
              <span className={`font-semibold ${trendColor}`}>
                {formatFCFA(trendData.projected)}/jour
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
