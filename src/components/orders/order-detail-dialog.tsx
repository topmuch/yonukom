// ============================================================
// YonuKom — Order Detail Dialog
// Full order details with actions (payment, WhatsApp, status change)
// ============================================================

"use client";

import { formatFCFA } from "@/lib/fcfa";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Receipt,
} from "lucide-react";
import type { EcomOrderStatus, PaymentMethod } from "@/types/index";

export interface OrderDetailData {
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
    createdAt: string;
  }[];
  paymentMethod: PaymentMethod;
  whatsappSent: boolean;
  deliveryAddress?: string;
  createdAt: string;
}

interface OrderDetailDialogProps {
  order: OrderDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (orderId: string, newStatus: EcomOrderStatus) => void;
}

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cash: "Espèces",
  cb: "Carte Bancaire",
  cheque: "Chèque",
  virement: "Virement",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  to_pay: { label: "À Payer", color: "bg-yk-amber/10 text-yk-amber border-yk-amber/20" },
  to_ship: { label: "À Livrer", color: "bg-primary/10 text-primary border-primary/20" },
  shipped: { label: "Livré", color: "bg-yk-emerald/10 text-yk-emerald border-yk-emerald/20" },
  cancelled: { label: "Annulé", color: "bg-destructive/10 text-destructive border-destructive/20" },
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

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
}: OrderDetailDialogProps) {
  if (!order) return null;

  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.to_pay;

  const handleWhatsApp = () => {
    const link = generateWhatsAppLink({
      customerPhone: `221${order.customer.phone}`,
      customerName: order.customer.name,
      orderNumber: order.orderNumber,
      items: order.orderItems.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: order.totalAmount,
      businessName: "YonuKom",
      paymentMethod: order.paymentMethod === "wave" ? "wave" : order.paymentMethod === "orange_money" ? "orange_money" : undefined,
    });
    window.open(link, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {order.orderNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails de la commande {order.orderNumber}
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
              {formatTimeAgo(order.createdAt)}
            </span>
          </div>

          {/* Customer */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{order.customer.name}</p>
            <div className="flex items-center gap-2">
              <a
                href={`tel:+221${order.customer.phone}`}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" />
                {order.customer.phone}
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

          {/* Delivery address */}
          {order.deliveryAddress && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{order.deliveryAddress}</span>
            </div>
          )}

          <Separator />

          {/* Order items */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Articles</h4>
            {order.orderItems.map((item) => (
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
              <span className="font-bold text-yk-emerald">{formatFCFA(order.totalAmount)}</span>
            </div>
            {order.paidAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payé</span>
                <span className="font-medium text-yk-emerald">{formatFCFA(order.paidAmount)}</span>
              </div>
            )}
            {order.remainingAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reste</span>
                <span className="font-medium text-yk-amber">{formatFCFA(order.remainingAmount)}</span>
              </div>
            )}
          </div>

          {/* Payment info */}
          {order.payments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold">Paiements</h4>
                {order.payments.map((p) => (
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
            {order.status === "to_pay" && (
              <Button
                className="w-full gap-2"
                onClick={() => onStatusChange?.(order.id, "to_ship")}
              >
                <Truck className="w-4 h-4" />
                Marquer payé → À Livrer
              </Button>
            )}
            {order.status === "to_ship" && (
              <Button
                className="w-full gap-2 bg-yk-emerald hover:bg-yk-emerald/90 text-white"
                onClick={() => onStatusChange?.(order.id, "shipped")}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confimer la livraison
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
