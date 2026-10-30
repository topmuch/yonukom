// ============================================================
// YonuKom — Order History (POS + e-com)
// Liste / tableau de toutes les commandes (ventes) du business
// Filtres par statut + badge basé sur paidAmount, ouverture du détail,
// impression du reçu (POST /api/orders/[id]/receipt), marquer comme payée.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Receipt,
  Search,
  Eye,
  Filter,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  Trash2,
  Printer,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  OrderDetailDialog,
  type OrderDetailData,
} from "@/components/orders/order-detail-dialog";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";
import type { EcomOrderStatus, PaymentMethod } from "@/types/index";

// Shape returned by GET /api/orders (with included orderItems.product, customer, payments)
interface ApiOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: { id: string; name: string; imageUrl?: string | null } | null;
}

interface ApiPayment {
  id: string;
  amount: number;
  method: string;
  createdAt: string;
}

interface ApiOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
  deliveryAddress?: string | null;
  customer: { id: string; name: string; phone: string };
  orderItems: ApiOrderItem[];
  payments: ApiPayment[];
}

// Filtres disponibles (POV POS)
type StatusFilter = "all" | "paid" | "unpaid" | "partial" | "pending" | "delivered" | "cancelled";

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "paid", label: "Payés" },
  { id: "unpaid", label: "Non payés" },
  { id: "pending", label: "En attente" },
  { id: "delivered", label: "Livrés" },
  { id: "cancelled", label: "Annulés" },
];

// Détermine le "bucket de paiement" d'une commande à partir du paidAmount, du status et du orderType.
// Renvoie : "paid" | "partial" | "unpaid" | "pending" | "delivered" | "cancelled"
function paymentBucket(order: ApiOrder): "paid" | "partial" | "unpaid" | "pending" | "delivered" | "cancelled" {
  // Annulée : prioritaire
  if (order.status === "cancelled" || (order as ApiOrder & { isCancelled?: boolean }).isCancelled) {
    return "cancelled";
  }
  // Livré : status delivered ou shipped (commande livrée au client)
  if (order.status === "delivered" || order.status === "shipped") {
    return "delivered";
  }
  // Pending : status pending/draft/to_pay/to_ship etc. ET aucun paiement reçu
  const pendingStatuses = ["pending", "draft", "to_pay", "to_ship", "quote_validated", "delivery_note"];
  if (pendingStatuses.includes(order.status) && order.paidAmount === 0) {
    return "pending";
  }
  // Cas payé / partiel / non payé basé sur paidAmount
  if (order.paidAmount >= order.totalAmount && order.totalAmount > 0) {
    return "paid";
  }
  if (order.paidAmount > 0 && order.paidAmount < order.totalAmount) {
    return "partial";
  }
  // paidAmount = 0 → non payé (si la commande n'est pas explicitement "pending")
  return "unpaid";
}

const BUCKET_LABELS: Record<string, string> = {
  paid: "Payé",
  partial: "Partiel",
  unpaid: "Non payé",
  pending: "En attente",
  delivered: "Livré",
  cancelled: "Annulée",
};

const BUCKET_BADGE_CLASS: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  partial: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  unpaid: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  pending: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  delivered: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  cancelled: "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/30",
};

// Map des libellés lisibles par statut brut (pour OrderDetailDialog)
const STATUS_LABELS: Record<string, string> = {
  to_pay: "À payer",
  to_ship: "À livrer",
  shipped: "Livrée",
  cancelled: "Annulée",
  completed: "Terminée",
  pending: "En attente",
  draft: "Brouillon",
  quote_validated: "Devis validé",
  delivery_note: "Bon de livraison",
  invoiced: "Facturée",
  paid: "Payée",
  unpaid: "Non payée",
  partial: "Partiellement payée",
  delivered: "Livrée",
};

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildDetailData(order: ApiOrder): OrderDetailData {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: (order.status as EcomOrderStatus) ?? "to_pay",
    totalAmount: order.totalAmount,
    paidAmount: order.paidAmount,
    remainingAmount: order.remainingAmount,
    customer: {
      id: order.customer.id,
      name: order.customer.name,
      phone: order.customer.phone,
    },
    orderItems: order.orderItems.map((it) => ({
      id: it.id,
      productName: it.product?.name ?? "Article",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      createdAt: p.createdAt,
    })),
    paymentMethod: (order.payments[0]?.method as PaymentMethod) ?? "cash",
    whatsappSent: false,
    deliveryAddress: order.deliveryAddress ?? undefined,
    createdAt: order.createdAt,
  };
}

