"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Package,
  Truck,
  Phone,
  MapPin,
  Clock,
  Loader2,
  ShoppingBag,
  Bell,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "sonner";

interface OnlineOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OnlineOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  deliveryMethod: string;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  items: OnlineOrderItem[];
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-300" },
  CONFIRMED: { label: "Confirmée", className: "bg-blue-100 text-blue-700 border-blue-300" },
  COMPLETED: { label: "Terminée", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  CANCELLED: { label: "Annulée", className: "bg-rose-100 text-rose-700 border-rose-300" },
};

export function OnlineOrdersTab() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // L'API online-orders résout le tenantId à partir du businessId
  // (le login renvoie businessId, pas tenantId).
  const businessId = user?.businessId;

  // Référence des IDs de commandes PENDING déjà vus (pour détecter les nouvelles)
  const seenPendingIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);

  const fetchOrders = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qs = filter === "ALL" ? "" : `&status=${filter}`;
      const res = await fetch(`/api/online-orders?businessId=${businessId}${qs}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Détection des nouvelles commandes PENDING (notification) ---
  // Toutes les 30s, on interroge l'API pour les commandes en attente.
  // Si de nouvelles apparaissent (IDs non vus), on affiche un toast + on
  // rafraîchit la liste affichée.
  const checkNewPendingOrders = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/online-orders?businessId=${businessId}&status=PENDING`
      );
      if (!res.ok) return;
      const data = await res.json();
      const pending: OnlineOrder[] = data.orders || [];
      const currentIds = new Set(pending.map((o) => o.id));
      const seen = seenPendingIdsRef.current;

      // Nouvelles commandes = IDs présents maintenant mais pas dans `seen`
      const newOrders = pending.filter((o) => !seen.has(o.id));

      if (!firstLoadRef.current && newOrders.length > 0) {
        // Toast pour chaque nouvelle commande (max 3 toasts pour éviter le spam)
        for (const o of newOrders.slice(0, 3)) {
          toast.success(
            `🛒 Nouvelle commande de ${o.customerName} — ${formatFCFA(o.totalAmount)}`,
            { duration: 8000 }
          );
        }
        if (newOrders.length > 3) {
          toast.success(`+${newOrders.length - 3} autre(s) commande(s)`);
        }
        // Rafraîchir la liste affichée si l'utilisateur est sur PENDING ou ALL
        if (filter === "PENDING" || filter === "ALL") {
          fetchOrders();
        }
      }

      // Mettre à jour les IDs vus
      seenPendingIdsRef.current = currentIds;
      firstLoadRef.current = false;
    } catch {
      // Silencieux — le polling ne doit pas casser l'UI
    }
  }, [businessId, filter, fetchOrders]);

  useEffect(() => {
    if (!businessId) return;
    // Premier check immédiat (pour peupler seenPendingIds sans toaster)
    checkNewPendingOrders();
    // Puis toutes les 30s
    const interval = setInterval(checkNewPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [businessId, checkNewPendingOrders]);

  const handleAction = async (orderId: string, action: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    setActionLoading(orderId + action);
    try {
      const res = await fetch(`/api/online-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success(
        action === "CONFIRMED" ? "Commande confirmée" :
        action === "CANCELLED" ? "Commande annulée — stock libéré" :
        "Commande terminée"
      );
      fetchOrders();
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filters = [
    { key: "PENDING", label: "En attente" },
    { key: "CONFIRMED", label: "Confirmées" },
    { key: "COMPLETED", label: "Terminées" },
    { key: "CANCELLED", label: "Annulées" },
    { key: "ALL", label: "Toutes" },
  ];

  return (
    <div className="px-4 py-6 space-y-4">
      <ConnectivityBanner />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Commandes en ligne
            {filter === "PENDING" && orders.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-300 animate-pulse">
                <Bell className="w-3 h-3" />
                {orders.length} en attente
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Commandes reçues depuis votre boutique en ligne — actualisé
            automatiquement toutes les 30s
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="shrink-0 text-xs h-8"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
          </CardContent>
        </Card>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm mb-1">Aucune commande</p>
            <p className="text-xs text-muted-foreground">
              {filter === "PENDING"
                ? "Aucune commande en attente. Les nouvelles commandes apparaîtront ici."
                : "Aucune commande dans cette catégorie."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order, idx) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={order.status === "PENDING" ? "border-amber-300" : ""}>
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{order.customerName}</p>
                          <Badge variant="outline" className={`text-[10px] ${statusConfig.className}`}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <p className="font-bold text-base text-primary">
                        {formatFCFA(order.totalAmount)}
                      </p>
                    </div>

                    {/* Customer info */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${order.customerPhone}`} className="hover:text-primary">
                          {order.customerPhone}
                        </a>
                      </span>
                      {order.deliveryMethod === "DELIVERY" && order.deliveryAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {order.deliveryAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        {order.deliveryMethod === "DELIVERY" ? (
                          <Truck className="w-3 h-3" />
                        ) : (
                          <Package className="w-3 h-3" />
                        )}
                        {order.deliveryMethod === "DELIVERY" ? "Livraison" : "Retrait"}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="bg-muted/50 rounded-lg p-2.5 space-y-1">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700">
                            {item.quantity}× {item.name}
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatFCFA(item.totalPrice)}
                          </span>
                        </div>
                      ))}
                      {order.deliveryFee > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                          <span className="text-muted-foreground">Livraison</span>
                          <span className="text-muted-foreground tabular-nums">
                            {formatFCFA(order.deliveryFee)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {order.status === "PENDING" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={() => handleAction(order.id, "CONFIRMED")}
                          disabled={actionLoading === order.id + "CONFIRMED"}
                        >
                          {actionLoading === order.id + "CONFIRMED" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Confirmer
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50"
                          onClick={() => handleAction(order.id, "CANCELLED")}
                          disabled={actionLoading === order.id + "CANCELLED"}
                        >
                          {actionLoading === order.id + "CANCELLED" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          Annuler
                        </Button>
                      </div>
                    )}

                    {order.status === "CONFIRMED" && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5"
                          onClick={() => handleAction(order.id, "COMPLETED")}
                          disabled={actionLoading === order.id + "COMPLETED"}
                        >
                          {actionLoading === order.id + "COMPLETED" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Marquer comme terminée
                        </Button>
                        {/* WhatsApp contact button */}
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, "").startsWith("221") ? order.customerPhone.replace(/\D/g, "") : "221" + order.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Bonjour ${order.customerName}, votre commande chez ${user?.businessName || "notre boutique"} est confirmée! Total: ${formatFCFA(order.totalAmount)}. Merci!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            WhatsApp
                          </Button>
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
