// ============================================================
// YonuKom — Cart Drawer
// Panier en bottom sheet (Sheet) — slide up depuis le bas
// Contrôles +/- quantité, total FCFA, bouton Encaisser
//
// Règles métier :
//  - Bloque l'encaissement si aucune session de caisse ouverte
//  - Après une vente réussie : propose "Nouvelle vente" + "Imprimer le ticket"
//  - Transmet customerId au backend (null = client comptoir walk-in)
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  User,
  Phone,
  Loader2,
  CheckCircle2,
  Printer,
  Lock,
  Landmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Payment methods ---
type PaymentMethod = "cash" | "wave" | "orange_money" | "cb";
const PAYMENT_METHODS: { value: PaymentMethod; label: string; Icon: typeof Banknote }[] = [
  { value: "cash", label: "Espèces", Icon: Banknote },
  { value: "wave", label: "Wave", Icon: Smartphone },
  { value: "orange_money", label: "Orange", Icon: Wallet },
  { value: "cb", label: "Carte", Icon: CreditCard },
];
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Espèces",
  wave: "Wave",
  orange_money: "Orange Money",
  cb: "Carte bancaire",
};

interface CartDrawerProps {
  /** Is the sheet open? */
  open: boolean;
  /** Toggle open state */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback appelé quand l'utilisateur veut ouvrir la caisse.
   * Switch la navigation vers l'onglet Caisse.
   */
  onNavigateToCash?: () => void;
}

// Type partiel de l'Order renvoyé par POST /api/orders
interface CreatedOrder {
  id: string;
  orderNumber?: string;
  totalAmount?: number;
  subtotal?: number;
  paymentMethod?: PaymentMethod;
}

