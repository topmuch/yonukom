// ============================================================
// YonuKom — Debts Dashboard (Dettes clients avancé)
// Liste toutes les dettes clients (modèle `Debt` en DB).
// - Bouton "Ajouter une dette" → Dialog de création
// - Tableau : Client | Montant dette | Payé | Reste | Date dette |
//             Date recouvrement prévue | Statut | Actions
// - Actions : "Encaisser" (dialog paiement), "Voir détails" (historique),
//             "Imprimer reçu" (lien /api/orders/[id]/receipt si orderId)
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AlertCircle,
  CreditCard,
  Eye,
  HandCoins,
  Loader2,
  MessageCircle,
  Plus,
  Printer,
  Trash2,
  Wallet,
} from "lucide-react";
import { formatFCFA, parseFCFA } from "@/lib/fcfa";
import { motion } from "framer-motion";

// --- Types ---
interface CustomerOption {
  id: string;
  name: string;
  phone?: string | null;
  isB2B?: boolean;
}

interface DebtCustomer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isB2B?: boolean;
}

interface DebtRecord {
  id: string;
  amount: number;
  paidAmount: number;
  debtDate: string;
  expectedPaymentDate: string | null;
  status: "active" | "partial" | "paid";
  notes: string | null;
  orderId: string | null;
  paymentHistory: string;
  createdAt: string;
  customer: DebtCustomer;
}

interface DebtsListResponse {
  debts: DebtRecord[];
  totalDebt: number;
  totalRemaining: number;
  count: number;
}

// --- Helpers ---
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return "—";
  }
}

interface PaymentHistoryEntry {
  date: string;
  amount: number;
  method: string;
  reference?: string;
}

function parsePaymentHistory(raw: string | null | undefined): PaymentHistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PaymentHistoryEntry[];
  } catch {
    return [];
  }
}

const STATUS_LABEL: Record<DebtRecord["status"], string> = {
  active: "En cours",
  partial: "Partiel",
  paid: "Payée",
};

const STATUS_BADGE_CLASS: Record<DebtRecord["status"], string> = {
  active: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  partial: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
};

