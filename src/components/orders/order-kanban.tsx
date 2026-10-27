// ============================================================
// YonuKom — Order Kanban Board
// 3 columns: À Payer | À Livrer | Livré
// Mobile-first with scroll columns, action buttons per card
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { OrderCard, type OrderCardData } from "./order-card";
import { OrderDetailDialog, type OrderDetailData } from "./order-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, ShoppingCart, Package, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import type { EcomOrderStatus } from "@/types/index";
import { useAuthStore } from "@/stores/use-auth-store";

interface EcomOrder {
  id: string;
  orderNumber: string;
  status: EcomOrderStatus;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  customerId: string;
  customer: { id: string; name: string; phone: string };
  orderItems: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  payments: { id: string; amount: number; method: string; createdAt: string }[];
  paymentMethod: string;
  whatsappSent: boolean;
  createdAt: string;
}

const COLUMNS: { status: EcomOrderStatus; label: string; icon: React.ElementType; emptyMsg: string; color: string }[] = [
  {
    status: "to_pay",
    label: "À Payer",
    icon: ShoppingCart,
    emptyMsg: "Aucune commande en attente de paiement",
    color: "text-yk-amber",
  },
  {
    status: "to_ship",
    label: "À Livrer",
    icon: Package,
    emptyMsg: "Aucune commande à livrer",
    color: "text-primary",
  },
  {
    status: "shipped",
    label: "Livré",
    icon: CheckCircle2,
    emptyMsg: "Aucune commande livrée",
    color: "text-yk-emerald",
  },
];

export function OrderKanban() {
  const [orders, setOrders] = useState<EcomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    // Pas de businessId valide → liste vide (pas de données démo).
    if (!businessId || businessId === "demo") {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/ecom-orders?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle status change
  const handleStatusChange = async (orderId: string, newStatus: EcomOrderStatus) => {
    try {
      const res = await fetch("/api/ecom-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch {
      // silently fail
    }
  };

  // Handle WhatsApp
  const handleWhatsApp = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
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
    });
    window.open(link, "_blank");
  };

  // Find selected order for detail dialog
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((col) => (
            <div key={col} className="space-y-3">
              <Skeleton className="h-8 w-24" />
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12"
      >
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Receipt className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-lg">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">
              Vos commandes e-commerce apparaîtront ici.
              <br />
              Créez votre première commande depuis le POS !
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
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Commandes E-Commerce
        </h2>
        <Badge variant="outline" className="text-xs">
          {orders.length} commande{orders.length > 1 ? "s" : ""}
        </Badge>
      </motion.div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col.status);
          const Icon = col.icon;

          return (
            <div key={col.status} className="space-y-2">
              {/* Column header */}
              <div className="flex items-center gap-2 px-1">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <span className="font-semibold text-sm">{col.label}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {colOrders.length}
                </Badge>
              </div>

              {/* Column content */}
              <ScrollArea className="sm:max-h-[70vh]">
                <div className="space-y-2 pr-1">
                  <AnimatePresence mode="popLayout">
                    {colOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={{
                          id: order.id,
                          orderNumber: order.orderNumber,
                          status: order.status,
                          totalAmount: order.totalAmount,
                          paidAmount: order.paidAmount,
                          remainingAmount: order.remainingAmount,
                          customer: order.customer,
                          paymentMethod: order.paymentMethod as "cash" | "wave" | "orange_money" | "cb" | "cheque" | "virement",
                          createdAt: order.createdAt,
                          whatsappSent: order.whatsappSent,
                        }}
                        onStatusChange={handleStatusChange}
                        onClick={(id) => setSelectedOrderId(id)}
                        onWhatsApp={handleWhatsApp}
                      />
                    ))}
                  </AnimatePresence>

                  {colOrders.length === 0 && (
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

      {/* Detail Dialog */}
      <OrderDetailDialog
        order={
          selectedOrder
            ? {
                ...selectedOrder,
                paymentMethod: selectedOrder.paymentMethod as "cash" | "wave" | "orange_money" | "cb" | "cheque" | "virement",
              }
            : null
        }
        open={!!selectedOrderId}
        onOpenChange={(open) => {
          if (!open) setSelectedOrderId(null);
        }}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
