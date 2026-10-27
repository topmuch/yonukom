// ============================================================
// YonuKom — Debts Dashboard (Dettes & Crédit Clients avancé)
// Liste tous les clients endettés du business.
// Pour chaque client : "Détails" (liste des commandes impayées) et
// "Relancer WhatsApp" (génère un lien wa.me via /api/customers/[id]/remind).
// Dans le dialogue détails : bouton "Encaisser" pour enregistrer un paiement.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  AlertCircle,
  CreditCard,
  Eye,
  HandCoins,
  Loader2,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { formatFCFA, parseFCFA } from "@/lib/fcfa";
import { motion } from "framer-motion";

// --- Types ---
interface CustomerDebtSummary {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  isB2B: boolean;
  totalDebt: number;
  debtCount: number;
  oldestDebtDays: number;
  oldestDebtDate: string | null;
}

interface DebtOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remaining: number;
  createdAt: string;
  daysSinceIssue: number;
}

interface CustomerDebtDetail {
  customer: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
  debts: DebtOrder[];
  totalDebt: number;
  oldestDebtDays: number;
  debtCount: number;
}

// --- Helpers ---
function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function daysLabel(days: number): string {
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "1 jour";
  return `${days} jours`;
}

function daysUrgency(days: number): string {
  if (days >= 60) return "text-rose-600 dark:text-rose-400";
  if (days >= 30) return "text-amber-600 dark:text-amber-400";
  if (days >= 7) return "text-yellow-600 dark:text-yellow-400";
  return "text-emerald-600 dark:text-emerald-400";
}