export function OrderHistory() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiOrder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!businessId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error("Échec du chargement");
      }
      const data = (await res.json()) as ApiOrder[];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    const bucket = paymentBucket(o);
    const matchStatus =
      statusFilter === "all" || bucket === statusFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleOpen = (order: ApiOrder) => {
    setSelectedOrder(buildDetailData(order));
    setDetailOpen(true);
  };

  // --- Mark as paid : PUT /api/orders/[id] { status: "paid" } ---
  const handleMarkPaid = async (order: ApiOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!businessId) return;
    setMarkingPaidId(order.id);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          status: "paid",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la mise à jour");
      }
      const updated = (await res.json()) as ApiOrder;
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      toast.success(`Commande ${order.orderNumber} marquée comme payée`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la mise à jour du statut"
      );
    } finally {
      setMarkingPaidId(null);
    }
  };

  // --- Delete order ---
  const handleDelete = async () => {
    if (!deleteTarget || !businessId) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(
        `/api/orders/${deleteTarget.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression");
      }
      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      toast.success(`Commande ${deleteTarget.orderNumber} supprimée`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    all: orders.length,
    paid: orders.filter((o) => paymentBucket(o) === "paid").length,
    unpaid: orders.filter((o) => paymentBucket(o) === "unpaid").length,
    partial: orders.filter((o) => paymentBucket(o) === "partial").length,
    pending: orders.filter((o) => paymentBucket(o) === "pending").length,
    delivered: orders.filter((o) => paymentBucket(o) === "delivered").length,
    cancelled: orders.filter((o) => paymentBucket(o) === "cancelled").length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          Historique des ventes
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Ajouter une commande
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={fetchOrders}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Filter className="w-3.5 h-3.5" />
            )}
            Actualiser
          </Button>
        </div>
      </motion.div>

      {/* Search + filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = counts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`
                  shrink-0 inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors
                  ${isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }
                `}
              >
                {tab.label}
                <span
                  className={`text-[10px] rounded-full px-1.5 ${
                    isActive ? "bg-white/20" : "bg-foreground/10"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <OrderHistorySkeleton />
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <XCircle className="w-8 h-8 text-destructive mx-auto" />
            <p className="text-sm font-medium">Erreur de chargement</p>
            <p className="text-xs text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchOrders}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Receipt className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold">Aucune commande</h3>
            <p className="text-sm text-muted-foreground">
              {search
                ? "Aucune commande ne correspond à votre recherche."
                : statusFilter === "all"
                ? "Les ventes apparaîtront ici dès qu'elles seront encaissées."
                : `Aucune commande ${STATUS_TABS.find((t) => t.id === statusFilter)?.label.toLowerCase()}.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop / tablet view: table */}
          <div className="hidden sm:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-border text-xs text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 font-medium">Numéro</th>
                      <th className="px-3 py-2.5 font-medium">Client</th>
                      <th className="px-3 py-2.5 font-medium text-center">Articles</th>
                      <th className="px-3 py-2.5 font-medium text-right">Total</th>
                      <th className="px-3 py-2.5 font-medium">Statut</th>
                      <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {filteredOrders.map((order) => {
                        const bucket = paymentBucket(order);
                        const itemCount = order.orderItems.reduce(
                          (s, i) => s + i.quantity,
                          0
                        );
                        const isUnpaid = bucket === "unpaid" || bucket === "partial";
                        return (
                          <motion.tr
                            key={order.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                            onClick={() => handleOpen(order)}
                          >
                            <td className="px-3 py-2.5 text-xs text-muted-foreground">
                              {formatShortDate(order.createdAt)}
                            </td>
                            <td className="px-3 py-2.5 font-mono text-xs font-medium">
                              {order.orderNumber}
                            </td>
                            <td className="px-3 py-2.5 truncate max-w-[160px]">
                              {order.customer?.name ?? "Client comptoir"}
                            </td>
                            <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                              {order.orderItems.length} ({itemCount} art.)
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-yk-emerald">
                              {formatFCFA(order.totalAmount)}
                            </td>
                            <td className="px-3 py-2.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${BUCKET_BADGE_CLASS[bucket]}`}
                              >
                                {BUCKET_LABELS[bucket]}
                              </Badge>
                              {bucket === "partial" && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  Payé {formatFCFA(order.paidAmount)}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Marquer comme payée (visible uniquement si non payée et non annulée) */}
                                {isUnpaid && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                    disabled={markingPaidId === order.id}
                                    onClick={(e) => handleMarkPaid(order, e)}
                                    title="Marquer comme payée"
                                    aria-label={`Marquer la commande ${order.orderNumber} comme payée`}
                                  >
                                    {markingPaidId === order.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                  </Button>
                                )}
                                {/* Imprimer le reçu */}
                                <a
                                  href={`/api/orders/${order.id}/receipt`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex"
                                  title="Imprimer le reçu"
                                  aria-label={`Imprimer le reçu de la commande ${order.orderNumber}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpen(order);
                                  }}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Voir
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === order.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget(order);
                                  }}
                                  title="Supprimer"
                                  aria-label={`Supprimer la commande ${order.orderNumber}`}
                                >
                                  {deletingId === order.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Mobile view: list */}
          <div className="sm:hidden space-y-2">
            <AnimatePresence initial={false}>
              {filteredOrders.map((order) => {
                const bucket = paymentBucket(order);
                const itemCount = order.orderItems.reduce(
                  (s, i) => s + i.quantity,
                  0
                );
                const isUnpaid = bucket === "unpaid" || bucket === "partial";
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleOpen(order)}
                    >
                      <CardContent className="p-3 space-y-2">
                        {/* Top row: order # + status */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-semibold">
                            {order.orderNumber}
                          </span>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${BUCKET_BADGE_CLASS[bucket]}`}
                            >
                              {BUCKET_LABELS[bucket]}
                            </Badge>
                            <a
                              href={`/api/orders/${order.id}/receipt`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex"
                              title="Imprimer le reçu"
                              aria-label={`Imprimer le reçu de la commande ${order.orderNumber}`}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          </div>
                        </div>

                        {/* Customer + items */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground truncate max-w-[60%]">
                            {order.customer?.name ?? "Client comptoir"}
                          </span>
                          <span className="text-muted-foreground">
                            {itemCount} article{itemCount > 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Date + total */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatShortDate(order.createdAt)}
                          </span>
                          <span className="font-bold text-sm text-yk-emerald">
                            {formatFCFA(order.totalAmount)}
                          </span>
                        </div>

                        {bucket === "partial" && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400">
                            Payé {formatFCFA(order.paidAmount)} — reste {formatFCFA(order.remainingAmount)}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[10px] text-destructive hover:text-destructive disabled:opacity-50"
                            disabled={deletingId === order.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(order);
                            }}
                            aria-label={`Supprimer la commande ${order.orderNumber}`}
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Supprimer
                          </button>
                          {isUnpaid ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                              disabled={markingPaidId === order.id}
                              onClick={(e) => handleMarkPaid(order, e)}
                              aria-label={`Marquer la commande ${order.orderNumber} comme payée`}
                            >
                              {markingPaidId === order.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Marquer payée
                            </button>
                          ) : (
                            <span className="text-[10px] text-primary flex items-center gap-0.5">
                              Voir le détail
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
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
            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer cette commande ? Cette action est irréversible.
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

      {/* Detail dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={(_orderId, _newStatus) => {
          // After status change, refresh the list and close dialog
          fetchOrders();
          setDetailOpen(false);
        }}
      />

      {/* Create order dialog */}
      <CreateOrderDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          fetchOrders();
        }}
      />
    </div>
  );
}

// --- Skeleton ---
function OrderHistorySkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Re-export for convenience
export { OrderHistory as OrderHistoryTab };
export type { ApiOrder };
