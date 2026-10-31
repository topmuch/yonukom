"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Package, CheckCircle2, XCircle, Loader2, Truck,
  ClipboardCheck, MapPin, Phone, Store, Clock, ShoppingBag,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

// ============================================================
// Page suivi / confirmation de commande
// URL: /b/[slug]/commande/[id]
// ============================================================

interface OrderData {
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string | null;
    deliveryMethod: string;
    deliveryFee: number;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    items: Array<{ name?: string; quantity?: number; unitPrice?: number; totalPrice?: number }>;
    createdAt: string;
    updatedAt: string;
  };
  store: { name: string; primaryColor: string; ownerPhone: string | null };
  timeline: {
    steps: Array<{ key: string; label: string; desc: string; icon: string }>;
    cancelled: boolean;
    currentStep: number;
    createdAt: string;
    updatedAt: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const orderId = params.id as string;

  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/orders/${encodeURIComponent(orderId)}?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Commande introuvable");
          throw new Error("Erreur");
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, orderId]);

  const primaryColor = data?.store.primaryColor || "#059669";

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return iso; }
  };
  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };
  const formatPrice = (n: number) => n.toLocaleString("fr-FR");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-slate-800 dark:border-t-slate-200 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Récupération de votre commande...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <div className="text-center space-y-3 max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{error || "Commande introuvable"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Vérifiez le lien de suivi ou contactez le vendeur.</p>
          <button onClick={() => router.push(`/b/${slug}`)} className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: primaryColor }}>
            <ArrowLeft className="w-4 h-4" /> Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const { order, store, timeline } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push(`/b/${slug}`)} aria-label="Retour" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 dark:text-slate-500">{store.name}</p>
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">Suivi de commande</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Statut principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: timeline.cancelled ? "#ef444420" : primaryColor + "20" }}>
              {timeline.cancelled ? (
                <XCircle className="w-6 h-6 text-rose-500" />
              ) : order.status === "COMPLETED" ? (
                <CheckCircle2 className="w-6 h-6" style={{ color: primaryColor }} />
              ) : (
                <Package className="w-6 h-6" style={{ color: primaryColor }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 dark:text-slate-500">Commande {order.orderNumber}</p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {timeline.cancelled ? "Commande annulée" : STATUS_LABELS[order.status] || order.status}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Passée le {formatDate(order.createdAt)} à {formatTime(order.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-slate-400 dark:text-slate-500">Total</p>
              <p className="text-lg font-bold" style={{ color: primaryColor }}>{formatPrice(order.totalAmount)} FCFA</p>
            </div>
          </div>
        </motion.div>

        {/* Timeline */}
        {!timeline.cancelled && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: primaryColor }} /> Progression
            </h3>
            <div className="space-y-0">
              {timeline.steps.map((step, i) => {
                const isDone = i <= timeline.currentStep;
                const isCurrent = i === timeline.currentStep;
                const Icon = step.icon === "check" ? CheckCircle2 : step.icon === "truck" ? Truck : ClipboardCheck;
                return (
                  <div key={step.key} className="flex gap-3 pb-6 last:pb-0 relative">
                    {/* Ligne verticale */}
                    {i < timeline.steps.length - 1 && (
                      <div className={`absolute left-[18px] top-9 bottom-0 w-0.5 ${i < timeline.currentStep ? "" : "bg-slate-200 dark:bg-slate-700"}`} style={i < timeline.currentStep ? { backgroundColor: primaryColor } : {}} />
                    )}
                    <div className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${isDone ? "text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`} style={isDone ? { backgroundColor: primaryColor } : {}}>
                      <Icon className="w-4 h-4" />
                      {isCurrent && (
                        <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: primaryColor }} />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`text-sm font-semibold ${isDone ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`}>{step.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</p>
                      {isCurrent && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: primaryColor }}>
                          En cours
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Détail de la commande */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" style={{ color: primaryColor }} /> Articles
          </h3>
          <div className="space-y-2">
            {order.items.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun détail disponible.</p>
            ) : (
              order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name || "Produit"}</p>
                    <p className="text-xs text-slate-400">{item.quantity} × {formatPrice(item.unitPrice || 0)} FCFA</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{formatPrice(item.totalPrice || 0)} FCFA</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {order.deliveryMethod === "DELIVERY" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Livraison</span>
                <span className="text-slate-700 dark:text-slate-200">{order.deliveryFee > 0 ? `${formatPrice(order.deliveryFee)} FCFA` : "Gratuite"}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Total</span>
              <span className="text-base font-bold" style={{ color: primaryColor }}>{formatPrice(order.totalAmount)} FCFA</span>
            </div>
          </div>
        </div>

        {/* Infos livraison + paiement */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              {order.deliveryMethod === "DELIVERY" ? <Truck className="w-3.5 h-3.5" /> : <Store className="w-3.5 h-3.5" />}
              {order.deliveryMethod === "DELIVERY" ? "Livraison" : "Retrait en boutique"}
            </h4>
            {order.deliveryMethod === "DELIVERY" && order.deliveryAddress ? (
              <p className="text-sm text-slate-700 dark:text-slate-200 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" /> {order.deliveryAddress}
              </p>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-200">À récupérer chez {store.name}</p>
            )}
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Contact
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-200">{order.customerName}</p>
            <p className="text-xs text-slate-400">{order.customerPhone}</p>
            {store.ownerPhone && (
              <a href={`https://wa.me/${store.ownerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, j'ai une question sur la commande ${order.orderNumber}`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#25D366" }}>
                Contacter le vendeur
              </a>
            )}
          </div>
        </div>

        {/* Paiement */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Paiement</h4>
          <p className="text-sm text-slate-700 dark:text-slate-200">
            {order.paymentMethod === "CASH_ON_DELIVERY" ? "À la livraison (espèces)" : "Wave / Orange Money"}
          </p>
        </div>

        {/* CTA */}
        <button onClick={() => router.push(`/b/${slug}`)} className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
          <Store className="w-4 h-4" /> Retour à la boutique
        </button>
      </main>
    </div>
  );
}
