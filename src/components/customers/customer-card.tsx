// ============================================================
// YonuKom — Customer Card
// Displays customer info with payment method + B2B badge + address
// ============================================================

"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Phone } from "lucide-react";
import { motion } from "framer-motion";

export interface CustomerCardData {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  paymentMethod?: string;
  isB2B?: boolean;
  totalOrders?: number;
}

interface CustomerCardProps {
  customer: CustomerCardData;
  onClick?: (customer: CustomerCardData) => void;
}

const PAYMENT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  wave: { label: "Wave", variant: "default" },
  orange_money: { label: "OM", variant: "secondary" },
  cash: { label: "Espèces", variant: "outline" },
  cb: { label: "CB", variant: "outline" },
};

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  const payInfo = PAYMENT_LABELS[customer.paymentMethod || "cash"] || PAYMENT_LABELS.cash;
  const address = customer.address?.trim();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={() => onClick?.(customer)}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left min-h-[48px]"
      >
        {/* Avatar initial */}
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary">
            {customer.name.charAt(0).toUpperCase()}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{customer.name}</span>
            {customer.isB2B && (
              <Badge className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20 border">
                B2B
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </span>
          </div>
          {address && (
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[200px]" title={address}>
                {address}
              </span>
            </div>
          )}
        </div>

        {/* Right side: payment + orders */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={payInfo.variant} className="text-[10px] px-1.5 py-0">
            {payInfo.label}
          </Badge>
          {customer.totalOrders !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              {customer.totalOrders} cmd{customer.totalOrders > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>
    </motion.div>
  );
}