export function CartDrawer({ open, onOpenChange, onNavigateToCash }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const customer = useCartStore((s) => s.customer);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  // État de la session de caisse — false par défaut, vérifié au montage
  const [cashSessionActive, setCashSessionActive] = useState(false);
  const [cashSessionLoading, setCashSessionLoading] = useState(true);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  // Dernière commande créée — si présent, on affiche l'écran de succès
  const [lastOrder, setLastOrder] = useState<CreatedOrder | null>(null);
  // Moyen de paiement sélectionné (défaut: espèces)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");

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
      // Erreur réseau — on bloque par sécurité
      setCashSessionActive(false);
    } finally {
      setCashSessionLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    checkCashSession();
  }, [checkCashSession]);

  // Re-vérifier à chaque ouverture du tiroir (la caisse a pu être fermée entre-temps)
  useEffect(() => {
    if (open) {
      checkCashSession();
    }
  }, [open, checkCashSession]);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // --- Vérifier la session de caisse (frontend safety check) ---
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

    setIsCheckingOut(true);
    try {
      const payload = {
        businessId,
        // customerId explicite — null = walk-in (le backend résoudra)
        customerId: customer?.id ?? null,
        createdBy: user?.id ?? null,
        status: "completed",
        paymentMethod,
        items: items.map((item) => ({
          // On inclut productId ET name pour que l'API puisse :
          //  - utiliser le produit existant si productId est valide
          //  - créer un article manuel si productId est absent/invalide
          productId: item.productId,
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.salePrice,
        })),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // 403 = caisse fermée (backend safety net)
        if (res.status === 403) {
          setCashSessionActive(false);
          setCashDialogOpen(true);
        }
        throw new Error(data.error ?? "Échec de la création de la commande");
      }

      const order = (await res.json()) as CreatedOrder;
      // Conserver le moyen de paiement choisi pour l'afficher dans le ticket de succès
      if (!order.paymentMethod) {
        order.paymentMethod = paymentMethod;
      }
      setLastOrder(order);

      toast({
        title: "Vente encaissée ✓",
        description: order.orderNumber
          ? `Commande ${order.orderNumber} créée avec succès.`
          : "La commande a été créée avec succès.",
      });

      // Ne pas fermer le tiroir : on affiche l'écran de succès avec le bouton d'impression.
      // Le panier est conservé tant que l'utilisateur n'a pas cliqué "Nouvelle vente".
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
    onOpenChange(false);
  };

  // --- Ouvrir le ticket dans une fenêtre d'impression ---
  const handlePrintReceipt = () => {
    if (!lastOrder) return;
    window.open(
      `/api/orders/${lastOrder.id}/receipt`,
      "_blank",
      "width=400,height=600,noopener,noreferrer"
    );
  };

  // Le tiroir affiche l'écran de succès si lastOrder est présent
  const showSuccess = Boolean(lastOrder);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[600px] rounded-t-2xl p-0">
          {/* Warm gradient header strip */}
          <div className="h-1.5 w-full bg-gradient-to-r from-yk-coral via-yk-sun to-yk-emerald" />
          <SheetHeader className="pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#338BE2] to-cyan-500 flex items-center justify-center shadow-md shadow-[#338BE2]/30">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <SheetTitle className="text-lg">Panier</SheetTitle>
                {itemCount > 0 && (
                  <Badge variant="secondary" className="text-xs bg-yk-emerald/10 text-yk-emerald border-yk-emerald/20">
                    {itemCount} article{itemCount > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
              {items.length > 0 && !showSuccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive text-xs"
                >
                  Vider
                </Button>
              )}
            </div>
            <SheetDescription className="sr-only">
              Votre panier de vente
            </SheetDescription>
          </SheetHeader>

          {/* --- Écran de succès (après encaissement) --- */}
          {showSuccess ? (
            <SuccessPanel
              order={lastOrder!}
              customer={customer}
              onNewSale={handleNewSale}
              onPrintReceipt={handlePrintReceipt}
            />
          ) : (
            <>
              {/* Customer info */}
              {customer && (
                <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-gradient-to-r from-yk-emerald/10 to-yk-mint/10 border border-yk-emerald/20 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-yk-emerald/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-yk-emerald" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-yk-emerald truncate block">{customer.name}</span>
                    {customer.phone && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Cart items */}
              <ScrollArea className="flex-1 px-4 -mx-4">
                {items.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/40 flex items-center justify-center mx-auto mb-3">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                    <p className="text-muted-foreground text-sm">Le panier est vide</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">
                      Appuyez sur un produit pour l&apos;ajouter
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 px-4">
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
              </ScrollArea>

              {/* Footer with total + checkout */}
              {items.length > 0 && (
                <SheetFooter className="border-t border-border pt-3 gap-2 px-4">
                  {/* Payment method selector */}
                  <div className="w-full">
                    <p className="text-[11px] text-muted-foreground mb-1.5">Moyen de paiement</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAYMENT_METHODS.map(({ value, label, Icon }) => {
                        const isActive = paymentMethod === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPaymentMethod(value)}
                            disabled={isCheckingOut}
                            className={`
                              flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-medium transition-colors min-h-[44px]
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
                  </div>

                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <motion.span
                      key={total}
                      initial={{ scale: 1.1, color: "#10B981" }}
                      animate={{ scale: 1, color: "inherit" }}
                      transition={{ duration: 0.2 }}
                      className="text-2xl font-bold text-yk-emerald"
                    >
                      {formatFCFA(total)}
                    </motion.span>
                  </div>

                  {/* Badge "Caisse fermée" quand pas de session active */}
                  {!cashSessionActive && !cashSessionLoading && (
                    <Badge
                      variant="outline"
                      className="self-start mb-1 border-yk-amber/40 text-yk-amber bg-yk-amber/10 gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      Caisse fermée — ouverture requise
                    </Badge>
                  )}

                  <Button
                    onClick={handleCheckout}
                    size="lg"
                    disabled={isCheckingOut}
                    className={`
                      w-full min-h-[52px] text-base font-semibold gap-2 border-0 transition-all active:scale-[0.98]
                      ${!cashSessionActive && !cashSessionLoading
                        ? "bg-gradient-to-r from-yk-amber to-yk-coral text-white shadow-lg shadow-yk-amber/30 opacity-90 hover:opacity-100"
                        : "bg-gradient-to-r from-yk-emerald to-yk-mint hover:from-yk-emerald/90 hover:to-yk-mint/90 text-white shadow-lg shadow-yk-emerald/30"
                      }
                    `}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Encaissement...
                      </>
                    ) : !cashSessionActive && !cashSessionLoading ? (
                      <>
                        <Lock className="w-5 h-5" />
                        Caisse fermée
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Encaisser {formatFCFA(total)}
                      </>
                    )}
                  </Button>
                </SheetFooter>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

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
                onOpenChange(false);
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
    <div className="px-4 pb-6 pt-2 flex-1 flex flex-col items-center text-center">
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
          className="w-full min-h-[48px] gap-2 bg-gradient-to-r from-[#338BE2] to-cyan-500 hover:from-[#338BE2]/90 hover:to-cyan-500/90 text-white shadow-md shadow-[#338BE2]/30 border-0"
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
      className="flex items-center gap-3 py-3"
    >
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium leading-tight line-clamp-1">{name}</h4>
        <p className="text-xs text-muted-foreground">{formatFCFA(salePrice)} / unité</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateQuantity(productId, quantity - 1);
          }}
          aria-label="Diminuer la quantité"
        >
          <Minus className="w-3.5 h-3.5" />
        </Button>

        <motion.span
          key={quantity}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
          className="w-8 text-center text-sm font-semibold tabular-nums"
        >
          {quantity}
        </motion.span>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateQuantity(productId, quantity + 1);
          }}
          aria-label="Augmenter la quantité"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Line total */}
      <div className="text-right min-w-[70px]">
        <p className="text-sm font-semibold tabular-nums">{formatFCFA(totalPrice)}</p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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

// --- Floating Cart Button (to open drawer) ---
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
        className="w-full min-h-[52px] text-base font-semibold shadow-lg shadow-[#338BE2]/30 relative bg-gradient-to-r from-[#338BE2] to-cyan-500 hover:from-[#338BE2]/90 hover:to-cyan-500/90 border-0"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        <span>Voir le panier</span>
        {itemCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-white/20 text-white border-0"
          >
            {itemCount}
          </Badge>
        )}
        <span className="ml-auto font-bold">{formatFCFA(total)}</span>
      </Button>
    </motion.div>
  );
}
