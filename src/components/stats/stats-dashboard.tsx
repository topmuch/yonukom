// ============================================================
// YonuKom — Statistiques Dashboard
// Onglet "Statistiques" avec 3 sous-onglets : Journalier / Hebdo / Mensuel
// KPIs + graphique recharts + Top 5 produits + répartition paiements
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  Banknote,
  Waves,
  Smartphone,
  CreditCard,
  Package,
  Trophy,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatFCFA, formatFCFAShort } from "@/lib/fcfa";

type Period = "today" | "week" | "month";

interface StatsData {
  period: Period;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  paymentBreakdown: {
    cash: number;
    wave: number;
    orange_money: number;
    cb: number;
  };
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Journalier",
  week: "Hebdomadaire",
  month: "Mensuel",
};

const PAYMENT_META: Array<{
  key: "cash" | "wave" | "orange_money" | "cb";
  label: string;
  Icon: typeof Banknote;
  color: string;
  bg: string;
}> = [
  { key: "cash", label: "Espèces", Icon: Banknote, color: "#10B981", bg: "bg-emerald-500/10 text-emerald-600" },
  { key: "wave", label: "Wave", Icon: Waves, color: "#1DC2FF", bg: "bg-sky-500/10 text-sky-600" },
  { key: "orange_money", label: "Orange Money", Icon: Smartphone, color: "#F97316", bg: "bg-orange-500/10 text-orange-600" },
  { key: "cb", label: "Carte", Icon: CreditCard, color: "#64748B", bg: "bg-slate-500/10 text-slate-600" },
];

// Tooltip custom pour recharts (formatage FCFA)
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as { revenue: number; orders: number };
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{formatDateShort(label)}</p>
      <p className="text-emerald-600">
        CA : <span className="font-bold">{formatFCFA(data?.revenue ?? 0)}</span>
      </p>
      <p className="text-muted-foreground">
        Commandes : <span className="font-bold">{data?.orders ?? 0}</span>
      </p>
    </div>
  );
}

function formatDateShort(s: string): string {
  try {
    const d = new Date(s);
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return s;
  }
}

export function StatsDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!businessId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/stats?businessId=${encodeURIComponent(businessId)}&period=${period}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erreur serveur");
      }
      const json = (await res.json()) as StatsData;
      setData(json);
    } catch (err: any) {
      setError(err?.message ?? "Erreur");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, period]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPayment = data
    ? data.paymentBreakdown.cash +
      data.paymentBreakdown.wave +
      data.paymentBreakdown.orange_money +
      data.paymentBreakdown.cb
    : 0;

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Statistiques
          </h2>
          <Badge variant="outline" className="gap-1">
            <CalendarDays className="w-3 h-3" />
            {PERIOD_LABELS[period]}
          </Badge>
        </div>

        {/* Sub-tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="today" className="text-xs">Journalier</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Hebdomadaire</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mensuel</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="text-sm font-medium text-destructive mb-1">
              Impossible de charger les statistiques
            </p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Aucune donnée disponible pour ce commerce.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="CA total"
              value={formatFCFA(data.totalRevenue)}
              gradient="from-emerald-500 to-teal-600"
              Icon={TrendingUp}
              delay={0}
            />
            <KpiCard
              label="Commandes"
              value={`${data.orderCount}`}
              gradient="from-pink-500 to-pink-600"
              Icon={ShoppingCart}
              delay={0.05}
            />
            <KpiCard
              label="Panier moyen"
              value={formatFCFA(data.avgOrderValue)}
              gradient="from-purple-500 to-pink-600"
              Icon={Receipt}
              delay={0.1}
            />
            <KpiCard
              label="Encaissements"
              value={formatFCFAShort(totalPayment)}
              gradient="from-amber-500 to-orange-600"
              Icon={Banknote}
              delay={0.15}
            />
          </div>

          {/* Bar chart — CA journalier */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart className="w-4 h-4 text-primary" />
                Chiffre d&apos;affaires {period === "today" ? "par heure" : "par jour"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.dailyRevenue.every((d) => d.revenue === 0) ? (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                  Aucune vente sur cette période.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.dailyRevenue}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDateShort}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v) => formatFCFAShort(v).replace(" FCFA", "")}
                        tickLine={false}
                        axisLine={false}
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
                      <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {data.dailyRevenue.map((_, idx) => (
                          <Cell key={idx} fill="#10B981" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Two-column: Paiements + Top produits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Répartition paiements */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary" />
                  Ventes par moyen de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PAYMENT_META.map(({ key, label, Icon, bg }) => {
                  const amount = data.paymentBreakdown[key];
                  const pct = totalPayment > 0 ? Math.round((amount / totalPayment) * 100) : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-md ${bg}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-medium">{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold tabular-nums">{formatFCFA(amount)}</span>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {totalPayment === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Aucun paiement enregistré sur cette période.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top 5 produits */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Top 5 produits vendus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topProducts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    Aucune vente sur cette période.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.topProducts.map((prod, idx) => (
                      <motion.div
                        key={`${prod.name}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700"
                              : idx === 1
                              ? "bg-slate-100 text-slate-700"
                              : idx === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prod.name}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {prod.quantity} vendu{prod.quantity > 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-bold tabular-nums shrink-0">
                          {formatFCFA(prod.revenue)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// --- KPI Card ---
function KpiCard({
  label,
  value,
  gradient,
  Icon,
  delay,
}: {
  label: string;
  value: string;
  gradient: string;
  Icon: typeof TrendingUp;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl shadow-lg p-4 bg-gradient-to-br ${gradient} text-white`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
            <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
        </div>
        <p className="text-xl lg:text-2xl font-bold leading-tight break-words">
          {value}
        </p>
        <p className="text-[11px] text-white/85 mt-1 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}
