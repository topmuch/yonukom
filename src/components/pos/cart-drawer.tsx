// ============================================================
// YonuKom — Cart Drawer
// Panier en bottom sheet (Sheet) — slide up depuis le bas
// Contrôles +/- quantité, total FCFA, bouton Encaisser
// ============================================================

"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, Trash2, ShoppingCart, User, Phone, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CartDrawerProps {
  /** Is the sheet open? */
  open: boolean;
  /** Toggle open state */
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.total);
  const itemCount = useCartStore((s) => s.itemCount);
  const customer = useCartStore((s) => s.customer);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const user = useAuthStore((s) => s.user);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    // Récupérer businessId depuis l'utilisateur connecté
    const businessId = user?.businessId;
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
        customerId: customer?.id ?? "walk-in",
        createdBy: user?.id ?? null,
        status: "completed",
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
        throw new Error(data.error ?? "Échec de la création de la commande");
      }

      const order = (await res.json()) as { orderNumber?: string };

      toast({
        title: "Vente encaissée ✓",
        description: order.orderNumber
          ? `Commande ${order.orderNumber} créée avec succès.`
          : "La commande a été créée avec succès.",
      });

      clearCart();
      onOpenChange(false);
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

  return (
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
            {items.length > 0 && (
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
            <Button
              onClick={handleCheckout}
              size="lg"
              disabled={isCheckingOut}
              className="w-full min-h-[52px] text-base font-semibold gap-2 bg-gradient-to-r from-yk-emerald to-yk-mint hover:from-yk-emerald/90 hover:to-yk-mint/90 text-white shadow-lg shadow-yk-emerald/30 border-0 transition-all active:scale-[0.98]"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Encaissement...
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
      </SheetContent>
    </Sheet>
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
