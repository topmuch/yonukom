// ============================================================
// YonuKom — Cart Drawer / Panel
// Panneau de commande pour le POS :
//  - Desktop (lg+) : panneau sticky à droite, plein hauteur
//  - Mobile       : bottom Sheet (slide up)
//
// Contenu (haut → bas) :
//  1. Header "Commande" + badge items
//  2. Sélecteur de type (Sur place / À emporter / Livraison)
//  3. Sélecteur de client (Select)
//  4. Liste d'articles (scrollable) avec quantité + prix ligne + poubelle
//  5. Sous-total
//  6. Frais de livraison (visible seulement si type = Livraison)
//  7. TOTAL (orange, gras, grand)
//  8. Grille 2×2 de boutons de paiement (Espèces / Wave / OM / Carte)
//  9. Après vente : panneau de succès avec impression du ticket
//
// Règles métier :
//  - Bloque l'encaissement si aucune session de caisse ouverte
//  - Transmet customerId, orderType, deliveryFee au backend
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConnectivityStore } from "@/stores/use-connectivity-store";
import { useSyncQueueStore } from "@/stores/use-sync-queue-store";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Waves,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Loader2,
  CheckCircle2,
  Printer,
  Lock,
  Landmark,
  Utensils,
  ShoppingBag,
  Bike,
  X,
  ArrowRight,
  MessageCircle,
  Send,
  AlertCircle,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Payment methods ---
type PaymentMethod = "cash" | "wave" | "orange_money" | "cb";
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  cb: "Carte bancaire",
};

// --- Order types ---
type OrderType = "dine_in" | "takeaway" | "delivery";
const ORDER_TYPES: {
  value: OrderType;
  label: string;
  Icon: typeof Utensils;
}[] = [
  { value: "dine_in", label: "Sur place", Icon: Utensils },
  { value: "takeaway", label: "À emporter", Icon: ShoppingBag },
  { value: "delivery", label: "Livraison", Icon: Bike },
];
const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

// Configurations visuelles des boutons de paiement (2×2 grid)
const PAYMENT_BUTTONS: {
  value: PaymentMethod;
  label: string;
  Icon: typeof Banknote;
  className: string;
}[] = [
  {
    value: "cash",
    label: "Espèces",
    Icon: Banknote,
    className: "bg-emerald-500 hover:bg-emerald-600",
  },
  {
    value: "wave",
    label: "Wave",
    Icon: Waves,
    className: "bg-[#1DC2FF] hover:bg-[#0FB0EE]",
  },
  {
    value: "orange_money",
    label: "Orange Money",
    Icon: Smartphone,
    className: "bg-orange-500 hover:bg-orange-600",
  },
  {
    value: "cb",
    label: "Carte",
    Icon: CreditCard,
    className: "bg-slate-700 hover:bg-slate-800",
  },
];

// Type partiel de l'Order renvoyé par POST /api/orders
interface CreatedOrder {
  id: string;
  orderNumber?: string;
  totalAmount?: number;
  subtotal?: number;
  paymentMethod?: PaymentMethod;
  deliveryFee?: number;
  orderType?: OrderType;
  createdAt?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  phone?: string;
}

interface CartDrawerProps {
  /** Is the mobile sheet open? */
  open: boolean;
  /** Toggle open state (mobile only) */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback appelé quand l'utilisateur veut ouvrir la caisse.
   * Switch la navigation vers l'onglet Caisse.
   */
  onNavigateToCash?: () => void;
  /** Liste des clients (options du Select) — passée par PosScreen */
  customers?: CustomerOption[];
  /** Walk-in customer — première option du Select */
  walkInCustomer?: CustomerOption;
}

