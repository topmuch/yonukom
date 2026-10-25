// ============================================================
// YonuKom — B2B Quote Card for Pipeline Kanban
// Displays B2B quote info with action buttons for status transitions
// Key differences from e-commerce OrderCard:
// - Status is B2BOrderStatus (draft/quote_validated/delivery_note/invoiced/cancelled)
// - Shows acompte (deposit) progress if partially paid
// - B2B badge on customer
// - Different action buttons per status
// ============================================================

"use client";

import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Phone,
  MessageCircle,
  ChevronRight,
  CheckCircle2,
  Truck,
  Receipt,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";
import type { B2BOrderStatus } from "@/types/index";

export interface QuoteCardData {
  id: string;
  orderNumber: string;
  status: B2BOrderStatus;
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
  paymentMethod: string;
  createdAt: string;
  isDelivered: boolean;
}

interface QuoteCardProps {
  quote: QuoteCardData;
  onStatusChange?: (quoteId: string, newStatus: B2BOrderStatus) => void;
  onClick?: (quoteId: string) => void;
  onWhatsApp?: (quoteId: string) => void;
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

/** Payment method badge config */
const PAYMENT_BADGES: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  wave: { label: "Wave", variant: "default" },
  orange_money: { label: "OM", variant: "secondary" },
  cash: { label: "Espèces", variant: "outline" },
  cb: { label: "CB", variant: "outline" },
  cheque: { label: "Chèque", variant: "outline" },
  virement: { label: "Virement", variant: "outline" },
};

/** Left border color per B2B status */
const STATUS_BORDER_COLORS: Record<string, string> = {
  draft: "var(--yk-slate, #64748b)",
  quote_validated: "var(--yk-amber, #f59e0b)",
  delivery_note: "var(--primary, #1e3a5f)",
  invoiced: "var(--yk-emerald, #10b981)",
  cancelled: "var(--destructive, #ef4444)",
};

export function QuoteCard({
  quote,
  onStatusChange,
  onClick,
  onWhatsApp,
}: QuoteCardProps) {
  const payBadge = PAYMENT_BADGES[quote.paymentMethod] || PAYMENT_BADGES.cash;
  const status = quote.status;

  // Acompte progress: show if partially paid
  const showAcompte =
    quote.paidAmount > 0 && quote.remainingAmount > 0;
  const acomptePercent =
    quote.totalAmount > 0
      ? Math.round((quote.paidAmount / quote.totalAmount) * 100)
      : 0;

  // Fully paid indicator
  const isFullyPaid =
    quote.paidAmount > 0 && quote.remainingAmount === 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
        style={{
          borderLeftColor: STATUS_BORDER_COLORS[status] || STATUS_BORDER_COLORS.draft,
        }}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header: Quote number + time */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">
              {quote.orderNumber}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(quote.createdAt)}
            </span>
          </div>

          {/* Customer info with B2B badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground truncate flex-1">
              {quote.customer.name}
            </span>
            {quote.customer.isB2B && (
              <Badge
                variant="secondary"
                className="text-[9px] px-1 py-0 bg-primary/10 text-primary shrink-0"
              >
                <Building2 className="w-2.5 h-2.5 mr-0.5" />
                B2B
              </Badge>
            )}
            <a
              href={`tel:${quote.customer.phone}`}
              className="text-muted-foreground hover:text-primary shrink-0 min-w-[20px] min-h-[20px] flex items-center justify-center"
              aria-label={`Appeler ${quote.customer.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Total + payment badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-yk-emerald">
              {formatFCFA(quote.totalAmount)}
            </span>
            <Badge variant={payBadge.variant} className="text-[10px] px-1.5 py-0">
              {payBadge.label}
            </Badge>
          </div>

          {/* Acompte progress bar (partial payment) */}
          {showAcompte && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Acompte: {formatFCFA(quote.paidAmount)}</span>
                <span>{acomptePercent}%</span>
              </div>
              <Progress value={acomptePercent} className="h-1.5" />
              <div className="text-[10px] text-yk-amber">
                Reste: {formatFCFA(quote.remainingAmount)}
              </div>
            </div>
          )}

          {/* Fully paid indicator */}
          {isFullyPaid && (
            <div className="flex items-center gap-1 text-[10px] text-yk-emerald">
              <CheckCircle2 className="w-3 h-3" />
              Payé intégralement
            </div>
          )}

          {/* Action buttons per status */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* draft: Valider + WhatsApp */}
            {status === "draft" && (
              <>
                <Button
                  size="sm"
                  className="h-10 min-h-[48px] text-xs gap-1 flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange?.(quote.id, "quote_validated");
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ✅ Valider
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 min-h-[48px] w-10 p-0 shrink-0 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWhatsApp?.(quote.id);
                  }}
                  aria-label="Envoyer via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* quote_validated: Livrer */}
            {status === "quote_validated" && (
              <Button
                size="sm"
                className="h-10 min-h-[48px] text-xs gap-1 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(quote.id, "delivery_note");
                }}
              >
                <Truck className="w-3.5 h-3.5" />
                📦 Livrer
              </Button>
            )}

            {/* delivery_note: Facturer */}
            {status === "delivery_note" && (
              <Button
                size="sm"
                className="h-10 min-h-[48px] text-xs gap-1 flex-1 bg-yk-emerald hover:bg-yk-emerald/90 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(quote.id, "invoiced");
                }}
              >
                <Receipt className="w-3.5 h-3.5" />
                🧾 Facturer
              </Button>
            )}

            {/* invoiced: view only — shows payment status */}
            {status === "invoiced" && (
              <div className="flex items-center gap-1.5 w-full">
                {isFullyPaid ? (
                  <span className="text-xs text-yk-emerald font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Soldé
                  </span>
                ) : (
                  <span className="text-xs text-yk-amber font-medium">
                    Reste {formatFCFA(quote.remainingAmount)}
                  </span>
                )}
              </div>
            )}

            {/* Detail button (always available) */}
            <Button
              variant="ghost"
              size="sm"
              className="h-10 min-h-[48px] w-10 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(quote.id);
              }}
              aria-label="Voir détails"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