// ============================================================
// Main Component
// ============================================================
export function DebtsDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";

  const [customers, setCustomers] = useState<CustomerDebtSummary[]>([]);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] =
    useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  // --- Fetch all debts ---
  const fetchDebts = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/debts?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as {
        customers: CustomerDebtSummary[];
        totalDebt: number;
        count: number;
      };
      setCustomers(data.customers || []);
      setTotalDebt(data.totalDebt || 0);
    } catch {
      setCustomers([]);
      setTotalDebt(0);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // --- Relance WhatsApp ---
  const handleRemind = async (customer: CustomerDebtSummary) => {
    setRemindingId(customer.id);
    try {
      const res = await fetch(
        `/api/customers/${customer.id}/remind`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }

      const data = (await res.json()) as {
        waMeUrl: string;
        message: string;
      };

      // Ouvrir WhatsApp dans un nouvel onglet
      window.open(data.waMeUrl, "_blank", "noopener,noreferrer");
      toast.success(`Relance WhatsApp générée pour ${customer.name}`, {
        description: "Le lien a été ouvert dans un nouvel onglet.",
      });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la génération de la relance"
      );
    } finally {
      setRemindingId(null);
    }
  };

  // --- Open details dialog ---
  const handleDetails = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setDetailsOpen(true);
  };

  // --- After payment recorded in dialog, refresh list ---
  const handlePaymentDone = () => {
    fetchDebts();
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" />
          Dettes & Crédit Clients
        </h2>
        {customers.length > 0 && (
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-rose-500" />
              <div>
                <div className="text-xs text-muted-foreground">
                  Total créances
                </div>
                <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatFCFA(totalDebt)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour voir les dettes clients.
          </CardContent>
        </Card>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="font-semibold">Aucune dette client</h3>
            <p className="text-sm text-muted-foreground">
              Tous vos clients sont à jour !
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Téléphone
                  </TableHead>
                  <TableHead className="text-right">Total dette</TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    Plus ancienne
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {c.debtCount} commande
                            {c.debtCount > 1 ? "s" : ""}
                            {c.isB2B && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-[10px] py-0 px-1.5"
                              >
                                B2B
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                      {c.phone || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatFCFA(c.totalDebt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center hidden md:table-cell">
                      <span
                        className={`text-xs font-medium ${daysUrgency(
                          c.oldestDebtDays
                        )}`}
                      >
                        {daysLabel(c.oldestDebtDays)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1"
                          onClick={() => handleDetails(c.id)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Détails</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          onClick={() => handleRemind(c)}
                          disabled={remindingId === c.id}
                          title="Relancer via WhatsApp"
                        >
                          {remindingId === c.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">Relancer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {customers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {customers.length} client{customers.length > 1 ? "s" : ""} avec
          créance{customers.length > 1 ? "s" : ""} en cours
        </p>
      )}

      {/* Details dialog */}
      <DebtDetailsDialog
        customerId={selectedCustomerId}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setSelectedCustomerId(null);
        }}
        businessId={businessId}
        onPaymentDone={handlePaymentDone}
      />
    </div>
  );
}

// ============================================================
// Debt Details Dialog
// ============================================================
interface DebtDetailsDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onPaymentDone: () => void;
}

function DebtDetailsDialog({
  customerId,
  open,
  onOpenChange,
  businessId,
  onPaymentDone,
}: DebtDetailsDialogProps) {
  const [detail, setDetail] = useState<CustomerDebtDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Payment form state
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentReference, setPaymentReference] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Fetch customer debts when dialog opens
  useEffect(() => {
    if (!open || !customerId) {
      setDetail(null);
      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentMethod("cash");
      setPaymentReference("");
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/customers/${customerId}/debts`
        );
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as CustomerDebtDetail;
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, customerId]);

  // Quick fill: full payment
  const handleFillFull = () => {
    if (detail) {
      setPaymentAmount(String(detail.totalDebt));
    }
  };

  // Submit payment
  const handleSubmitPayment = async () => {
    if (!customerId || !detail) return;
    const amount = parseFCFA(paymentAmount);
    if (amount <= 0) {
      toast.error("Saisissez un montant valide");
      return;
    }
    setPaying(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          amount,
          paymentMethod,
          reference: paymentReference || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }

      const result = (await res.json()) as {
        amountApplied: number;
        debtSummary: { totalDebt: number; debtCount: number };
        payments: Array<{
          orderId: string;
          orderNumber: string;
          appliedAmount: number;
        }>;
      };

      toast.success(
        `Paiement de ${formatFCFA(result.amountApplied)} enregistré`,
        {
          description: `${result.payments.length} commande(s) mise(s) à jour.`,
        }
      );

      // Refresh detail
      try {
        const refreshRes = await fetch(`/api/customers/${customerId}/debts`);
        if (refreshRes.ok) {
          const fresh = (await refreshRes.json()) as CustomerDebtDetail;
          setDetail(fresh);
        }
      } catch {
        /* ignore */
      }

      setShowPaymentForm(false);
      setPaymentAmount("");
      setPaymentReference("");
      onPaymentDone();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'enregistrement du paiement"
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Détails des dettes
          </DialogTitle>
          <DialogDescription>
            {detail
              ? `Créances de ${detail.customer.name} — ${
                  detail.debtCount
                } commande(s), total ${formatFCFA(detail.totalDebt)}`
              : "Chargement..."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-6 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !detail ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            Impossible de charger les détails.
          </div>
        ) : detail.debts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="text-4xl">✅</div>
            <p className="text-sm text-muted-foreground">
              Ce client est maintenant à jour — aucune créance en cours.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Customer info */}
            <div className="rounded-md bg-muted/50 p-3 space-y-1">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-sm font-semibold">
                    {detail.customer.name}
                  </div>
                  {detail.customer.phone && (
                    <div className="text-xs text-muted-foreground">
                      Tél: {detail.customer.phone}
                    </div>
                  )}
                  {detail.customer.address && (
                    <div className="text-xs text-muted-foreground">
                      {detail.customer.address}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total dû</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatFCFA(detail.totalDebt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Debts table */}
            <div className="border border-border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Commande</TableHead>
                    <TableHead className="text-center">Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Reste</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.debts.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="text-xs font-mono font-semibold">
                          {d.orderNumber}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {d.status}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        <div>{formatDate(d.createdAt)}</div>
                        <div
                          className={`text-[10px] ${daysUrgency(
                            d.daysSinceIssue
                          )}`}
                        >
                          {daysLabel(d.daysSinceIssue)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {formatFCFA(d.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400">
                        {formatFCFA(d.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-bold text-rose-600 dark:text-rose-400">
                        {formatFCFA(d.remaining)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Payment form */}
            {showPaymentForm ? (
              <div className="rounded-md border border-primary/30 p-3 space-y-3 bg-primary/5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Encaisser un paiement
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label htmlFor="pay-amount" className="text-xs">
                      Montant (FCFA)
                    </Label>
                    <Input
                      id="pay-amount"
                      type="number"
                      min={1}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 space-y-1">
                    <Label htmlFor="pay-method" className="text-xs">
                      Moyen
                    </Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger id="pay-method" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Espèces</SelectItem>
                        <SelectItem value="wave">Wave</SelectItem>
                        <SelectItem value="orange_money">Orange Money</SelectItem>
                        <SelectItem value="cb">Carte bancaire</SelectItem>
                        <SelectItem value="cheque">Chèque</SelectItem>
                        <SelectItem value="virement">Virement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pay-ref" className="text-xs">
                    Référence (optionnel)
                  </Label>
                  <Input
                    id="pay-ref"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="N° transaction, n° chèque..."
                    className="h-9"
                  />
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleFillFull}
                    className="text-xs h-7"
                  >
                    Tout régler ({formatFCFA(detail.totalDebt)})
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaymentForm(false)}
                      disabled={paying}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmitPayment}
                      disabled={paying}
                      className="gap-1"
                    >
                      {paying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Valider
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowPaymentForm(true)}
                className="w-full gap-1"
                variant="default"
              >
                <CreditCard className="w-4 h-4" />
                Encaisser un paiement
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