// ============================================================
// Main Component
// ============================================================
export function DebtsDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";

  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [totalRemaining, setTotalRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<DebtRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<DebtRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Fetch all debts ---
  const fetchDebts = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/debts?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as DebtsListResponse;
      setDebts(data.debts || []);
      setTotalDebt(data.totalDebt || 0);
      setTotalRemaining(data.totalRemaining || 0);
    } catch {
      setDebts([]);
      setTotalDebt(0);
      setTotalRemaining(0);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  // --- Relance WhatsApp (lien wa.me) ---
  const handleRemind = (debt: DebtRecord) => {
    const phone = debt.customer.phone;
    if (!phone) {
      toast.error("Numéro de téléphone manquant pour ce client");
      return;
    }
    const remaining = debt.amount - debt.paidAmount;
    const message = `Bonjour ${debt.customer.name}, vous avez une créance de ${formatFCFA(
      remaining
    )} envers notre commerce. Merci de régulariser dès que possible.`;
    const cleaned = phone.replace(/[^\d]/g, "");
    const waUrl = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success(`Relance WhatsApp générée pour ${debt.customer.name}`);
  };

  // --- Delete debt ---
  const handleDelete = async () => {
    if (!deleteTarget || !businessId) return;
    const target = deleteTarget;
    setDeletingId(target.id);
    try {
      const res = await fetch(
        `/api/debts/${target.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }
      setDebts((prev) => prev.filter((d) => d.id !== target.id));
      toast.success("Dette supprimée");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
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
      {/* Header + summary + create button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <HandCoins className="w-5 h-5 text-primary" />
          Dettes & Crédit Clients
        </h2>
        <div className="flex items-center gap-2">
          {debts.length > 0 && (
            <Card className="px-3 py-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="text-[10px] text-muted-foreground">
                    Reste à recouvrer
                  </div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    {formatFCFA(totalRemaining)}
                  </div>
                </div>
              </div>
            </Card>
          )}
          <Button size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter une dette</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </div>
      </motion.div>

      {/* Content */}
      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour voir les dettes clients.
          </CardContent>
        </Card>
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <h3 className="font-semibold">Aucune dette client</h3>
            <p className="text-sm text-muted-foreground">
              Tous vos clients sont à jour !{" "}
              {createOpen ? null : (
                <button
                  className="text-primary hover:underline"
                  onClick={() => setCreateOpen(true)}
                >
                  Ajouter une dette →
                </button>
              )}
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
                  <TableHead className="text-right">Montant dette</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">
                    Payé
                  </TableHead>
                  <TableHead className="text-right">Reste</TableHead>
                  <TableHead className="text-center hidden md:table-cell">
                    Date dette
                  </TableHead>
                  <TableHead className="text-center hidden lg:table-cell">
                    Recouvrement prévu
                  </TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((d) => {
                  const remaining = d.amount - d.paidAmount;
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{d.customer.name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {d.customer.phone || "—"}
                          {d.customer.isB2B && (
                            <Badge
                              variant="outline"
                              className="text-[9px] py-0 px-1"
                            >
                              B2B
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatFCFA(d.amount)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-emerald-600 dark:text-emerald-400 hidden sm:table-cell">
                        {formatFCFA(d.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                        {formatFCFA(remaining)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground hidden md:table-cell">
                        {formatDate(d.debtDate)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground hidden lg:table-cell">
                        {formatDate(d.expectedPaymentDate)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${STATUS_BADGE_CLASS[d.status]}`}
                        >
                          {STATUS_LABEL[d.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {d.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => setPayTarget(d)}
                              title="Encaisser un paiement"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span className="hidden sm:inline">Encaisser</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setDetailTarget(d)}
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {d.orderId && (
                            <a
                              href={`/api/orders/${d.orderId}/receipt`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                              title="Imprimer le reçu"
                            >
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                            onClick={() => handleRemind(d)}
                            title="Relancer via WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            disabled={deletingId === d.id}
                            onClick={() => setDeleteTarget(d)}
                            title="Supprimer"
                          >
                            {deletingId === d.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {debts.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {debts.length} dette{debts.length > 1 ? "s" : ""} enregistrée
          {debts.length > 1 ? "s" : ""} — Total {formatFCFA(totalDebt)} • Reste{" "}
          {formatFCFA(totalRemaining)}
        </p>
      )}

      {/* Create debt dialog */}
      <CreateDebtDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        businessId={businessId}
        onCreated={fetchDebts}
      />

      {/* Payment dialog */}
      <DebtPaymentDialog
        debt={payTarget}
        open={!!payTarget}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
        businessId={businessId}
        onPaid={fetchDebts}
      />

      {/* Details dialog */}
      <DebtDetailsDialog
        debt={detailTarget}
        open={!!detailTarget}
        onOpenChange={(open) => {
          if (!open) setDetailTarget(null);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dette ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La dette et son historique de
              paiements seront définitivement supprimés.
              {deleteTarget && (
                <span className="block mt-2 text-xs">
                  <span className="font-medium">{deleteTarget.customer.name}</span>{" "}
                  — {formatFCFA(deleteTarget.amount)} (payé{" "}
                  {formatFCFA(deleteTarget.paidAmount)})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Create Debt Dialog
// ============================================================
interface CreateDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onCreated: () => void;
}

function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().split("T")[0];
}

function CreateDebtDialog({
  open,
  onOpenChange,
  businessId,
  onCreated,
}: CreateDebtDialogProps) {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [customerId, setCustomerId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [debtDate, setDebtDate] = useState<string>(todayIso());
  const [expectedPaymentDate, setExpectedPaymentDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch customers when dialog opens
  useEffect(() => {
    if (!open || !businessId) return;
    let cancelled = false;
    setLoadingCustomers(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/customers?businessId=${encodeURIComponent(businessId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed");
        const data = (await res.json()) as CustomerOption[];
        if (!cancelled) {
          setCustomers(
            Array.isArray(data) ? data : data && Array.isArray((data as unknown as { customers: CustomerOption[] }).customers)
              ? (data as unknown as { customers: CustomerOption[] }).customers
              : []
          );
        }
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, businessId]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCustomerId("");
      setAmount("");
      setDebtDate(todayIso());
      setExpectedPaymentDate("");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error("Sélectionnez un client");
      return;
    }
    const amt = parseFCFA(amount);
    if (amt <= 0) {
      toast.error("Saisissez un montant valide (FCFA)");
      return;
    }
    if (!debtDate) {
      toast.error("Saisissez la date de la dette");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/debts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          customerId,
          amount: amt,
          debtDate,
          expectedPaymentDate: expectedPaymentDate || null,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }
      toast.success("Dette enregistrée", {
        description: `Montant : ${formatFCFA(amt)}`,
      });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-primary" />
            Ajouter une dette
          </DialogTitle>
          <DialogDescription>
            Enregistrez une créance client (vente à crédit, acompte non versé…)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Customer select */}
          <div className="space-y-1.5">
            <Label htmlFor="debt-customer">Client *</Label>
            {loadingCustomers ? (
              <Skeleton className="h-9 w-full" />
            ) : customers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun client. Ajoutez d'abord un client dans la section Clients.
              </p>
            ) : (
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="debt-customer" className="w-full">
                  <SelectValue placeholder="Sélectionner un client..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.phone ? `· ${c.phone}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="debt-amount">Montant (FCFA) *</Label>
            <Input
              id="debt-amount"
              type="number"
              inputMode="numeric"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="15000"
              className="h-9"
            />
          </div>

          {/* Debt date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="debt-date">Date de la dette *</Label>
              <Input
                id="debt-date"
                type="date"
                value={debtDate}
                onChange={(e) => setDebtDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-expected">Recouvrement prévu</Label>
              <Input
                id="debt-expected"
                type="date"
                value={expectedPaymentDate}
                onChange={(e) => setExpectedPaymentDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="debt-notes">Notes (optionnel)</Label>
            <Textarea
              id="debt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vente à crédit du 15/10, paiement promis en 2 fois…"
              rows={2}
              className="resize-none text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loadingCustomers || customers.length === 0}
            className="gap-1"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Payment Dialog (Encaisser)
// ============================================================
interface DebtPaymentDialogProps {
  debt: DebtRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onPaid: () => void;
}

function DebtPaymentDialog({
  debt,
  open,
  onOpenChange,
  businessId,
  onPaid,
}: DebtPaymentDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("cash");
  const [reference, setReference] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on close/open
  useEffect(() => {
    if (open && debt) {
      const remaining = debt.amount - debt.paidAmount;
      setAmount(String(remaining));
      setMethod("cash");
      setReference("");
    } else if (!open) {
      setAmount("");
      setReference("");
      setMethod("cash");
    }
  }, [open, debt]);

  const handleSubmit = async () => {
    if (!debt) return;
    const amt = parseFCFA(amount);
    if (amt <= 0) {
      toast.error("Saisissez un montant valide");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          paidAmount: amt,
          paymentMethod: method,
          reference: reference || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }
      const result = (await res.json()) as DebtRecord & {
        paymentApplied: number;
        newStatus: string;
      };
      toast.success(
        `Paiement de ${formatFCFA(result.paymentApplied)} enregistré`,
        {
          description:
            result.newStatus === "paid"
              ? "Dette entièrement remboursée 🎉"
              : `Reste ${formatFCFA(debt.amount - result.paidAmount)}`,
        }
      );
      onPaid();
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'encaissement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!debt) return null;
  const remaining = debt.amount - debt.paidAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Encaisser un paiement
          </DialogTitle>
          <DialogDescription>
            Client : <span className="font-medium">{debt.customer.name}</span>
            <br />
            Reste à recouvrer :{" "}
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {formatFCFA(remaining)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Montant (FCFA) *</Label>
              <Input
                id="pay-amount"
                type="number"
                inputMode="numeric"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Moyen</Label>
              <Select value={method} onValueChange={setMethod}>
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
          <div className="space-y-1.5">
            <Label htmlFor="pay-ref">Référence (optionnel)</Label>
            <Input
              id="pay-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="N° transaction, n° chèque..."
              className="h-9"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setAmount(String(remaining))}
            >
              Tout régler ({formatFCFA(remaining)})
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Valider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Details Dialog (payment history)
// ============================================================
interface DebtDetailsDialogProps {
  debt: DebtRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DebtDetailsDialog({ debt, open, onOpenChange }: DebtDetailsDialogProps) {
  if (!debt) return null;
  const history = parsePaymentHistory(debt.paymentHistory);
  const remaining = debt.amount - debt.paidAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Détails de la dette
          </DialogTitle>
          <DialogDescription>
            {debt.customer.name} — créance du {formatDate(debt.debtDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Montant initial</span>
              <span className="font-semibold">{formatFCFA(debt.amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Déjà payé</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatFCFA(debt.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reste dû</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {formatFCFA(remaining)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Statut</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_BADGE_CLASS[debt.status]}`}
              >
                {STATUS_LABEL[debt.status]}
              </Badge>
            </div>
            {debt.expectedPaymentDate && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Recouvrement prévu
                </span>
                <span>{formatDate(debt.expectedPaymentDate)}</span>
              </div>
            )}
          </div>

          {/* Customer info */}
          <div className="text-xs space-y-0.5 text-muted-foreground">
            {debt.customer.phone && (
              <div>Téléphone : {debt.customer.phone}</div>
            )}
            {debt.customer.address && (
              <div>Adresse : {debt.customer.address}</div>
            )}
            {debt.notes && (
              <div className="mt-1 p-2 rounded bg-amber-500/5 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                📝 {debt.notes}
              </div>
            )}
          </div>

          {/* Payment history */}
          <div className="border border-border rounded-md overflow-hidden">
            <div className="bg-muted/50 px-3 py-2 text-xs font-medium">
              Historique des paiements ({history.length})
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Aucun paiement enregistré pour l'instant.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Moyen</TableHead>
                    <TableHead className="text-xs text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history
                    .slice()
                    .reverse()
                    .map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-xs">
                          {formatDate(p.date)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.method}
                          {p.reference ? (
                            <span className="text-[10px] text-muted-foreground block">
                              {p.reference}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatFCFA(p.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Print receipt (if linked to an order) */}
          {debt.orderId && (
            <a
              href={`/api/orders/${debt.orderId}/receipt`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Printer className="w-3 h-3" />
              Imprimer le reçu de la commande liée
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-exports for convenience
export { DebtsDashboard as DebtsDashboardTab };
