// ============================================================
// YonuKom — Credit Dashboard
// B2B Pipeline: credit overview, customer list, overdue alerts
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Building2, AlertTriangle, Users, TrendingUp, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

// ── Types ────────────────────────────────────────────────────────

interface B2BCustomer {
  id: string;
  name: string;
  phone: string;
  isB2B: boolean;
  creditLimit: number;
  paymentMethod: string;
  totalOrders: number;
  outstandingAmount: number;
}

// ── Payment method labels ────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  cb: "Carte Bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

// ── Payment method badge colors ──────────────────────────────────

const PAYMENT_BADGE_CLASS: Record<string, string> = {
  wave: "bg-blue-100 text-blue-700 border-blue-200",
  orange_money: "bg-orange-100 text-orange-700 border-orange-200",
  cash: "bg-green-100 text-green-700 border-green-200",
  cb: "bg-purple-100 text-purple-700 border-purple-200",
  cheque: "bg-yellow-100 text-yellow-700 border-yellow-200",
  virement: "bg-teal-100 text-teal-700 border-teal-200",
};

// ── Animation variants ───────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ── Component ────────────────────────────────────────────────────

export function CreditDashboard() {
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // Fetch B2B customers
  const fetchCustomers = useCallback(async () => {
    // Pas de businessId valide → liste vide (pas de données démo).
    if (!businessId || businessId === "demo") {
      setCustomers([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/b2b-customers?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Computed stats ───────────────────────────────────────────

  const totalOutstanding = customers.reduce(
    (sum, c) => sum + c.outstandingAmount,
    0
  );
  const creditClients = customers.filter(
    (c) => c.outstandingAmount > 0
  );
  const limitReached = customers.filter(
    (c) => c.creditLimit > 0 && c.outstandingAmount >= c.creditLimit
  );
  const totalB2B = customers.length;

  // ── Progress bar color helper ────────────────────────────────

  const getProgressColor = (ratio: number): string => {
    if (ratio >= 0.8) return "bg-destructive";
    if (ratio >= 0.5) return "bg-yk-amber";
    return "bg-yk-emerald";
  };

  // ── Loading skeleton ─────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Section title ─────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Crédit B2B</h2>
      </motion.div>

      {/* ── Summary cards (2×2 grid) ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Crédit Total */}
        <motion.div variants={itemVariants}>
          <Card className="border-yk-emerald/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-yk-emerald/10">
                  <TrendingUp className="w-4 h-4 text-yk-emerald" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Crédit Total
                </span>
              </div>
              <p className="text-lg font-bold text-yk-emerald leading-tight">
                {formatFCFA(totalOutstanding)}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clients en crédit */}
        <motion.div variants={itemVariants}>
          <Card className="border-yk-amber/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-yk-amber/10">
                  <AlertTriangle className="w-4 h-4 text-yk-amber" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Clients en crédit
                </span>
              </div>
              <p className="text-2xl font-bold text-yk-amber leading-tight">
                {creditClients.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Limite atteinte */}
        <motion.div variants={itemVariants}>
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-destructive/10">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Limite atteinte
                </span>
              </div>
              <p className="text-2xl font-bold text-destructive leading-tight">
                {limitReached.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Clients B2B */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Clients B2B
                </span>
              </div>
              <p className="text-2xl font-bold text-primary leading-tight">
                {totalB2B}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Alert section (customers at credit limit) ─────────── */}
      {limitReached.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-destructive/10 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-destructive">
                    ⚠️ {limitReached.length} client(s) ont atteint leur limite de crédit
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {limitReached.map((c) => (
                      <Badge
                        key={c.id}
                        variant="destructive"
                        className="text-[10px]"
                      >
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Customer credit list ──────────────────────────────── */}
      {customers.length > 0 ? (
        <ScrollArea className="max-h-96">
          <div className="space-y-2 pr-1">
            {customers.map((customer, index) => {
              const ratio =
                customer.creditLimit > 0
                  ? customer.outstandingAmount / customer.creditLimit
                  : 0;
              const progressValue = Math.min(ratio * 100, 100);
              const progressColor = getProgressColor(ratio);
              const isAtLimit =
                customer.creditLimit > 0 &&
                customer.outstandingAmount >= customer.creditLimit;

              return (
                <motion.div
                  key={customer.id}
                  variants={itemVariants}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card
                    className={`${isAtLimit ? "border-destructive/30" : ""}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar initial */}
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        {/* Customer info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-sm truncate">
                              {customer.name}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1.5 py-0 shrink-0"
                            >
                              B2B
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {customer.phone}
                          </p>

                          {/* Amount row */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span
                              className={`text-sm font-bold ${
                                customer.outstandingAmount > 0
                                  ? "text-yk-amber"
                                  : "text-yk-emerald"
                              }`}
                            >
                              {formatFCFA(customer.outstandingAmount)}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              / {formatFCFA(customer.creditLimit)}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 relative">
                            <Progress
                              value={progressValue}
                              className="h-2"
                            />
                            {/* Colored overlay on progress indicator */}
                            <div
                              className={`absolute top-0 left-0 h-2 rounded-full ${progressColor} transition-all`}
                              style={{
                                width: `${progressValue}%`,
                                maxWidth: "100%",
                              }}
                            />
                          </div>

                          {/* Badges row */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 ${
                                PAYMENT_BADGE_CLASS[customer.paymentMethod] || ""
                              }`}
                            >
                              {PAYMENT_LABELS[customer.paymentMethod] ||
                                customer.paymentMethod}
                            </Badge>
                            {isAtLimit && (
                              <Badge
                                variant="destructive"
                                className="text-[9px] px-1.5 py-0"
                              >
                                Limite atteinte
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Chevron */}
                        <div className="shrink-0 flex items-center">
                          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Aucun client B2B trouvé
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
