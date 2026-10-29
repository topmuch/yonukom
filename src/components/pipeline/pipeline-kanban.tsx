// ============================================================
// YonuKom — B2B Pipeline Kanban Board
// 4 columns: Brouillon | Devis Validé | BL | Facturé
// Mobile-first with scroll columns, action buttons per card
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { QuoteCard, type QuoteCardData } from "./quote-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  FileText,
  CheckCircle2,
  Truck,
  Receipt,
  Building2,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Trash2,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { formatFCFA } from "@/lib/fcfa";
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
import type { B2BOrderStatus } from "@/types/index";

/** Full quote shape from /api/b2b-quotes */
interface B2BQuote {
  id: string;
  orderNumber: string;
  status: B2BOrderStatus;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deliveryAddress?: string;
  deliveryDate?: string | null;
  isDelivered: boolean;
  isCancelled: boolean;
  whatsappSent: boolean;
  isOfflineCreated: boolean;
  businessId: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    isB2B: boolean;
    creditLimit?: number;
  };
  orderItems: {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    createdAt?: string;
    paidAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/** Column configuration for the 4 B2B pipeline stages */
const COLUMNS: {
  status: B2BOrderStatus;
  label: string;
  icon: React.ElementType;
  emptyMsg: string;
  color: string;
}[] = [
  {
    status: "draft",
    label: "Brouillon",
    icon: FileText,
    emptyMsg: "Aucun devis en brouillon",
    color: "text-slate-500",
  },
  {
    status: "quote_validated",
    label: "Devis Validé",
    icon: CheckCircle2,
    emptyMsg: "Aucun devis validé",
    color: "text-yk-amber",
  },
  {
    status: "delivery_note",
    label: "Bon de Livraison",
    icon: Truck,
    emptyMsg: "Aucun bon de livraison",
    color: "text-primary",
  },
  {
    status: "invoiced",
    label: "Facturé",
    icon: Receipt,
    emptyMsg: "Aucune facture",
    color: "text-yk-emerald",
  },
];

const B2B_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Brouillon", color: "bg-slate-100 text-slate-700 border-slate-200" },
  quote_validated: { label: "Devis Validé", color: "bg-yk-amber/10 text-yk-amber border-yk-amber/20" },
  delivery_note: { label: "Bon de Livraison", color: "bg-primary/10 text-primary border-primary/20" },
  invoiced: { label: "Facturé", color: "bg-yk-emerald/10 text-yk-emerald border-yk-emerald/20" },
  cancelled: { label: "Annulé", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  cb: "Carte Bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

/** Detect payment method from the quote's payments */
function detectPaymentMethod(quote: B2BQuote): string {
  if (quote.payments.length > 0) {
    return quote.payments[0].method;
  }
  return "cash";
}

/** Format relative time in French */
function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  return `il y a ${diffD}j`;
}

export function PipelineKanban() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<B2BQuote | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch quotes from /api/b2b-quotes
  const fetchQuotes = useCallback(async () => {
    // Pas de businessId valide → liste vide (pas de données démo).
    if (!businessId || businessId === "demo") {
      setQuotes([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/b2b-quotes?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuotes(Array.isArray(data) ? data : data.quotes || []);
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Handle status change (optimistic local update)
  const handleStatusChange = async (quoteId: string, newStatus: B2BOrderStatus) => {
    // Optimistic update
    setQuotes((prev) =>
      prev.map((q) =>
        q.id === quoteId
          ? {
              ...q,
              status: newStatus,
              isDelivered: newStatus === "delivery_note" ? true : q.isDelivered,
              updatedAt: new Date().toISOString(),
            }
          : q
      )
    );

    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on error
        setQuotes((prev) =>
          prev.map((q) =>
            q.id === quoteId
              ? {
                  ...q,
                  status:
                    newStatus === "quote_validated"
                      ? "draft"
                      : newStatus === "delivery_note"
                        ? "quote_validated"
                        : "delivery_note",
                  isDelivered: false,
                }
              : q
          )
        );
      }
    } catch {
      // Revert on error
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === quoteId
            ? {
                ...q,
                status:
                  newStatus === "quote_validated"
                    ? "draft"
                    : newStatus === "delivery_note"
                      ? "quote_validated"
                      : "delivery_note",
                isDelivered: false,
              }
            : q
        )
      );
    }
  };

  // Handle WhatsApp for a quote
  const handleWhatsApp = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    const link = generateWhatsAppLink({
      customerPhone: quote.customer.phone,
      customerName: quote.customer.name,
      orderNumber: quote.orderNumber,
      items: quote.orderItems.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: quote.totalAmount,
      businessName: "YonuKom",
    });
    window.open(link, "_blank");
  };

  // Find selected quote for detail dialog
  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId) || null;

  // --- Delete quote ---
  const handleDelete = async () => {
    if (!deleteTarget || !businessId) return;
    const target = deleteTarget;
    setDeletingId(target.id);
    try {
      const res = await fetch(
        `/api/quotes/${target.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression");
      }
      setQuotes((prev) => prev.filter((q) => q.id !== target.id));
      toast.success(`Devis ${target.orderNumber} supprimé`);
      setSelectedQuoteId(null);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Compute pipeline summary stats
  const totalPipelineValue = quotes
    .filter((q) => q.status !== "cancelled")
    .reduce((sum, q) => sum + q.totalAmount, 0);
  const totalRemainingValue = quotes
    .filter((q) => q.status !== "cancelled")
    .reduce((sum, q) => sum + q.remainingAmount, 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="space-y-3">
              <Skeleton className="h-8 w-28" />
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (quotes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12"
      >
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-lg">Aucun devis B2B</h3>
            <p className="text-sm text-muted-foreground">
              Vos devis B2B apparaîtront ici.
              <br />
              Créez votre premier devis depuis le POS !
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Pipeline B2B
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            {quotes.length} devis
          </Badge>
          <span className="text-xs text-muted-foreground">
            Pipeline: {formatFCFA(totalPipelineValue)}
          </span>
          {totalRemainingValue > 0 && (
            <span className="text-xs text-yk-amber">
              Reste: {formatFCFA(totalRemainingValue)}
            </span>
          )}
        </div>
      </motion.div>

      {/* Kanban Columns — 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {COLUMNS.map((col) => {
          const colQuotes = quotes.filter((q) => q.status === col.status);
          const Icon = col.icon;
          const colTotal = colQuotes.reduce((sum, q) => sum + q.totalAmount, 0);

          return (
            <div key={col.status} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {colQuotes.length}
                </Badge>
              </div>

              {/* Column total */}
              {colQuotes.length > 0 && (
                <div className="px-1 text-[10px] text-muted-foreground">
                  {formatFCFA(colTotal)}
                </div>
              )}

              {/* Column content */}
              <ScrollArea className="sm:max-h-[70vh]">
                <div className="space-y-2 pr-1">
                  <AnimatePresence mode="popLayout">
                    {colQuotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={{
                          id: quote.id,
                          orderNumber: quote.orderNumber,
                          status: quote.status,
                          totalAmount: quote.totalAmount,
                          paidAmount: quote.paidAmount,
                          remainingAmount: quote.remainingAmount,
                          customer: quote.customer,
                          paymentMethod: detectPaymentMethod(quote),
                          createdAt: quote.createdAt,
                          isDelivered: quote.isDelivered,
                        }}
                        onStatusChange={handleStatusChange}
                        onClick={(id) => setSelectedQuoteId(id)}
                        onWhatsApp={handleWhatsApp}
                      />
                    ))}
                  </AnimatePresence>

                  {colQuotes.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-xs text-muted-foreground">{col.emptyMsg}</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Quote Detail Dialog */}
      {selectedQuote && (
        <QuoteDetailPanel
          quote={selectedQuote}
          onClose={() => setSelectedQuoteId(null)}
          onStatusChange={handleStatusChange}
          onWhatsApp={handleWhatsApp}
          onDelete={(q) => {
            setSelectedQuoteId(null);
            setDeleteTarget(q);
          }}
          deleting={deletingId === selectedQuote.id}
        />
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
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer cette commande/client/facture/devis ? Cette action est
              irréversible.
              {deleteTarget && (
                <span className="block mt-1 font-mono text-xs">
                  {deleteTarget.orderNumber}
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
// Inline Quote Detail Panel (dialog)
// Shows full quote details with items, payments, actions
// ============================================================

function QuoteDetailPanel({
  quote,
  onClose,
  onStatusChange,
  onWhatsApp,
  onDelete,
  deleting,
}: {
  quote: B2BQuote;
  onClose: () => void;
  onStatusChange: (quoteId: string, newStatus: B2BOrderStatus) => void;
  onWhatsApp: (quoteId: string) => void;
  onDelete: (quote: B2BQuote) => void;
  deleting?: boolean;
}) {
  const statusCfg = B2B_STATUS_CONFIG[quote.status] || B2B_STATUS_CONFIG.draft;

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {quote.orderNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails du devis {quote.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status + time */}
          <div className="flex items-center justify-between">
            <Badge className={`${statusCfg.color} border text-xs font-medium`}>
              {statusCfg.label}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(quote.createdAt)}
            </span>
          </div>

          {/* Customer */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{quote.customer.name}</p>
              {quote.customer.isB2B && (
                <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-primary/10 text-primary">
                  B2B
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${quote.customer.phone}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {quote.customer.phone}
              </a>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => onWhatsApp(quote.id)}
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Delivery address */}
          {quote.deliveryAddress && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{quote.deliveryAddress}</span>
            </div>
          )}

          <Separator />

          {/* Order items */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Articles</h4>
            {quote.orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <span className="truncate">{item.productName}</span>
                  <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                </div>
                <span className="font-medium ml-2">{formatFCFA(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-yk-emerald">{formatFCFA(quote.totalAmount)}</span>
            </div>
            {quote.paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payé</span>
                <span className="font-medium text-yk-emerald">{formatFCFA(quote.paidAmount)}</span>
              </div>
            )}
            {quote.remainingAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reste</span>
                <span className="font-medium text-yk-amber">{formatFCFA(quote.remainingAmount)}</span>
              </div>
            )}
          </div>

          {/* Payments history */}
          {quote.payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold">Paiements</h4>
                {quote.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <Badge variant="outline" className="text-[10px]">
                      {PAYMENT_LABELS[p.method] || p.method}
                    </Badge>
                    <span className="font-medium">{formatFCFA(p.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Action buttons */}
          <Separator />
          <div className="space-y-2">
            {quote.status === "draft" && (
              <div className="flex gap-2">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => onStatusChange(quote.id, "quote_validated")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ✅ Valider le devis
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => onWhatsApp(quote.id)}
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </div>
            )}
            {quote.status === "quote_validated" && (
              <Button
                className="w-full gap-2"
                onClick={() => onStatusChange(quote.id, "delivery_note")}
              >
                <Truck className="w-4 h-4" />
                📦 Créer le Bon de Livraison
              </Button>
            )}
            {quote.status === "delivery_note" && (
              <Button
                className="w-full gap-2 bg-yk-emerald hover:bg-yk-emerald/90 text-white"
                onClick={() => onStatusChange(quote.id, "invoiced")}
              >
                <Receipt className="w-4 h-4" />
                🧾 Émettre la Facture
              </Button>
            )}
            {quote.status === "invoiced" && (
              <div className="text-sm text-center text-muted-foreground">
                {quote.remainingAmount === 0 ? (
                  <span className="text-yk-emerald font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Facture soldée
                  </span>
                ) : (
                  <span>
                    En attente de paiement — reste{" "}
                    <strong className="text-yk-amber">{formatFCFA(quote.remainingAmount)}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Delete button — available for all statuses */}
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
              disabled={deleting}
              onClick={() => onDelete(quote)}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Supprimer ce devis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