export function CartDrawer({
  open,
  onOpenChange,
  onNavigateToCash,
  customers = [],
  walkInCustomer = { id: "walk-in", name: "Client comptoir", phone: "" },
}: CartDrawerProps) {
  // Le panneau contenu est partagé entre mobile (Sheet) et desktop (sticky panel).
  // Sur desktop (lg+), on rend directement le panneau dans la grille du PosScreen ;
  // sur mobile, on le rend dans le Sheet.
  return (
    <>
      {/* Mobile: bottom Sheet */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] max-h-[700px] rounded-t-2xl p-0 flex flex-col lg:hidden"
        >
          <CartPanelContent
            onNavigateToCash={onNavigateToCash}
            onCloseMobile={() => onOpenChange(false)}
            customers={customers}
            walkInCustomer={walkInCustomer}
            isMobile
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

// --- Cart panel content (shared desktop sticky + mobile sheet) ---
interface ActivePromo {
  id: string;
  name: string;
  type: "global" | "product" | "amount";
  percentage: number;
  productId: string | null;
  minAmount: number | null;
  ticketMessage: string | null;
}

interface CartPanelContentProps {
  onNavigateToCash?: () => void;
  onCloseMobile?: () => void;
  customers?: CustomerOption[];
  walkInCustomer: CustomerOption;
  isMobile?: boolean;
}

export function CartPanelContent({
  onNavigateToCash,
  onCloseMobile,
  customers = [],
  walkInCustomer,
  isMobile = false,
}: CartPanelContentProps) {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const customer = useCartStore((s) => s.customer);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const clearCustomer = useCartStore((s) => s.clearCustomer);

  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const enqueue = useSyncQueueStore((s) => s.enqueue);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [cashSessionActive, setCashSessionActive] = useState(false);
  const [cashSessionLoading, setCashSessionLoading] = useState(true);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<CreatedOrder | null>(null);
  // Dialog de paiement Wave (numéro WhatsApp + message + bouton partager)
  const [waveDialogOpen, setWaveDialogOpen] = useState(false);
  const [wavePaymentLink, setWavePaymentLink] = useState<string | null>(null);
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>("");
  const [waveSending, setWaveSending] = useState(false);
  // Type de commande (défaut: Sur place)
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  // Frais de livraison (FCFA — entier)
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<string>("0");
  // Promo active (chargée au montage)
  const [activePromo, setActivePromo] = useState<ActivePromo | null>(null);

  const customerOptions: CustomerOption[] = [walkInCustomer, ...customers];
  const selectedCustomerId = customer?.id ?? "walk-in";

  // Frais de livraison parsé (entier >= 0). Forcé à 0 si pas livraison.
  const deliveryFee =
    orderType === "delivery" ? Math.max(0, parseInt(deliveryFeeInput, 10) || 0) : 0;
  const grandTotal = total + deliveryFee;

  // --- Calcul de la remise promo (si une promo active existe) ---
  const promoDiscount = useMemo(() => {
    if (!activePromo) return 0;
    const pct = activePromo.percentage ?? 0;
    if (pct <= 0) return 0;
    if (activePromo.type === "global") {
      return Math.round((total * pct) / 100);
    }
    if (activePromo.type === "amount") {
      const min = activePromo.minAmount ?? 0;
      if (total >= min) {
        return Math.round((total * pct) / 100);
      }
      return 0;
    }
    if (activePromo.type === "product" && activePromo.productId) {
      const matchingTotal = items
        .filter((it) => it.productId === activePromo.productId)
        .reduce((sum, it) => sum + it.totalPrice, 0);
      return Math.round((matchingTotal * pct) / 100);
    }
    return 0;
  }, [activePromo, total, items]);

  const finalTotal = Math.max(0, grandTotal - promoDiscount);

  // --- Vérifier l'état de la session de caisse au montage ---
  const checkCashSession = useCallback(async () => {
    if (!businessId) {
      setCashSessionActive(false);
      setCashSessionLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/cash-sessions?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as { activeSession?: { id: string } | null };
        setCashSessionActive(Boolean(data.activeSession));
      } else {
        setCashSessionActive(false);
      }
    } catch {
      setCashSessionActive(false);
    } finally {
      setCashSessionLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    checkCashSession();
  }, [checkCashSession]);

  // --- Fetch le lien de paiement Wave du business ---
  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wavePaymentLink) setWavePaymentLink(d.wavePaymentLink);
      })
      .catch(() => {});
  }, [businessId]);

  // --- Fetch la promo active du business (pour appliquer la remise automatiquement) ---
  useEffect(() => {
    if (!businessId) return;
    fetch(`/api/promos?businessId=${encodeURIComponent(businessId)}&active=true`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.promo) setActivePromo(d.promo as ActivePromo);
        else setActivePromo(null);
      })
      .catch(() => setActivePromo(null));
  }, [businessId]);

  // --- Pré-remplir le numéro WhatsApp quand le dialog Wave s'ouvre ---
  useEffect(() => {
    if (waveDialogOpen) {
      // Pré-rempli avec le téléphone du client sélectionné (modifiable)
      setCustomerPhoneInput(customer?.phone ?? "");
    }
  }, [waveDialogOpen, customer]);

  // --- Construire le message WhatsApp pré-rempli ---
  const waveMessage = useMemo(() => {
    if (!wavePaymentLink) return "";
    const businessName = user?.businessName ?? "notre commerce";
    const customerName = customer?.name ?? "Client";
    const msg = `Bonjour ${customerName} ! 👋\n\nMerci pour votre achat chez ${businessName}.\nMontant à payer : ${formatFCFA(finalTotal)} FCFA\n\nCliquez pour payer par Wave :\n${wavePaymentLink}\n\nMerci de confirmer le paiement une fois effectué.`;
    return msg;
  }, [wavePaymentLink, user?.businessName, customer?.name, finalTotal]);

  // --- Normaliser un numéro de téléphone au format international (sans +) ---
  const normalizePhone = (phone: string): string => {
    let cleaned = phone.replace(/\D/g, "");
    // Si commence par 7, 8 ou 9 et fait 9 chiffres → numéro Sénégalais, préfixer 221
    if (cleaned.length === 9 && /^[789]/.test(cleaned)) {
      cleaned = "221" + cleaned;
    }
    // Si commence par 0 → remplacer par 221
    if (cleaned.startsWith("0")) {
      cleaned = "221" + cleaned.slice(1);
    }
    return cleaned;
  };

  // --- Partager le lien de paiement Wave sur WhatsApp du client ---
  const handleShareWaveLink = async () => {
    const normalizedPhone = normalizePhone(customerPhoneInput);
    if (normalizedPhone.length < 9) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez saisir un numéro WhatsApp valide (ex: 78 382 18 22).",
        variant: "destructive",
      });
      return;
    }
    if (!wavePaymentLink) {
      toast({
        title: "Lien Wave manquant",
        description: "Configurez votre lien de paiement Wave dans Paramètres → Profil.",
        variant: "destructive",
      });
      return;
    }
    setWaveSending(true);
    try {
      // Construire l'URL wa.me
      const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(waveMessage)}`;

      // Logger l'envoi dans NotificationLog
      await fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          recipient: normalizedPhone,
          type: "sale_receipt",
          message: waveMessage,
          metadata: JSON.stringify({
            paymentMethod: "wave",
            amount: finalTotal,
            wavePaymentLink,
          }),
        }),
      }).catch(() => {}); // non-bloquant

      // Ouvrir WhatsApp dans un nouvel onglet
      window.open(waUrl, "_blank");
      toast({
        title: "Lien de paiement envoyé 📲",
        description: "Le client va recevoir le lien Wave sur WhatsApp. Cliquez sur 'Marquer comme payée' une fois le paiement reçu.",
      });
      setWaveDialogOpen(false);
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible d'envoyer le lien WhatsApp",
        variant: "destructive",
      });
    } finally {
      setWaveSending(false);
    }
  };

  const handleCheckout = async (method: PaymentMethod, skipWaveDialog = false) => {
    if (items.length === 0) return;

    // --- Vérifier la session de caisse ---
    if (!cashSessionActive) {
      setCashDialogOpen(true);
      return;
    }

    if (!businessId) {
      toast({
        title: "Session expirée",
        description: "Veuillez vous reconnecter pour encaisser la vente.",
        variant: "destructive",
      });
      return;
    }

    // --- Pour Wave : ouvrir le dialog de paiement WhatsApp (sauf si déjà confirmé) ---
    if (method === "wave" && !skipWaveDialog) {
      setWaveDialogOpen(true);
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        businessId,
        customerId: customer?.id ?? null,
        createdBy: user?.id ?? null,
        status: "completed",
        paymentMethod: method,
        orderType,
        deliveryFee,
        promoId: activePromo && promoDiscount > 0 ? activePromo.id : null,
        items: items.map((item) => ({
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
      };

      // --- MODE OFFLINE : mettre en file d'attente ---
      if (!isOnline) {
        // Générer un ID local temporaire
        const localOrderId = `offline_${Date.now()}`;
        enqueue({
          action: "create",
          entityType: "order",
          entityId: localOrderId,
          payload: JSON.stringify(payload),
        });

        // Créer un objet order local pour le success panel
        const localOrder: CreatedOrder = {
          id: localOrderId,
          orderNumber: `OFFLINE-${Date.now().toString().slice(-6)}`,
          totalAmount: finalTotal,
          paymentMethod: method,
          orderType,
          deliveryFee,
          createdAt: new Date().toISOString(),
        };
        setLastOrder(localOrder);

        toast({
          title: "Vente enregistrée hors-ligne 📴",
          description: "Elle sera synchronisée automatiquement quand le réseau reviendra.",
        });
        return;
      }

      // --- MODE EN LIGNE : appel API normal ---
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 403) {
          setCashSessionActive(false);
          setCashDialogOpen(true);
        }
        throw new Error(data.error ?? "Échec de la création de la commande");
      }

      const order = (await res.json()) as CreatedOrder;
      if (!order.paymentMethod) order.paymentMethod = method;
      if (!order.orderType) order.orderType = orderType;
      if (typeof order.deliveryFee !== "number") order.deliveryFee = deliveryFee;
      setLastOrder(order);

      toast({
        title: "Vente encaissée ✓",
        description: order.orderNumber
          ? `Commande ${order.orderNumber} créée avec succès.`
          : "La commande a été créée avec succès.",
      });
    } catch (err) {
      toast({
        title: "Erreur d'encaissement",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // --- Réinitialiser pour une nouvelle vente ---
  const handleNewSale = () => {
    clearCart();
    setLastOrder(null);
    setOrderType("dine_in");
    setDeliveryFeeInput("0");
    onCloseMobile?.();
  };

  const handlePrintReceipt = () => {
    if (!lastOrder) return;
    window.open(
      `/api/orders/${lastOrder.id}/receipt`,
      "_blank",
      "width=400,height=600,noopener,noreferrer"
    );
  };

  const showSuccess = Boolean(lastOrder);
  const cashClosed = !cashSessionActive && !cashSessionLoading;

  return (
    <>
      {/* Warm gradient header strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-yk-coral via-yk-sun to-yk-emerald shrink-0" />

      {/* Header */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E91E63] to-cyan-500 flex items-center justify-center shadow-md shadow-[#E91E63]/30">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base font-semibold leading-none">Commande</h2>
              {itemCount > 0 && (
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {itemCount} article{itemCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCloseMobile?.()}
              aria-label="Fermer le panier"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showSuccess ? (
        <SuccessPanel
          order={lastOrder!}
          customer={customer}
          onNewSale={handleNewSale}
          onPrintReceipt={handlePrintReceipt}
        />
      ) : (
        <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 gap-3">
          {/* --- Order type selector --- */}
          <div className="grid grid-cols-3 gap-1.5 shrink-0">
            {ORDER_TYPES.map(({ value, label, Icon }) => {
              const isActive = orderType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setOrderType(value)}
                  className={`
                    flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-[11px] font-medium transition-colors min-h-[44px]
                    ${isActive
                      ? "bg-yk-emerald/10 border-yk-emerald text-yk-emerald"
                      : "bg-background border-border text-muted-foreground hover:border-yk-emerald/40 hover:text-yk-emerald"
                    }
                  `}
                  aria-pressed={isActive}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* --- Customer selector --- */}
          <div className="shrink-0">
            <Select
              value={selectedCustomerId}
              onValueChange={(val) => {
                if (val === "walk-in" || val === walkInCustomer.id) {
                  clearCustomer();
                } else {
                  const found = customerOptions.find((c) => c.id === val);
                  if (found) {
                    setCustomer({
                      id: found.id,
                      name: found.name,
                      phone: found.phone ?? "",
                    });
                  }
                }
              }}
            >
              <SelectTrigger
                className="w-full h-10 bg-gradient-to-r from-[#E91E63]/5 to-cyan-500/5 border-[#E91E63]/20"
                aria-label="Sélectionner un client"
              >
                <User className="w-4 h-4 text-[#E91E63] mr-1 shrink-0" />
                <SelectValue placeholder="Client comptoir" />
              </SelectTrigger>
              <SelectContent>
                {customerOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.phone && (
                      <span className="text-muted-foreground text-xs ml-2">
                        {c.phone}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- Cart items list (scrollable) --- */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar -mx-1 px-1">
            {items.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center mx-auto mb-2">
                  <ShoppingCart className="w-7 h-7 text-muted-foreground/60" />
                </div>
                <p className="text-muted-foreground text-sm">Panier vide</p>
                <p className="text-muted-foreground/60 text-xs mt-1">
                  Cliquez sur un produit pour l&apos;ajouter
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Articles
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-destructive hover:text-destructive text-xs h-7 px-2"
                  >
                    Vider
                  </Button>
                </div>
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <CartItemRow
                      key={item.productId}
                      productId={item.productId}
                      name={item.productName}
                      salePrice={item.salePrice}
                      quantity={item.quantity}
                      totalPrice={item.totalPrice}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* --- Totals + payment --- */}
          {items.length > 0 && (
            <div className="shrink-0 border-t border-border pt-3 space-y-3">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium tabular-nums">{formatFCFA(total)}</span>
              </div>

              {/* Delivery fee (only if order type = delivery) */}
              {orderType === "delivery" && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label
                    htmlFor="delivery-fee"
                    className="text-muted-foreground shrink-0 flex items-center gap-1.5"
                  >
                    <Bike className="w-3.5 h-3.5" />
                    Frais de livraison
                  </label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={100}
                    value={deliveryFeeInput}
                    onChange={(e) => setDeliveryFeeInput(e.target.value)}
                    className="w-32 h-9 text-right tabular-nums"
                    aria-label="Frais de livraison en FCFA"
                  />
                </div>
              )}

              {/* Promo line (if an active promo applies a discount > 0) */}
              {activePromo && promoDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <Tag className="w-3.5 h-3.5" />
                    Promo ({activePromo.name}, -{activePromo.percentage}%)
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-600">
                    -{formatFCFA(promoDiscount)}
                  </span>
                </div>
              )}

              {/* Grand total (final = subtotal + delivery - promo) */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </span>
                <motion.span
                  key={finalTotal}
                  initial={{ scale: 1.1, color: "#f97316" }}
                  animate={{ scale: 1, color: "#f97316" }}
                  transition={{ duration: 0.2 }}
                  className="text-2xl font-bold text-orange-500 tabular-nums"
                >
                  {formatFCFA(finalTotal)}
                </motion.span>
              </div>

              {/* Cash closed warning */}
              {cashClosed && (
                <Badge
                  variant="outline"
                  className="border-yk-amber/40 text-yk-amber bg-yk-amber/10 gap-1 w-full justify-center py-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Caisse fermée — ouverture requise
                </Badge>
              )}

              {/* Payment buttons grid (2×2) — toujours visibles, désactivés si panier vide */}
              {!cashClosed && (
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_BUTTONS.map(({ value, label, Icon, className }) => {
                    const isDisabled = isCheckingOut || items.length === 0;
                    return (
                      <motion.button
                        key={value}
                        type="button"
                        onClick={() => handleCheckout(value)}
                        disabled={isDisabled}
                        whileTap={isDisabled ? undefined : { scale: 0.97 }}
                        className={`
                          ${className}
                          text-white font-semibold rounded-xl h-14
                          flex items-center justify-center gap-2
                          transition-all
                          ${isDisabled ? "opacity-40 cursor-not-allowed grayscale" : "shadow-sm hover:brightness-110"}
                        `}
                        aria-label={`Encaisser en ${label}`}
                        title={items.length === 0 ? "Ajoutez un produit au panier d'abord" : `Encaisser en ${label}`}
                      >
                        {isCheckingOut ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                        <span className="text-sm">{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Open cash button if closed */}
              {cashClosed && (
                <Button
                  onClick={() => {
                    onCloseMobile?.();
                    onNavigateToCash?.();
                  }}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-yk-amber to-yk-coral text-white shadow-md shadow-yk-amber/30 border-0"
                >
                  <Landmark className="w-4 h-4" />
                  Ouvrir la caisse
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- Dialog "Caisse fermée" --- */}
      <Dialog open={cashDialogOpen} onOpenChange={setCashDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-yk-amber/15">
                <Lock className="w-5 h-5 text-yk-amber" />
              </div>
              Caisse fermée
            </DialogTitle>
            <DialogDescription>
              Vous devez ouvrir une session de caisse avant d&apos;encaisser une
              vente. Allez dans l&apos;onglet &laquo;&nbsp;Caisse&nbsp;&raquo; pour
              ouvrir la caisse.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full gap-2"
              onClick={() => {
                setCashDialogOpen(false);
                onCloseMobile?.();
                onNavigateToCash?.();
              }}
            >
              <Landmark className="w-4 h-4" />
              Ouvrir la caisse
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setCashDialogOpen(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog de paiement Wave (envoi lien WhatsApp) --- */}
      <Dialog open={waveDialogOpen} onOpenChange={setWaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-[#1DC2FF]/15">
                <Waves className="w-5 h-5 text-[#1DC2FF]" />
              </div>
              Paiement par Wave
            </DialogTitle>
            <DialogDescription>
              Total à payer :{" "}
              <span className="font-bold text-foreground">
                {formatFCFA(finalTotal)}
              </span>{" "}
              FCFA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Champ numéro WhatsApp */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                Numéro WhatsApp du client
              </Label>
              <Input
                type="tel"
                value={customerPhoneInput}
                onChange={(e) => setCustomerPhoneInput(e.target.value)}
                placeholder="Ex: 78 382 18 22"
                className="text-base"
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground">
                Le lien de paiement Wave sera envoyé sur ce numéro.
              </p>
            </div>

            {/* Message pré-rempli (aperçu) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Message envoyé au client :
              </Label>
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap text-foreground font-sans">
                  {waveMessage || "Configurez votre lien Wave dans Paramètres → Profil."}
                </pre>
              </div>
            </div>

            {/* Alerte si lien Wave manquant */}
            {!wavePaymentLink && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-300">
                  <p className="font-semibold mb-0.5">Lien Wave non configuré</p>
                  <p>
                    Ajoutez votre lien de paiement Wave dans{" "}
                    <strong>Paramètres → Profil</strong> pour activer ce mode de paiement.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {/* Bouton "Partager sur WhatsApp" */}
            <Button
              className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white"
              onClick={handleShareWaveLink}
              disabled={waveSending || !wavePaymentLink}
            >
              {waveSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Partager sur WhatsApp
            </Button>

            {/* Bouton "Marquer comme payée" (après réception) */}
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                setWaveDialogOpen(false);
                handleCheckout("wave", true);
              }}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Marquer comme payée
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setWaveDialogOpen(false)}
            >
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Success Panel (after checkout) ---
interface SuccessPanelProps {
  order: CreatedOrder;
  customer: { name: string; phone: string } | null;
  onNewSale: () => void;
  onPrintReceipt: () => void;
}

function SuccessPanel({ order, customer, onNewSale, onPrintReceipt }: SuccessPanelProps) {
  return (
    <div className="px-4 pb-6 pt-2 flex-1 flex flex-col items-center text-center overflow-y-auto">
      {/* Check icon */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-yk-emerald to-yk-mint flex items-center justify-center shadow-lg shadow-yk-emerald/40 mb-4"
      >
        <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
      </motion.div>

      <h2 className="text-xl font-bold text-yk-emerald mb-1">Vente encaissée ✓</h2>
      <p className="text-sm text-muted-foreground mb-1">
        La commande a été créée avec succès.
      </p>

      {/* Order details */}
      <div className="w-full mt-3 bg-muted/40 rounded-xl p-3 space-y-1.5 text-sm">
        {order.orderNumber && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">N° commande</span>
            <span className="font-mono font-semibold">{order.orderNumber}</span>
          </div>
        )}
        {order.orderType && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium">
              {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
            </span>
          </div>
        )}
        {typeof order.totalAmount === "number" && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-bold text-yk-emerald">{formatFCFA(order.totalAmount)}</span>
          </div>
        )}
        {order.paymentMethod && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Paiement</span>
            <span className="font-medium">
              {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </span>
          </div>
        )}
        {customer && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Client</span>
            <span className="font-medium truncate max-w-[60%]">{customer.name}</span>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Action buttons */}
      <div className="w-full space-y-2 mt-4">
        <Button
          onClick={onPrintReceipt}
          size="lg"
          className="w-full min-h-[48px] gap-2 bg-gradient-to-r from-[#E91E63] to-cyan-500 hover:from-[#E91E63]/90 hover:to-cyan-500/90 text-white shadow-md shadow-[#E91E63]/30 border-0"
        >
          <Printer className="w-5 h-5" />
          Imprimer le ticket
        </Button>
        <Button
          onClick={onNewSale}
          size="lg"
          variant="outline"
          className="w-full min-h-[48px] gap-2"
        >
          Nouvelle vente
        </Button>
      </div>
    </div>
  );
}

// --- Cart Item Row ---
interface CartItemRowProps {
  productId: string;
  name: string;
  salePrice: number;
  quantity: number;
  totalPrice: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemRow({
  productId,
  name,
  salePrice,
  quantity,
  totalPrice,
  onUpdateQuantity,
  onRemove,
}: CartItemRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2 py-2 border-b border-border/40 last:border-0"
    >
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium leading-tight line-clamp-1">{name}</h4>
        <p className="text-[11px] text-muted-foreground">{formatFCFA(salePrice)} / unité</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateQuantity(productId, quantity - 1);
          }}
          aria-label="Diminuer la quantité"
        >
          <Minus className="w-3 h-3" />
        </Button>

        <motion.span
          key={quantity}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          className="w-7 text-center text-sm font-semibold tabular-nums"
        >
          {quantity}
        </motion.span>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateQuantity(productId, quantity + 1);
          }}
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {/* Line total */}
      <div className="text-right min-w-[64px]">
        <p className="text-sm font-semibold tabular-nums">{formatFCFA(totalPrice)}</p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(productId);
        }}
        aria-label="Retirer du panier"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </motion.div>
  );
}

// --- Floating Cart Button (mobile — opens bottom Sheet) ---
interface CartButtonProps {
  itemCount: number;
  total: number;
  onClick: () => void;
}

export function CartButton({ itemCount, total, onClick }: CartButtonProps) {
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        onClick={onClick}
        size="lg"
        className="w-full min-h-[56px] text-base font-semibold shadow-xl shadow-rose-500/30 relative bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 border-0 rounded-2xl"
      >
        <ShoppingCart className="w-5 h-5 mr-2.5" />
        <span>{itemCount} Article{itemCount > 1 ? "s" : ""}</span>
        <span className="mx-3 w-px h-5 bg-white/30" />
        <span className="font-bold">{formatFCFA(total)}</span>
        <span className="ml-auto flex items-center gap-1 text-sm">
          Voir panier
          <ArrowRight className="w-4 h-4" />
        </span>
      </Button>
    </motion.div>
  );
}
