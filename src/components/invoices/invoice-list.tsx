// ============================================================
// YonuKom — Invoice List (Facturation & Reçus PDF)
// Liste les factures du business, permet d'en créer, marquer payée,
// ouvrir le PDF imprimable dans un nouvel onglet.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Plus,
  FileText,
  CheckCircle2,
  Trash2,
  Loader2,
  Receipt,
  X,
  Trash,
} from "lucide-react";
import { formatFCFA, parseFCFA } from "@/lib/fcfa";
import { motion } from "framer-motion";

// --- Types ---
interface CustomerLite {
  id: string;
  name: string;
  phone?: string;
}

interface InvoiceItemInput {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  number: string;
  businessId: string;
  customerId: string | null;
  orderId: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  customer?: CustomerLite | null;
}

// --- Status badge config ---
const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  draft: {
    label: "Brouillon",
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  sent: {
    label: "Envoyée",
    className:
      "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-900",
  },
  paid: {
    label: "Payée",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  },
  partial: {
    label: "Partielle",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  },
  cancelled: {
    label: "Annulée",
    className:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
  },
};

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

// ============================================================
// Main Component
// ============================================================
export function InvoiceList() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // --- Fetch invoices ---
  const fetchInvoices = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/invoices?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Invoice[];
      setInvoices(data);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // --- Open PDF in new tab ---
  const handleViewPdf = (id: string) => {
    window.open(`/api/invoices/${id}/pdf`, "_blank", "noopener,noreferrer");
  };

  // --- Mark invoice as paid ---
  const handleMarkPaid = async (invoice: Invoice) => {
    setUpdatingId(invoice.id);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          status: "paid",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }
      const updated = (await res.json()) as Invoice;
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoice.id ? updated : inv))
      );
      toast.success(`Facture ${invoice.number} marquée comme payée`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la mise à jour"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // --- Delete invoice ---
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const invoice = deleteTarget;
    setDeletingId(invoice.id);
    try {
      const res = await fetch(
        `/api/invoices/${invoice.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec");
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoice.id));
      toast.success(`Facture ${invoice.number} supprimée`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // --- Create invoice ---
  const handleCreate = async (payload: {
    customerId: string | null;
    items: InvoiceItemInput[];
    taxRate: number;
    notes: string;
    dueDate: string | null;
  }) => {
    setCreating(true);
    try {
      const subtotal = payload.items.reduce(
        (sum, it) => sum + (it.totalPrice || 0),
        0
      );
      const taxRateNum = payload.taxRate || 0;
      const taxAmount = Math.round((subtotal * taxRateNum) / 100);
      const totalAmount = subtotal + taxAmount;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          customerId: payload.customerId,
          subtotal,
          taxRate: taxRateNum,
          taxAmount,
          totalAmount,
          notes: payload.notes || null,
          itemsJson: JSON.stringify(payload.items),
          dueDate: payload.dueDate,
          status: "sent",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la création");
      }

      const newInvoice = (await res.json()) as Invoice;
      setInvoices((prev) => [newInvoice, ...prev]);
      toast.success(`Facture ${newInvoice.number} créée`);
      setDialogOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création"
      );
    } finally {
      setCreating(false);
    }
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Facturation
        </h2>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => setDialogOpen(true)}
          disabled={!businessId}
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </Button>
      </motion.div>

      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour voir vos factures.
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Receipt className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold">Aucune facture</h3>
            <p className="text-sm text-muted-foreground">
              Cliquez sur &laquo;&nbsp;Nouvelle facture&nbsp;&raquo; pour créer
              votre première.
            </p>
            <Button
              className="gap-1"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Créer une facture
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Numéro</TableHead>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {inv.number}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(inv.createdAt)}
                      </TableCell>
                      <TableCell>
                        {inv.customer ? (
                          <div>
                            <div className="text-sm font-medium">
                              {inv.customer.name}
                            </div>
                            {inv.customer.phone && (
                              <div className="text-xs text-muted-foreground">
                                {inv.customer.phone}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Client comptoir
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatFCFA(inv.totalAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cfg.className}
                        >
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 gap-1"
                            onClick={() => handleViewPdf(inv.id)}
                            title="Voir PDF"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="hidden sm:inline">PDF</span>
                          </Button>
                          {inv.status !== "paid" &&
                            inv.status !== "cancelled" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                onClick={() => handleMarkPaid(inv)}
                                disabled={updatingId === inv.id}
                                title="Marquer comme payée"
                              >
                                {updatingId === inv.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">Payée</span>
                              </Button>
                            )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                            onClick={() => setDeleteTarget(inv)}
                            disabled={deletingId === inv.id}
                            title="Supprimer"
                            aria-label={`Supprimer la facture ${inv.number}`}
                          >
                            {deletingId === inv.id ? (
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

      {invoices.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {invoices.length} facture{invoices.length > 1 ? "s" : ""}
        </p>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer cette commande/client/facture/devis ? Cette action est
              irréversible.
              {deleteTarget && (
                <span className="block mt-1 font-mono text-xs">
                  {deleteTarget.number}
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

      {/* New invoice dialog */}
      <NewInvoiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        businessId={businessId}
        onCreate={handleCreate}
        creating={creating}
      />
    </div>
  );
}

// ============================================================
// New Invoice Dialog (form)
// ============================================================
interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onCreate: (payload: {
    customerId: string | null;
    items: InvoiceItemInput[];
    taxRate: number;
    notes: string;
    dueDate: string | null;
  }) => void;
  creating: boolean;
}

function NewInvoiceDialog({
  open,
  onOpenChange,
  businessId,
  onCreate,
  creating,
}: NewInvoiceDialogProps) {
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [customerId, setCustomerId] = useState<string>("none");
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { name: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");

  // Fetch customers when dialog opens
  useEffect(() => {
    if (!open || !businessId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/customers?businessId=${encodeURIComponent(businessId)}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as CustomerLite[];
        if (!cancelled) setCustomers(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, businessId]);

  // Wrap onOpenChange so we can reset form state when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCustomerId("none");
      setItems([{ name: "", quantity: 1, unitPrice: 0, totalPrice: 0 }]);
      setTaxRate(0);
      setNotes("");
      setDueDate("");
    }
    onOpenChange(nextOpen);
  };

  const updateItem = (
    idx: number,
    field: keyof InvoiceItemInput,
    value: string
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === "name") {
        item.name = value;
      } else if (field === "quantity") {
        item.quantity = Math.max(1, parseInt(value, 10) || 1);
      } else if (field === "unitPrice") {
        item.unitPrice = parseFCFA(value);
      }
      // Recalculate total
      item.totalPrice = item.quantity * item.unitPrice;
      next[idx] = item;
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { name: "", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + (it.totalPrice || 0), 0),
    [items]
  );
  const taxAmount = Math.round((subtotal * (taxRate || 0)) / 100);
  const total = subtotal + taxAmount;

  const validItems = items.filter((it) => it.name.trim() && it.totalPrice > 0);

  const handleSubmit = () => {
    if (validItems.length === 0) {
      toast.error("Ajoutez au moins un article avec un nom et un prix");
      return;
    }
    onCreate({
      customerId: customerId === "none" ? null : customerId,
      items: validItems,
      taxRate: taxRate || 0,
      notes,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Nouvelle facture
          </DialogTitle>
          <DialogDescription>
            Créez une facture pour un client. Le numéro sera généré
            automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer select */}
          <div className="space-y-2">
            <Label htmlFor="customer-select">Client (optionnel)</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer-select">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Client comptoir —</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Articles</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addItem}
                className="gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ligne
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-end rounded-md border border-border p-2"
                >
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Désignation
                    </Label>
                    <Input
                      value={it.name}
                      onChange={(e) =>
                        updateItem(idx, "name", e.target.value)
                      }
                      placeholder="Nom de l'article"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Qté</Label>
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", e.target.value)
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-3 space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      P.U. (FCFA)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(idx, "unitPrice", e.target.value)
                      }
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <div className="text-xs text-muted-foreground mb-1">
                      Total
                    </div>
                    <div className="text-sm font-semibold">
                      {formatFCFA(it.totalPrice)}
                    </div>
                  </div>
                  {items.length > 1 && (
                    <div className="col-span-12 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(idx)}
                        className="h-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 gap-1"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        Retirer
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tax + totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">TVA (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                min={0}
                max={100}
                value={taxRate || ""}
                onChange={(e) =>
                  setTaxRate(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                }
                placeholder="0"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due-date">Échéance (optionnel)</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          {/* Totals summary */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span className="font-medium">{formatFCFA(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                TVA ({taxRate || 0}%)
              </span>
              <span className="font-medium">{formatFCFA(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="font-bold">Total TTC</span>
              <span className="font-bold text-primary">
                {formatFCFA(total)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Conditions (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions de paiement, délai de livraison..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
            className="gap-1"
          >
            <X className="w-4 h-4" />
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={creating} className="gap-1">
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            Créer la facture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
