// ============================================================
// YonuKom — Cash Session Manager
// Open/close cash register with variance detection
// History of past sessions
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Landmark,
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  History,
  CircleDollarSign,
  BarChart3,
  FileText,
  Printer,
  Wallet,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatFCFA } from "@/lib/fcfa";
import { useAuthStore } from "@/stores/use-auth-store";

interface CashSessionData {
  id: string;
  openedAt: string;
  closedAt: string | null;
  theoreticalTotal: number | null;
  declaredTotal: number | null;
  difference: number | null;
  openedBy: string;
  closedBy: string | null;
  isActive: boolean;
}

export function CashSessionManager() {
  const [sessions, setSessions] = useState<CashSessionData[]>([]);
  const [activeSession, setActiveSession] = useState<CashSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [declaredAmount, setDeclaredAmount] = useState("");
  const [closing, setClosing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [activeView, setActiveView] = useState<"active" | "history" | "reports">("active");

  const user = useAuthStore((s) => s.user);
  const canClose = useAuthStore((s) => s.can("canCloseCashSession"));

  const fetchSessions = useCallback(async () => {
    // Pas de businessId valide → pas de sessions. On ne crée JAMAIS de session mock.
    if (!user?.businessId || user.businessId === "demo") {
      setSessions([]);
      setActiveSession(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/cash-sessions?businessId=${encodeURIComponent(user.businessId)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setActiveSession(data.activeSession || null);
      } else {
        setSessions([]);
        setActiveSession(null);
      }
    } catch {
      // Erreur réseau — on reste en état "caisse fermée".
      setSessions([]);
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Open a new cash session
  const handleOpen = async () => {
    if (!user?.businessId || user.businessId === "demo") {
      toast.error("Aucun commerce rattaché à votre compte. Reconnectez-vous.");
      return;
    }
    setOpening(true);
    try {
      const res = await fetch("/api/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: user.businessId,
          openedBy: user.id,
        }),
      });
      if (res.ok) {
        const session = await res.json();
        setActiveSession(session);
        setSessions((prev) => [session, ...prev]);
        toast.success("Caisse ouverte");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Impossible d'ouvrir la caisse.");
      }
    } catch {
      toast.error("Erreur réseau — impossible d'ouvrir la caisse.");
    } finally {
      setOpening(false);
    }
  };

  // Close the active cash session
  const handleClose = async () => {
    if (!activeSession || !declaredAmount) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/cash-sessions/${activeSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          declaredTotal: parseInt(declaredAmount, 10),
          closedBy: user?.id,
        }),
      });
      if (res.ok) {
        const closed = await res.json();
        const closedId = closed.id ?? activeSession.id;
        setActiveSession(null);
        setSessions((prev) =>
          prev.map((s) => (s.id === closed.id ? closed : s))
        );
        setCloseDialogOpen(false);
        setDeclaredAmount("");
        toast.success("Caisse fermée. Le livre de clôture s'ouvre dans un nouvel onglet.");
        // Ouvrir le livre de clôture de caisse dans un nouvel onglet (page imprimable A4)
        // window.open renvoie `null` quand le popup est bloqué (pas d'exception).
        // On propose un fallback : un lien cliquable dans la liste Historique.
        try {
          const popup = window.open(
            `/api/cash-sessions/${closedId}/closure-book`,
            "_blank",
            "noopener,noreferrer"
          );
          if (!popup) {
            // Popup bloqué : on notifie l'utilisateur avec un lien cliquable.
            toast.info("Popup bloqué par le navigateur", {
              description: "Cliquez ici pour ouvrir le livre de clôture.",
              action: {
                label: "Ouvrir",
                onClick: () =>
                  window.open(
                    `/api/cash-sessions/${closedId}/closure-book`,
                    "_blank",
                    "noopener,noreferrer"
                  ),
              },
            });
          }
        } catch {
          // Non bloquant — la fermeture a réussi.
        }
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || "Échec de la clôture de la caisse.");
      }
    } catch {
      toast.error("Erreur réseau — impossible de clôturer la caisse.");
    } finally {
      setClosing(false);
    }
  };

  // Format time duration
  const formatDuration = (start: string, end?: string | null) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diffMs = endTime - startTime;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
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
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Landmark className="w-5 h-5 text-primary" />
          Caisse
        </h2>
        <div className="flex gap-2">
          <Button
            variant={activeView === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("active")}
          >
            Caisse
          </Button>
          <Button
            variant={activeView === "history" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("history")}
          >
            <History className="w-3.5 h-3.5 mr-1" />
            Historique
          </Button>
          <Button
            variant={activeView === "reports" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("reports")}
          >
            <BarChart3 className="w-3.5 h-3.5 mr-1" />
            Rapports
          </Button>
        </div>
      </motion.div>

      {activeView === "active" ? (
        <ActiveCashView
          activeSession={activeSession}
          opening={opening}
          onOpen={handleOpen}
          canClose={canClose}
          onCloseClick={() => setCloseDialogOpen(true)}
          formatDuration={formatDuration}
        />
      ) : activeView === "history" ? (
        <CashHistory sessions={sessions} formatDuration={formatDuration} />
      ) : (
        <CashReportsView businessId={user?.businessId} />
      )}

      {/* Close Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-yk-amber" />
              Clôturer la caisse
            </DialogTitle>
            <DialogDescription>
              Comptez le montant réel en caisse et saisissez-le ci-dessous.
              L&apos;écart sera calculé automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Theoretical amount */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Montant théorique (ventes)</p>
              <p className="text-lg font-bold text-yk-emerald">
                {formatFCFA(activeSession?.theoreticalTotal ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Calculé à partir des paiements reçus pendant la session
              </p>
            </div>

            <Separator />

            {/* Declared amount input */}
            <div className="space-y-2">
              <Label htmlFor="declared-amount" className="text-sm font-medium">
                Montant déclaré en caisse (FCFA)
              </Label>
              <Input
                id="declared-amount"
                type="number"
                placeholder="Ex: 190000"
                value={declaredAmount}
                onChange={(e) => setDeclaredAmount(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>

            {/* Variance preview */}
            {declaredAmount && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-3 border"
                >
                  {(() => {
                    const declared = parseInt(declaredAmount, 10);
                    const theoretical = activeSession?.theoreticalTotal ?? 0;
                    const diff = declared - theoretical;
                    const isPositive = diff > 0;
                    const isZero = diff === 0;
                    return (
                      <>
                        <p className="text-xs text-muted-foreground mb-1">Écart</p>
                        <p className={`text-lg font-bold ${isZero ? "text-yk-emerald" : isPositive ? "text-yk-emerald" : "text-destructive"}`}>
                          {diff === 0 ? "✓ Caisse parfaite" : isPositive ? `+${formatFCFA(diff)} excédent` : `${formatFCFA(diff)} manquant`}
                        </p>
                        {!isZero && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {isPositive ? "Excédent à investiguer" : "Manquant à investiguer — vérifier les remises et annulations"}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCloseDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleClose}
              disabled={!declaredAmount || closing}
              className="gap-1.5"
            >
              {closing ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {closing ? "Clôture..." : "Clôturer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Active Cash View ---
function ActiveCashView({
  activeSession,
  opening,
  onOpen,
  canClose,
  onCloseClick,
  formatDuration,
}: {
  activeSession: CashSessionData | null;
  opening: boolean;
  onOpen: () => void;
  canClose: boolean;
  onCloseClick: () => void;
  formatDuration: (start: string, end?: string | null) => string;
}) {
  return (
    <AnimatePresence mode="wait">
      {activeSession ? (
        <motion.div
          key="open"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-4"
        >
          {/* Open session card */}
          <Card className="border-yk-emerald/30 bg-yk-emerald/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-yk-emerald/20">
                  <Unlock className="w-5 h-5 text-yk-emerald" />
                </div>
                <div>
                  <p className="font-bold text-yk-emerald">Caisse ouverte</p>
                  <p className="text-xs text-muted-foreground">
                    Depuis {formatDuration(activeSession.openedAt)}
                  </p>
                </div>
                <Badge variant="outline" className="ml-auto border-yk-emerald/50 text-yk-emerald">
                  <CircleDollarSign className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Ouvert à</p>
                  <p className="text-sm font-semibold">
                    {new Date(activeSession.openedAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="bg-background rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Durée</p>
                  <p className="text-sm font-semibold">
                    {formatDuration(activeSession.openedAt)}
                  </p>
                </div>
              </div>

              {/* Close button */}
              {canClose && (
                <Button
                  className="w-full mt-4 gap-2"
                  variant="destructive"
                  onClick={onCloseClick}
                >
                  <Lock className="w-4 h-4" />
                  Clôturer la caisse
                </Button>
              )}
              {!canClose && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Seul le Gérant ou le Patron peut clôturer la caisse.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="p-3 text-center">
                <TrendingUp className="w-4 h-4 text-yk-emerald mx-auto mb-1" />
                <p className="text-sm font-bold">{formatFCFA(activeSession?.theoreticalTotal ?? 0)}</p>
                <p className="text-[9px] text-muted-foreground">Théorique</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <Clock className="w-4 h-4 text-primary mx-auto mb-1" />
                <p className="text-sm font-bold">—</p>
                <p className="text-[9px] text-muted-foreground">Ventes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-yk-emerald mx-auto mb-1" />
                <p className="text-sm font-bold">0</p>
                <p className="text-[9px] text-muted-foreground">Écart</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="closed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* No active session — prompt to open */}
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center space-y-4">
              <div className="p-3 rounded-full bg-muted mx-auto w-fit">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg">Caisse fermée</p>
                <p className="text-sm text-muted-foreground">
                  Ouvrez la caisse pour commencer à enregistrer des ventes.
                </p>
              </div>
              <Button
                size="lg"
                className="gap-2 w-full max-w-xs"
                onClick={onOpen}
                disabled={opening}
              >
                {opening ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
                {opening ? "Ouverture..." : "Ouvrir la caisse"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Cash History ---
function CashHistory({
  sessions,
  formatDuration,
}: {
  sessions: CashSessionData[];
  formatDuration: (start: string, end?: string | null) => string;
}) {
  const closedSessions = sessions.filter((s) => s.closedAt);

  if (closedSessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <History className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aucun historique de caisse
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ScrollArea className="max-h-96">
      <div className="space-y-2">
        {closedSessions.map((session, i) => {
          const hasVariance = session.difference !== null && session.difference !== 0;
          const isPositiveVariance = (session.difference ?? 0) > 0;

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={hasVariance ? "border-yk-amber/30" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(session.openedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        {new Date(session.openedAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <Badge
                      variant={hasVariance ? "outline" : "outline"}
                      className={`text-[9px] ${hasVariance ? "border-yk-amber/50 text-yk-amber" : "border-yk-emerald/50 text-yk-emerald"}`}
                    >
                      {formatDuration(session.openedAt, session.closedAt)}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {session.theoreticalTotal !== null && (
                        <span className="text-xs text-muted-foreground">
                          Théo: {formatFCFA(session.theoreticalTotal)}
                        </span>
                      )}
                      {session.declaredTotal !== null && (
                        <span className="text-xs font-medium">
                          Déclaré: {formatFCFA(session.declaredTotal)}
                        </span>
                      )}
                    </div>
                    {session.difference !== null && (
                      <span
                        className={`text-xs font-bold flex items-center gap-0.5 ${
                          session.difference === 0
                            ? "text-yk-emerald"
                            : isPositiveVariance
                            ? "text-yk-emerald"
                            : "text-destructive"
                        }`}
                      >
                        {session.difference === 0 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isPositiveVariance ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {session.difference === 0
                          ? "OK"
                          : `${session.difference > 0 ? "+" : ""}${formatFCFA(session.difference)}`}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ============================================================
// Cash Reports View — Rapports de caisse (jour/semaine/mois/année)
// + Rapports de fermeture de caisse (livre de clôture imprimable)
// ============================================================

interface ReportBucket {
  key: string;
  label: string;
  revenue: number;
  orders: number;
}

interface ReportSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  theoreticalTotal: number | null;
  declaredTotal: number | null;
  difference: number | null;
  openedBy: string;
  closedBy: string | null;
  isActive: boolean;
}

interface CashReportData {
  period: string;
  label: string;
  sales: {
    totalRevenue: number;
    orderCount: number;
    cancelledCount: number;
    averageTicket: number;
  };
  payments: Record<string, number>;
  buckets: ReportBucket[];
  sessions: {
    count: number;
    closedCount: number;
    totalTheoretical: number;
    totalDeclared: number;
    totalDifference: number;
    list: ReportSession[];
  };
}

const PERIODS: { key: "day" | "week" | "month" | "year"; label: string }[] = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  cb: "Carte bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

function CashReportsView({ businessId }: { businessId?: string }) {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const [report, setReport] = useState<CashReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    if (!businessId || businessId === "demo") {
      setReport(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/cash-reports?businessId=${encodeURIComponent(businessId)}&period=${period}`
      );
      if (res.ok) {
        setReport(await res.json());
      } else {
        setReport(null);
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [businessId, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (!businessId || businessId === "demo") {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Les rapports sont disponibles une fois votre boutique configurée.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxRevenue = report?.buckets.reduce((m, b) => Math.max(m, b.revenue), 0) ?? 0;
  const paymentEntries = report
    ? Object.entries(report.payments).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            variant={period === p.key ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
        {report && (
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {report.label}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      ) : !report ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Impossible de charger le rapport.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-yk-emerald" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Chiffre d&apos;affaires
                  </p>
                </div>
                <p className="text-base font-bold text-yk-emerald">
                  {formatFCFA(report.sales.totalRevenue)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Commandes
                  </p>
                </div>
                <p className="text-base font-bold">
                  {report.sales.orderCount}
                  {report.sales.cancelledCount > 0 && (
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                      ({report.sales.cancelledCount} annulées)
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt className="w-3.5 h-3.5 text-yk-coral" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Panier moyen
                  </p>
                </div>
                <p className="text-base font-bold">
                  {formatFCFA(report.sales.averageTicket)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-yk-amber" />
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                    Écart caisse
                  </p>
                </div>
                <p
                  className={`text-base font-bold ${
                    report.sessions.totalDifference === 0
                      ? "text-yk-emerald"
                      : report.sessions.totalDifference > 0
                      ? "text-yk-emerald"
                      : "text-destructive"
                  }`}
                >
                  {report.sessions.totalDifference === 0
                    ? "OK"
                    : `${report.sessions.totalDifference > 0 ? "+" : ""}${formatFCFA(
                        report.sessions.totalDifference
                      )}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sales chart (bars) */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Évolution des ventes
                <span className="text-[10px] font-normal text-muted-foreground">
                  ({period === "day" ? "par heure" : period === "year" ? "par mois" : "par jour"})
                </span>
              </p>
              <div className="flex items-end gap-1 h-32 overflow-x-auto custom-scrollbar">
                {report.buckets.map((b) => {
                  const pct = maxRevenue > 0 ? Math.round((b.revenue / maxRevenue) * 100) : 0;
                  return (
                    <div
                      key={b.key}
                      className="flex flex-col items-center justify-end min-w-[22px] flex-1 h-full group relative"
                      title={`${b.label} — ${formatFCFA(b.revenue)} (${b.orders} cmd)`}
                    >
                      {/* Tooltip on hover */}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full z-10 whitespace-nowrap rounded-md bg-slate-900 text-white text-[9px] px-2 py-1 pointer-events-none">
                        {formatFCFA(b.revenue)} · {b.orders} cmd
                      </span>
                      <span className="text-[8px] text-muted-foreground mb-0.5">
                        {pct > 0 ? pct : ""}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all ${
                          b.revenue > 0
                            ? "bg-gradient-to-t from-[#E91E63] to-[#F06292]"
                            : "bg-slate-100"
                        }`}
                        style={{ height: `${Math.max(pct, b.revenue > 0 ? 4 : 2)}%` }}
                      />
                      <span className="text-[8px] text-muted-foreground mt-1 truncate w-full text-center">
                        {b.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Payment breakdown */}
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-bold mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Répartition par moyen de paiement
              </p>
              {paymentEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucun paiement enregistré sur cette période.
                </p>
              ) : (
                <div className="space-y-2">
                  {paymentEntries.map(([method, amount]) => {
                    const pct =
                      report.sales.totalRevenue > 0
                        ? Math.round((amount / report.sales.totalRevenue) * 100)
                        : 0;
                    return (
                      <div key={method} className="flex items-center gap-3">
                        <span className="text-xs font-medium w-28 shrink-0">
                          {PAYMENT_LABELS[method] ?? method}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#E91E63] to-[#F06292]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold w-24 text-right shrink-0">
                          {formatFCFA(amount)}
                        </span>
                        <span className="text-[10px] text-muted-foreground w-9 text-right shrink-0">
                          {pct}%
                        </span>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Total</span>
                    <span className="text-sm font-bold text-yk-emerald">
                      {formatFCFA(report.sales.totalRevenue)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ===== Rapports de fermeture de caisse ===== */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Rapports de fermeture de caisse
                </p>
                <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">
                  {report.sessions.closedCount} clôture
                  {report.sessions.closedCount > 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground">Théorique cumulé</p>
                  <p className="text-sm font-bold">{formatFCFA(report.sessions.totalTheoretical)}</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground">Déclaré cumulé</p>
                  <p className="text-sm font-bold">{formatFCFA(report.sessions.totalDeclared)}</p>
                </div>
                <div className="rounded-lg bg-muted/60 p-2.5 text-center">
                  <p className="text-[9px] text-muted-foreground">Écart cumulé</p>
                  <p
                    className={`text-sm font-bold ${
                      report.sessions.totalDifference === 0
                        ? "text-yk-emerald"
                        : report.sessions.totalDifference > 0
                        ? "text-yk-emerald"
                        : "text-destructive"
                    }`}
                  >
                    {report.sessions.totalDifference === 0
                      ? "OK"
                      : `${report.sessions.totalDifference > 0 ? "+" : ""}${formatFCFA(
                          report.sessions.totalDifference
                        )}`}
                  </p>
                </div>
              </div>

              {report.sessions.list.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Aucune session de caisse sur cette période.
                </p>
              ) : (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {report.sessions.list.map((s) => {
                      const diff = s.difference ?? 0;
                      const hasDiff = s.closedAt !== null && diff !== 0;
                      return (
                        <div
                          key={s.id}
                          className={`rounded-lg border p-3 ${
                            hasDiff ? "border-yk-amber/40 bg-yk-amber/5" : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              {s.closedAt ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-yk-emerald" />
                              ) : (
                                <Unlock className="w-3.5 h-3.5 text-primary" />
                              )}
                              <span className="text-xs font-semibold">
                                {new Date(s.openedAt).toLocaleDateString("fr-FR", {
                                  weekday: "short",
                                  day: "2-digit",
                                  month: "short",
                                })}{" "}
                                ·{" "}
                                {new Date(s.openedAt).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                                {s.closedAt &&
                                  ` → ${new Date(s.closedAt).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}`}
                              </span>
                            </div>
                            {!s.closedAt && (
                              <Badge className="text-[9px] bg-primary/10 text-primary border-0">
                                En cours
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>Théo: {formatFCFA(s.theoreticalTotal ?? 0)}</span>
                              {s.closedAt && (
                                <span>Déclaré: {formatFCFA(s.declaredTotal ?? 0)}</span>
                              )}
                            </div>
                            {s.closedAt && (
                              <span
                                className={`font-bold ${
                                  diff === 0
                                    ? "text-yk-emerald"
                                    : diff > 0
                                    ? "text-yk-emerald"
                                    : "text-destructive"
                                }`}
                              >
                                {diff === 0 ? "OK" : `${diff > 0 ? "+" : ""}${formatFCFA(diff)}`}
                              </span>
                            )}
                          </div>

                          {/* Closure book link */}
                          {s.closedAt && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 h-8 text-xs gap-1.5"
                              onClick={() =>
                                window.open(
                                  `/api/cash-sessions/${s.id}/closure-book`,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Livre de clôture (A4 imprimable)
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
