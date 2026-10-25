// ============================================================
// YonuKom — Order Card for Kanban Board
// Displays order info with action buttons for status transitions
// ============================================================

"use client";

import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Phone, MessageCircle, ChevronRight, Truck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { EcomOrderStatus, PaymentMethod } from "@/types/index";

export interface OrderCardData {
  id: string;
  orderNumber: string;
  status: EcomOrderStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  paymentMethod: PaymentMethod;
  createdAt: string;
  whatsappSent: boolean;
}

interface OrderCardProps {
  order: OrderCardData;
  onStatusChange?: (orderId: string, newStatus: EcomOrderStatus) => void;
  onClick?: (orderId: string) => void;
  onWhatsApp?: (orderId: string) => void;
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

const PAYMENT_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  wave: { label: "Wave", variant: "default" },
  orange_money: { label: "OM", variant: "secondary" },
  cash: { label: "Espèces", variant: "outline" },
  cb: { label: "CB", variant: "outline" },
  cheque: { label: "Chèque", variant: "outline" },
  virement: { label: "Virement", variant: "outline" },
};

export function OrderCard({ order, onStatusChange, onClick, onWhatsApp }: OrderCardProps) {
  const payBadge = PAYMENT_BADGES[order.paymentMethod] || PAYMENT_BADGES.cash;
  const status = order.status;

  // Determine available transitions
  const canMoveToPay = status !== "to_pay" && status !== "shipped" && status !== "cancelled";
  const canMoveToShip = status === "to_pay";
  const canMarkShipped = status === "to_ship";

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
          borderLeftColor:
            status === "to_pay"
              ? "var(--yk-amber, #f59e0b)"
              : status === "to_ship"
                ? "var(--primary, #1e3a5f)"
                : "var(--yk-emerald, #10b981)",
        }}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header: Order number + time */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-foreground">{order.orderNumber}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(order.createdAt)}
            </span>
          </div>

          {/* Customer info */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-foreground truncate flex-1">{order.customer.name}</span>
            <a
              href={`tel:+221${order.customer.phone}`}
              className="text-muted-foreground hover:text-primary shrink-0"
              aria-label={`Appeler ${order.customer.name}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Total + payment badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm text-yk-emerald">
              {formatFCFA(order.totalAmount)}
            </span>
            <Badge variant={payBadge.variant} className="text-[10px] px-1.5 py-0">
              {payBadge.label}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            {/* WhatsApp button for to_pay */}
            {status === "to_pay" && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onWhatsApp?.(order.id);
                }}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </Button>
            )}

            {/* Status transition buttons */}
            {canMoveToShip && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(order.id, "to_ship");
                }}
              >
                <Truck className="w-3.5 h-3.5" />
                → Livrer
              </Button>
            )}
            {canMarkShipped && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-yk-emerald hover:bg-yk-emerald/90 text-white flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(order.id, "shipped");
                }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                ✓ Livré
              </Button>
            )}
            {canMoveToPay && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 flex-1 border-yk-amber/40 text-yk-amber"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(order.id, "to_pay");
                }}
              >
                → Payer
              </Button>
            )}

            {/* Expand button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(order.id);
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
