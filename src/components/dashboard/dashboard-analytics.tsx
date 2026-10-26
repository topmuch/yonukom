// ============================================================
// YonuKom — Dashboard Analytics
// Revenue charts, top products, payment breakdown
// Real-time stats with Recharts
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  Package,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatFCFA } from "@/lib/fcfa";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface AnalyticsData {
  period: string;
  metrics: {
    totalRevenue: number;
    totalPaid: number;
    totalRemaining: number;
    orderCount: number;
    avgOrderValue: number;
    cancelledOrders: number;
  };
  paymentBreakdown: Record<string, number>;
  topProducts: { name: string; revenue: number; quantity: number }[];
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  lowStockProducts: { id: string; name: string; quantity: number; minStockAlert: number; salePrice: number }[];
}

const PAYMENT_COLORS: Record<string, string> = {
  wave: "#1DC3D6",
  orange_money: "#FF6600",
  cash: "#10B981",
  cb: "#6366F1",
  cheque: "#F59E0B",
  virement: "#8B5CF6",
};

// Vibrant palette used for daily revenue bars (rotating, day of week)
const DAILY_BAR_COLORS = ["#338BE2", "#4ECDC4", "#FF6B6B", "#FFE66D", "#A78BFA", "#10B981", "#F59E0B"];

// Palette for top products progress bars
const TOP_PRODUCT_COLORS = ["#338BE2", "#4ECDC4", "#A78BFA", "#FF6B6B", "#F59E0B", "#10B981", "#6366F1", "#FF6600"];

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  cb: "Carte",
  cheque: "Chèque",
  virement: "Virement",
};

