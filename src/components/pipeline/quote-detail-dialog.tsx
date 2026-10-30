// ============================================================
// YonuKom — Quote Detail Dialog (B2B Pipeline)
// Full quote details with B2B status labels, acompte section,
// credit limit, action buttons, cancel AlertDialog, WhatsApp,
// payment progress bar
// ============================================================

"use client";

import { useState } from "react";
import { formatFCFA } from "@/lib/fcfa";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  CreditCard,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import type { B2BOrderStatus } from "@/types/index";

// --- Interfaces ---

export interface QuoteDetailData {
  id: string;
  orderNumber: string;
  status: B2BOrderStatus;
  subtotal: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customer: {
    id: string;
    name: string;
    phone: string;
    isB2B: boolean;
    creditLimit?: number;
  };
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    isDeposit: boolean;
    reference?: string;
    createdAt: string;
  }[];
  deliveryAddress?: string;
  isDelivered: boolean;
  isCancelled: boolean;
  createdAt: string;
}

interface QuoteDetailDialogProps {
  quote: QuoteDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (quoteId: string, newStatus: B2BOrderStatus) => void;
}

// --- Constants ---

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  cb: "Carte Bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

const B2B_STATUS_CONFIG: Record<
  B2BOrderStatus,
  { label: string; color: string }
> = {
  draft: {
    label: "Brouillon",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  quote_validated: {
    label: "Devis Validé",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  delivery_note: {
    label: "Bon de Livraison",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  invoiced: {
    label: "Facturé",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Annulé",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

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

// --- Component ---

export function QuoteDetailDialog({
  quote,
  open,
  onOpenChange,
  onStatusChange,
}: QuoteDetailDialogProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!quote) return null;

  const statusCfg = B2B_STATUS_CONFIG[quote.status];
  const paymentProgress =
    quote.totalAmount > 0
      ? Math.min(100, Math.round((quote.paidAmount / quote.totalAmount) * 100))
      : 0;

  const handleWhatsApp = () => {
    const link = generateWhatsAppLink({
      customerPhone: quote.customer.phone.startsWith("221")
        ? quote.customer.phone
        : `221${quote.customer.phone}`,
      customerName: quote.customer.name,
      orderNumber: quote.orderNumber,
      items: quote.items.map((item) => ({
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

  const handleStatusAction = (newStatus: B2BOrderStatus) => {
    onStatusChange?.(quote.id, newStatus);
  };

  const handleCancelConfirm = () => {
    if (!cancelReason.trim()) return;
    onStatusChange?.(quote.id, "cancelled");
    setCancelOpen(false);
    setCancelReason("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
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
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                    B2B
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`tel:+${quote.customer.phone}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {quote.customer.phone}
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-3 h-3" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Credit limit */}
            {quote.customer.creditLimit != null && quote.customer.creditLimit > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Limite de crédit :{" "}
                  <span className="font-medium text-foreground">
                    {formatFCFA(quote.customer.creditLimit)}
                  </span>
                </span>
              </div>
            )}

            {/* Delivery address */}
            {quote.deliveryAddress && (
              <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{quote.deliveryAddress}</span>
              </div>
            )}

            <Separator />

            {/* Quote items */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Articles</h4>
              {quote.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="truncate">{item.productName}</span>
                    <span className="text-muted-foreground ml-1">
                      ×{item.quantity}
                    </span>
                  </div>
                  <span className="font-medium ml-2">
                    {formatFCFA(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatFCFA(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-emerald-600">
                  {formatFCFA(quote.totalAmount)}
                </span>
              </div>
              {quote.paidAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payé</span>
                  <span className="font-medium text-emerald-600">
                    {formatFCFA(quote.paidAmount)}
                  </span>
                </div>
              )}
              {quote.remainingAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reste</span>
                  <span className="font-medium text-amber-600">
                    {formatFCFA(quote.remainingAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment progress bar */}
            {quote.totalAmount > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progression paiement</span>
                  <span>{paymentProgress}%</span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
              </div>
            )}

            {/* Payments with acompte badges */}
            {quote.payments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Paiements</h4>
                  {quote.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {PAYMENT_LABELS[p.method] || p.method}
                        </Badge>
                        {p.isDeposit && (
                          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 border">
                            Acompte
                          </Badge>
                        )}
                        {p.reference && (
                          <span className="text-[10px] text-muted-foreground">
                            ref: {p.reference}
                          </span>
                        )}
                      </div>
                      <span className="font-medium">{formatFCFA(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Action buttons per status */}
            <Separator />
            <div className="space-y-2">
              {quote.status === "draft" && (
                <Button
                  className="w-full gap-2"
                  onClick={() => handleStatusAction("quote_validated")}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  ✅ Valider le devis
                </Button>
              )}
              {quote.status === "quote_validated" && (
                <Button
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => handleStatusAction("delivery_note")}
                >
                  <Truck className="w-4 h-4" />
                  📦 Créer Bon de Livraison
                </Button>
              )}
              {quote.status === "delivery_note" && (
                <Button
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                  onClick={() => handleStatusAction("invoiced")}
                >
                  <CreditCard className="w-4 h-4" />
                  🧾 Créer Facture
                </Button>
              )}

              {/* Cancel button — available for any non-cancelled status */}
              {quote.status !== "cancelled" && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setCancelOpen(true)}
                >
                  <XCircle className="w-4 h-4" />
                  ❌ Annuler
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel AlertDialog with mandatory reason */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le devis</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis {quote.orderNumber} sera
              annulé. Veuillez saisir un motif d&apos;annulation obligatoire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Motif d'annulation (obligatoire)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setCancelReason("");
              }}
            >
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={!cancelReason.trim()}
              className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
            >
              Confirmer l&apos;annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
