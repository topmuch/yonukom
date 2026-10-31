// ============================================================
// YonuKom — Comptabilité & Fiscalité Dashboard (UI)
// 4 onglets : Vue d'ensemble, TVA, Bilan, Exports
// Période sélectionnable (mois + année)
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Calculator,
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  Scale,
  Download,
  FileText,
  CalendarDays,
  Banknote,
  Package,
  Users,
  Truck,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatFCFA } from "@/lib/fcfa";

// --- Types miroir des routes API ---
interface OverviewData {
  period: string;
  revenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  netProfit: number;
  vatCollected: number;
  vatDeductible: number;
  vatToPay: number;
  transactionCount: number;
  purchasesTotal: number;
  salariesTotal: number;
  commissionsPaid: number;
}

interface VatData {
  period: string;
  vatRate: number;
  salesTotal: number;
  purchasesTotal: number;
  vatCollected: number;
  vatDeductible: number;
  vatToPay: number;
  isCredit: boolean;
  salesCount: number;
  purchasesCount: number;
  dueDate: string;
}

interface BalanceSheetData {
  asOf: string;
  assets: {
    cashOnHand: number;
    inventoryValue: number;
    receivables: number;
    total: number;
  };
  liabilities: {
    payables: number;
    customerAdvances: number;
    total: number;
  };
  equity: number;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MONTHS_SHORT = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

export function AccountingDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // Période sélectionnée (mois + année) — défaut = mois courant
  const now = useMemo(() => new Date(), []);
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const period = `${year}-${String(month).padStart(2, "0")}`;

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [vat, setVat] = useState<VatData | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingVat, setLoadingVat] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [exportingFec, setExportingFec] = useState(false);

  const fetchOverview = useCallback(async () => {
    if (!businessId || businessId === "demo") {
      setLoadingOverview(false);
      setOverview(null);
      return;
    }
    setLoadingOverview(true);
    try {
      const res = await fetch(
        `/api/accounting/overview?businessId=${encodeURIComponent(businessId)}&period=${period}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        setOverview(await res.json());
      } else {
        toast.error("Échec du chargement de la vue comptable");
        setOverview(null);
      }
    } catch {
      toast.error("Erreur réseau");
      setOverview(null);
    } finally {
      setLoadingOverview(false);
    }
  }, [businessId, period]);

  const fetchVat = useCallback(async () => {
    if (!businessId || businessId === "demo") {
      setLoadingVat(false);
      setVat(null);
      return;
    }
    setLoadingVat(true);
    try {
      const res = await fetch(
        `/api/accounting/vat?businessId=${encodeURIComponent(businessId)}&period=${period}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        setVat(await res.json());
      } else {
        toast.error("Échec du chargement de la TVA");
        setVat(null);
      }
    } catch {
      toast.error("Erreur réseau");
      setVat(null);
    } finally {
      setLoadingVat(false);
    }
  }, [businessId, period]);

  const fetchBalance = useCallback(async () => {
    if (!businessId || businessId === "demo") {
      setLoadingBalance(false);
      setBalanceSheet(null);
      return;
    }
    setLoadingBalance(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/accounting/balance-sheet?businessId=${encodeURIComponent(businessId)}&asOf=${today}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        setBalanceSheet(await res.json());
      } else {
        toast.error("Échec du chargement du bilan");
        setBalanceSheet(null);
      }
    } catch {
      toast.error("Erreur réseau");
      setBalanceSheet(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [businessId]);

  // Charger overview + VAT en parallèle quand la période change
  useEffect(() => {
    fetchOverview();
    fetchVat();
  }, [fetchOverview, fetchVat]);

  // Le bilan est chargé une seule fois (à la date du jour)
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // --- Handlers d'export ---
  const handleDownloadFec = async () => {
    if (!businessId) return;
    setExportingFec(true);
    try {
      // Ouvre directement le lien — le navigateur proposera le téléchargement
      const url = `/api/accounting/fec?businessId=${encodeURIComponent(businessId)}&year=${year}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `FEC-${year}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`FEC ${year} téléchargé`, {
        description: "Importable dans Sage, Cegid, EBP, etc.",
      });
    } catch {
      toast.error("Échec du téléchargement du FEC");
    } finally {
      setExportingFec(false);
    }
  };

  const handleOpenVatPdf = () => {
    if (!businessId) return;
    const url = `/api/accounting/vat/pdf?businessId=${encodeURIComponent(businessId)}&period=${period}`;
    window.open(url, "_blank");
  };

  const handleOpenBalancePdf = () => {
    if (!businessId) return;
    const today = new Date().toISOString().split("T")[0];
    const url = `/api/accounting/balance-sheet/pdf?businessId=${encodeURIComponent(businessId)}&asOf=${today}`;
    window.open(url, "_blank");
  };

  // --- Years options (3 ans avant, courant) ---
  const yearOptions = useMemo(() => {
    const currentYear = now.getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 3; y <= currentYear; y++) {
      years.push(y);
    }
    return years;
  }, [now]);

  // --- State de chargement initial ---
  if (loadingOverview && loadingVat && loadingBalance) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!businessId || businessId === "demo") {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calculator className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            La comptabilité est disponible une fois votre commerce configuré.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* --- HEADER + Period selector --- */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Comptabilité & Fiscalité</h2>
            <p className="text-xs text-muted-foreground">
              Données comptables mensuelles — Marché sénégalais
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1 gap-1 text-xs">
            <Wallet className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="vat" className="flex-1 gap-1 text-xs">
            <Receipt className="w-3.5 h-3.5" />
            TVA
          </TabsTrigger>
          <TabsTrigger value="balance" className="flex-1 gap-1 text-xs">
            <Scale className="w-3.5 h-3.5" />
            Bilan
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex-1 gap-1 text-xs">
            <Download className="w-3.5 h-3.5" />
            Exports
          </TabsTrigger>
        </TabsList>

        {/* === Onglet 1 : Vue d'ensemble === */}
        <TabsContent value="overview" className="space-y-4">
          {loadingOverview || !overview ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {/* 4 KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  title="Chiffre d'affaires"
                  value={overview.revenue}
                  icon={<Banknote className="w-4 h-4" />}
                  accentColor="text-primary"
                  bgColor="bg-primary/10"
                  detail={`${overview.transactionCount} transaction(s)`}
                />
                <KpiCard
                  title="Coût des marchandises"
                  value={overview.costOfGoodsSold}
                  icon={<Package className="w-4 h-4" />}
                  accentColor="text-amber-600"
                  bgColor="bg-amber-50 dark:bg-amber-950/30"
                  detail="Achats consommés"
                />
                <KpiCard
                  title="Marge brute"
                  value={overview.grossProfit}
                  icon={<TrendingUp className="w-4 h-4" />}
                  accentColor={overview.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
                  bgColor={overview.grossProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"}
                  detail={`Marge : ${overview.grossMarginPct}%`}
                />
                <KpiCard
                  title="Bénéfice net"
                  value={overview.netProfit}
                  icon={overview.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  accentColor={overview.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}
                  bgColor={overview.netProfit >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-rose-50 dark:bg-rose-950/30"}
                  detail={`Charges : ${formatFCFA(overview.operatingExpenses)}`}
                />
              </div>

              {/* Détail des charges */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Détail des charges d&apos;exploitation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ChargeRow
                    label="Salaires et avances"
                    amount={overview.salariesTotal}
                    icon={<Users className="w-4 h-4 text-muted-foreground" />}
                  />
                  <ChargeRow
                    label="Commissions payées"
                    amount={overview.commissionsPaid}
                    icon={<Banknote className="w-4 h-4 text-muted-foreground" />}
                  />
                  <ChargeRow
                    label="Achats reçus dans le mois"
                    amount={overview.purchasesTotal}
                    icon={<Truck className="w-4 h-4 text-muted-foreground" />}
                  />
                  <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm font-medium">
                    <span>Total charges</span>
                    <span className="font-bold">
                      {formatFCFA(overview.operatingExpenses)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* === Onglet 2 : TVA === */}
        <TabsContent value="vat" className="space-y-4">
          {loadingVat || !vat ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard
                  title="TVA collectée"
                  value={vat.vatCollected}
                  icon={<Receipt className="w-4 h-4" />}
                  accentColor="text-amber-600"
                  bgColor="bg-amber-50 dark:bg-amber-950/30"
                  detail={`${vat.salesCount} ventes imposables`}
                />
                <KpiCard
                  title="TVA déductible"
                  value={vat.vatDeductible}
                  icon={<Truck className="w-4 h-4" />}
                  accentColor="text-emerald-600"
                  bgColor="bg-emerald-50 dark:bg-emerald-950/30"
                  detail={`${vat.purchasesCount} achats`}
                />
                <KpiCard
                  title={vat.isCredit ? "Crédit de TVA" : "TVA à verser"}
                  value={Math.abs(vat.vatToPay)}
                  icon={vat.isCredit ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  accentColor={vat.isCredit ? "text-pink-600" : "text-rose-600"}
                  bgColor={vat.isCredit ? "bg-pink-50 dark:bg-pink-950/30" : "bg-rose-50 dark:bg-rose-950/30"}
                  detail={vat.isCredit ? "Reportable" : `Avant le ${vat.dueDate.split("-").reverse().join("/")}`}
                />
              </div>

              {/* Alerte échéance */}
              {vat.vatToPay > 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                    <CardContent className="p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                          Vous devez verser{" "}
                          <strong>{formatFCFA(vat.vatToPay)}</strong> à
                          l&apos;administration fiscale avant le{" "}
                          <strong>
                            {vat.dueDate.split("-").reverse().join("/")}
                          </strong>
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                          Référez-vous à la Direction Générale des Impôts et des
                          Domaines (DGID) du Sénégal pour effectuer le versement.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-700 dark:hover:bg-amber-900/30"
                        onClick={handleOpenVatPdf}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Imprimer
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : vat.vatToPay < 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="border-pink-300 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-pink-900 dark:text-pink-200">
                          Vous disposez d&apos;un crédit de TVA de{" "}
                          <strong>
                            {formatFCFA(Math.abs(vat.vatToPay))}
                          </strong>{" "}
                          reportable sur le mois suivant
                        </p>
                        <p className="text-xs text-pink-700 dark:text-pink-300 mt-1">
                          Ce montant viendra déduire votre prochaine déclaration
                          de TVA. Conservez ce justificatif.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-pink-700 border-pink-300 hover:bg-pink-100 dark:text-pink-200 dark:border-pink-700 dark:hover:bg-pink-900/30"
                        onClick={handleOpenVatPdf}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Imprimer
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null}

              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs font-medium">Règles TVA Sénégal</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Taux standard : <strong>18%</strong> — applicable à la
                        plupart des biens et services.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Déclaration mensuelle à déposer avant le{" "}
                        <strong>20 du mois suivant</strong> la période
                        d&apos;imposition.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        TVA collectée − TVA déductible = montant à verser. Si
                        négatif, c&apos;est un crédit reportable.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Base imposable : montant HT des ventes et achats
                        (calculé ici en supposant que les montants enregistrés
                        sont TTC puis reconstitués HT).
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* === Onglet 3 : Bilan === */}
        <TabsContent value="balance" className="space-y-4">
          {loadingBalance || !balanceSheet ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : (
            <>
              <Card className="bg-gradient-to-r from-primary/10 to-emerald-50 dark:to-emerald-950/30 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Capitaux propres
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          balanceSheet.equity >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatFCFA(balanceSheet.equity)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Au {balanceSheet.asOf.split("-").reverse().join("/")}
                      </p>
                    </div>
                    <Scale
                      className={`w-10 h-10 ${
                        balanceSheet.equity >= 0 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* ACTIFS */}
                <Card className="border-t-4 border-t-emerald-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      Actifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <BalanceRow
                      icon={<Banknote className="w-4 h-4" />}
                      label="Caisse (espèces)"
                      amount={balanceSheet.assets.cashOnHand}
                      detail="Paiements cash reçus"
                    />
                    <BalanceRow
                      icon={<Package className="w-4 h-4" />}
                      label="Stocks"
                      amount={balanceSheet.assets.inventoryValue}
                      detail="Valorisés au prix d'achat"
                    />
                    <BalanceRow
                      icon={<Users className="w-4 h-4" />}
                      label="Créances clients"
                      amount={balanceSheet.assets.receivables}
                      detail="Commandes non soldées"
                    />
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">Total actifs</span>
                      <span className="text-sm font-bold text-emerald-600">
                        {formatFCFA(balanceSheet.assets.total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* PASSIFS */}
                <Card className="border-t-4 border-t-rose-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-rose-600">
                      <TrendingDown className="w-4 h-4" />
                      Passifs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <BalanceRow
                      icon={<Truck className="w-4 h-4" />}
                      label="Dettes fournisseurs"
                      amount={balanceSheet.liabilities.payables}
                      detail="Soldes dûs aux fournisseurs"
                    />
                    <BalanceRow
                      icon={<Users className="w-4 h-4" />}
                      label="Acomptes clients"
                      amount={balanceSheet.liabilities.customerAdvances}
                      detail="Acomptes B2B reçus"
                    />
                    <div className="opacity-50">
                      <BalanceRow
                        icon={<Info className="w-4 h-4" />}
                        label="(Réservé pour dettes futures)"
                        amount={0}
                      />
                    </div>
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">Total passifs</span>
                      <span className="text-sm font-bold text-rose-600">
                        {formatFCFA(balanceSheet.liabilities.total)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleOpenBalancePdf}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Imprimer le bilan
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* === Onglet 4 : Exports === */}
        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-primary" />
                Exports comptables
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* FEC */}
              <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <p className="text-sm font-medium">
                        FEC — Fichier des Écritures Comptables
                      </p>
                      <Badge variant="outline" className="text-[9px]">
                        {year}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Format tabulé compatible Sage, Cegid, EBP. 17 colonnes
                      (JournalCode, EcritureDate, CompteNum, Debit, Credit…).
                      Inclut {MONTHS_SHORT[month - 1]} {year} en cours
                      d&apos;exercice.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleDownloadFec}
                    disabled={exportingFec}
                  >
                    {exportingFec ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    Télécharger
                  </Button>
                </div>
              </div>

              {/* TVA PDF */}
              <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-medium">
                        Déclaration TVA mensuelle (PDF)
                      </p>
                      <Badge variant="outline" className="text-[9px]">
                        {MONTHS_SHORT[month - 1]} {year}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Page imprimable au format A4 — récapitulatif TVA collectée,
                      déductible et montant à verser. Document à conserver pour
                      vos archives comptables.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleOpenVatPdf}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Ouvrir
                  </Button>
                </div>
              </div>

              {/* Bilan PDF */}
              <div className="rounded-lg border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <p className="text-sm font-medium">
                        Bilan simplifié (PDF)
                      </p>
                      <Badge variant="outline" className="text-[9px]">
                        aujourd&apos;hui
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Page imprimable au format A4 — actifs, passifs et capitaux
                      propres. Vue synthétique du patrimoine du commerce.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleOpenBalancePdf}>
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Ouvrir
                  </Button>
                </div>
              </div>

              {/* Aide */}
              <div className="rounded-lg bg-muted/40 p-3 border">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      <strong>FEC</strong> — obligatoire pour les entreprises
                      au régime du réel. Importable dans la plupart des
                      logiciels comptables.
                    </p>
                    <p>
                      <strong>TVA mensuelle</strong> — à déposer avant le 20 du
                      mois suivant auprès de la DGID.
                    </p>
                    <p>
                      <strong>Bilan</strong> — indicatif, ne remplace pas un
                      bilan certifié par un expert-comptable agréé.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Sous-composants ---

function KpiCard({
  title,
  value,
  icon,
  accentColor,
  bgColor,
  detail,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accentColor: string;
  bgColor: string;
  detail?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`p-1.5 rounded-md ${bgColor}`}>
            <span className={accentColor}>{icon}</span>
          </div>
        </div>
        <p className={`text-xl font-bold ${accentColor}`}>{formatFCFA(value)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{title}</p>
        {detail && (
          <p className="text-[9px] text-muted-foreground/80 mt-0.5">{detail}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChargeRow({
  label,
  amount,
  icon,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium">{formatFCFA(amount)}</span>
    </div>
  );
}

function BalanceRow({
  icon,
  label,
  amount,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{label}</p>
          {detail && (
            <p className="text-[10px] text-muted-foreground truncate">
              {detail}
            </p>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold shrink-0">
        {formatFCFA(amount)}
      </span>
    </div>
  );
}