export function DashboardAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?businessId=demo&period=${period}`);
      if (res.ok) {
        const analytics = await res.json();
        // Si les métriques sont vides (pas de données en DB), utiliser les données mock
        if (analytics.metrics && analytics.metrics.totalRevenue === 0 && analytics.metrics.orderCount === 0) {
          setData(getMockAnalytics(period));
        } else {
          setData(analytics);
        }
      } else {
        setData(getMockAnalytics(period));
      }
    } catch {
      // Use mock data
      setData(getMockAnalytics(period));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  const { metrics, paymentBreakdown, topProducts, dailyRevenue, lowStockProducts } = data;

  // Payment breakdown for pie chart
  const paymentData = Object.entries(paymentBreakdown).map(([method, amount]) => ({
    name: PAYMENT_LABELS[method] || method,
    value: amount,
    color: PAYMENT_COLORS[method] || "#94A3B8",
  }));

  // Revenue change indicator (compare last 2 days)
  const revenueChange =
    dailyRevenue.length >= 2
      ? dailyRevenue[dailyRevenue.length - 1].revenue - dailyRevenue[dailyRevenue.length - 2].revenue
      : 0;

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Analyses
        </h2>
        <div className="flex gap-1">
          {(["today", "week", "month"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setPeriod(p)}
            >
              {p === "today" ? "Auj." : p === "week" ? "Sem." : "Mois"}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-yk-emerald/10">
                  <DollarSign className="w-4 h-4 text-yk-emerald" />
                </div>
                {revenueChange !== 0 && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${revenueChange > 0 ? "text-yk-emerald border-yk-emerald/30" : "text-destructive border-destructive/30"}`}
                  >
                    {revenueChange > 0 ? <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />}
                    {Math.abs(revenueChange) > 1000 ? `${Math.round(Math.abs(revenueChange) / 1000)}k` : Math.abs(revenueChange)}
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-yk-emerald">{formatFCFA(metrics.totalRevenue)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Chiffre d&apos;affaires</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-xl font-bold">{metrics.orderCount}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {metrics.cancelledOrders > 0 && (
                  <span className="text-destructive">{metrics.cancelledOrders} annulées • </span>
                )}
                Commandes
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-yk-amber/10">
                  <TrendingUp className="w-4 h-4 text-yk-amber" />
                </div>
              </div>
              <p className="text-xl font-bold">{formatFCFA(metrics.avgOrderValue)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Panier moyen</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className={metrics.totalRemaining > 0 ? "border-yk-amber/30" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-1.5 rounded-md bg-yk-amber/10">
                  <Clock className="w-4 h-4 text-yk-amber" />
                </div>
              </div>
              <p className="text-xl font-bold text-yk-amber">{formatFCFA(metrics.totalRemaining)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Reste à encaisser</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts section */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="revenue" className="flex-1 gap-1 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            CA/Jour
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 gap-1 text-xs">
            <PieChartIcon className="w-3.5 h-3.5" />
            Paiements
          </TabsTrigger>
          <TabsTrigger value="products" className="flex-1 gap-1 text-xs">
            <Package className="w-3.5 h-3.5" />
            Top Produits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Chiffre d&apos;affaires par jour</h3>
              {dailyRevenue.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={dailyRevenue} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="ykRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#338BE2" stopOpacity={0.45} />
                        <stop offset="60%" stopColor="#4ECDC4" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#4ECDC4" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v: string) => {
                        const d = new Date(v);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatFCFA(value), "CA"]}
                      labelFormatter={(label: string) => {
                        const d = new Date(label);
                        return d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
                      }}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#338BE2"
                      strokeWidth={2.5}
                      fill="url(#ykRevenueGradient)"
                      dot={{ r: 3, fill: "#4ECDC4", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#FF6B6B", strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {formatFCFA(dailyRevenue[0]?.revenue ?? 0)} aujourd&apos;hui
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Répartition par moyen de paiement</h3>
              <div className="flex items-center gap-4">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatFCFA(value), ""]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {paymentData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-xs flex-1 truncate">{entry.name}</span>
                      <span className="text-xs font-medium">{formatFCFA(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Top produits par chiffre d&apos;affaires</h3>
              <div className="space-y-2">
                {topProducts.map((product, i) => {
                  const maxRevenue = topProducts[0]?.revenue || 1;
                  const percentage = Math.round((product.revenue / maxRevenue) * 100);
                  const color = TOP_PRODUCT_COLORS[i % TOP_PRODUCT_COLORS.length];
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[60%]">
                          {i + 1}. {product.name}
                        </span>
                        <span className="text-xs font-bold text-yk-emerald">
                          {formatFCFA(product.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${color}, ${color}DD)`,
                            }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground w-8 text-right">
                          ×{product.quantity}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Low stock alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-yk-amber/30 bg-yk-amber/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yk-amber" />
                <h3 className="text-sm font-semibold text-yk-amber">Alerte stock bas</h3>
              </div>
              <div className="space-y-1.5">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs">
                    <span>{p.name}</span>
                    <span className={`font-medium ${p.quantity === 0 ? "text-destructive" : "text-yk-amber"}`}>
                      {p.quantity === 0 ? "Rupture" : `${p.quantity} restant${p.quantity > 1 ? "s" : ""}`}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Mock analytics
function getMockAnalytics(period: string): AnalyticsData {
  const now = new Date();
  const days = period === "month" ? 30 : period === "week" ? 7 : 1;

  const dailyRevenue = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dailyRevenue.push({
      date: d.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 150000 + 50000),
      orders: Math.floor(Math.random() * 15 + 3),
    });
  }

  const totalRevenue = dailyRevenue.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = dailyRevenue.reduce((s, d) => s + d.orders, 0);

  return {
    period,
    metrics: {
      totalRevenue,
      totalPaid: Math.round(totalRevenue * 0.72),
      totalRemaining: Math.round(totalRevenue * 0.28),
      orderCount: totalOrders,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      cancelledOrders: Math.floor(totalOrders * 0.05),
    },
    paymentBreakdown: {
      wave: Math.round(totalRevenue * 0.35),
      orange_money: Math.round(totalRevenue * 0.25),
      cash: Math.round(totalRevenue * 0.3),
      cb: Math.round(totalRevenue * 0.1),
    },
    topProducts: [
      { name: "Thiébou Rouge", revenue: 125000, quantity: 45 },
      { name: "Riz 25kg", revenue: 98000, quantity: 14 },
      { name: "Huile 5L", revenue: 75000, quantity: 25 },
      { name: "Sucre 1kg", revenue: 45000, quantity: 90 },
      { name: "Savon 500g", revenue: 32000, quantity: 64 },
      { name: "Café Touba", revenue: 28000, quantity: 56 },
      { name: "Lait concentré", revenue: 24000, quantity: 48 },
      { name: "Attiéké 1kg", revenue: 18000, quantity: 18 },
    ],
    dailyRevenue,
    lowStockProducts: [
      { id: "1", name: "Savon 500g", quantity: 0, minStockAlert: 5, salePrice: 500 },
      { id: "2", name: "Café Touba", quantity: 3, minStockAlert: 10, salePrice: 500 },
      { id: "3", name: "Lait concentré", quantity: 4, minStockAlert: 8, salePrice: 500 },
    ],
  };
}
