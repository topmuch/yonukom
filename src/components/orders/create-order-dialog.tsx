// ============================================================
// YonuKom — CreateOrderDialog
// Boîte de dialogue de création manuelle d'une commande depuis le
// dashboard (commandes téléphone, livraison, etc.). Permet de saisir
// un client, un ou plusieurs articles, le type de commande, le statut
// de paiement et le moyen de paiement. POST /api/orders.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { formatFCFA, parseFCFA } from "@/lib/fcfa";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Loader2,
  User,
  Package,
  Truck,
  CreditCard,
  ShoppingCart,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// --- Types ---

interface Product {
  id: string;
  name: string;
  salePrice: number;
  imageUrl?: string | null;
  quantity?: number;
  productType?: string;
}

interface ItemRow {
  /** Local unique id for React key */
  key: string;
  /** productId sélectionné, ou "" si "Article personnalisé" (manuel) */
  productId: string;
  /** Nom saisi manuellement quand productId = "" */
  manualName: string;
  quantity: number;
  /** Prix unitaire en FCFA */
  unitPrice: number;
}

type OrderStatusChoice = "paid" | "pending" | "unpaid" | "delivered";
type OrderTypeChoice = "dine_in" | "takeaway" | "delivery";
type PaymentMethodChoice = "cash" | "wave" | "orange_money" | "cb";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Appelé après création réussie pour rafraîchir la liste */
  onCreated?: () => void;
}

// --- Constantes UI ---

const STATUS_OPTIONS: {
  value: OrderStatusChoice;
  label: string;
  hint: string;
}[] = [
  { value: "paid", label: "Payé", hint: "Encaissement immédiat (crée un Payment)" },
  { value: "pending", label: "En cours", hint: "Commande en attente, non encaissée" },
  { value: "unpaid", label: "Non payé", hint: "À encaisser plus tard" },
  { value: "delivered", label: "Livré", hint: "Commande livrée au client" },
];

const ORDER_TYPE_OPTIONS: { value: OrderTypeChoice; label: string }[] = [
  { value: "dine_in", label: "Sur place" },
  { value: "takeaway", label: "À emporter" },
  { value: "delivery", label: "Livraison" },
];

const PAYMENT_METHOD_OPTIONS: { value: PaymentMethodChoice; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "cb", label: "Carte" },
];

// Mapping du choix UI → statut envoyé à l'API
function statusChoiceToApiStatus(choice: OrderStatusChoice): string {
  switch (choice) {
    case "paid":
      return "completed";
    case "pending":
      return "pending";
    case "unpaid":
      return "to_pay";
    case "delivered":
      return "delivered";
  }
}

let itemKeyCounter = 0;
function nextItemKey(): string {
  itemKeyCounter += 1;
  return `item-${Date.now()}-${itemKeyCounter}`;
}

// ============================================================
// Composant principal
// ============================================================

export function CreateOrderDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOrderDialogProps) {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const userId = user?.id;

  // Produits disponibles (fetch une fois à l'ouverture)
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Champs formulaire
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ItemRow[]>([
    {
      key: nextItemKey(),
      productId: "",
      manualName: "",
      quantity: 1,
      unitPrice: 0,
    },
  ]);
  const [orderType, setOrderType] = useState<OrderTypeChoice>("dine_in");
  const [deliveryFee, setDeliveryFee] = useState("0");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [statusChoice, setStatusChoice] = useState<OrderStatusChoice>("paid");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethodChoice>("cash");

  const [submitting, setSubmitting] = useState(false);

  // --- Fetch produits à l'ouverture ---
  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    setProductsLoading(true);
    try {
      const res = await fetch(
        `/api/products?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Échec du chargement des produits");
      const data = (await res.json()) as { products: Product[] };
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open, fetchProducts]);

  // --- Reset form à la fermeture ---
  useEffect(() => {
    if (!open) {
      // Laisser le temps à l'animation de fermeture
      const t = setTimeout(() => {
        setCustomerName("");
        setCustomerPhone("");
        setItems([
          {
            key: nextItemKey(),
            productId: "",
            manualName: "",
            quantity: 1,
            unitPrice: 0,
          },
        ]);
        setOrderType("dine_in");
        setDeliveryFee("0");
        setDeliveryAddress("");
        setStatusChoice("paid");
        setPaymentMethod("cash");
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // --- Gestion des items ---

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: nextItemKey(),
        productId: "",
        manualName: "",
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) =>
      prev.length === 1
        ? prev // toujours garder au moins 1
        : prev.filter((it) => it.key !== key)
    );
  };

  const updateItem = (key: string, patch: Partial<ItemRow>) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it))
    );
  };

  // Quand l'utilisateur sélectionne un produit → pré-remplir le prix
  const handleProductChange = (key: string, productId: string) => {
    if (productId === "__manual__") {
      updateItem(key, { productId: "", manualName: "", unitPrice: 0 });
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(key, {
        productId,
        manualName: product.name,
        unitPrice: product.salePrice,
      });
    }
  };

  // --- Calcul du total ---

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
        0
      ),
    [items]
  );

  const deliveryFeeNum = useMemo(() => {
    const parsed = parseFCFA(deliveryFee);
    return orderType === "delivery" && parsed > 0 ? Math.floor(parsed) : 0;
  }, [deliveryFee, orderType]);

  const total = subtotal + deliveryFeeNum;

  // --- Validation ---

  const validationError = useMemo(() => {
    if (!businessId) return "Business non chargé";
    const hasValidItem = items.some((it) => {
      const qty = Number(it.quantity);
      if (!qty || qty <= 0) return false;
      if (it.productId) return true; // produit existant
      // article manuel : nom + prix requis
      return it.manualName.trim() !== "" && Number(it.unitPrice) >= 0;
    });
    if (!hasValidItem) return "Ajoutez au moins un article valide";
    if (statusChoice === "paid" && total <= 0)
      return "Le total doit être supérieur à 0 pour une commande payée";
    return null;
  }, [businessId, items, statusChoice, total]);

  // --- Submit ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (!businessId) return;

    setSubmitting(true);

    try {
      // --- 1. Résoudre le customer ---
      // Si l'utilisateur a saisi un nom, on crée/find un Customer dédié.
      // Sinon, on laisse customerId vide et l'API créera le "Client comptoir".
      let customerId: string | null = null;

      const trimmedName = customerName.trim();
      const trimmedPhone = customerPhone.trim();

      if (trimmedName) {
        try {
          const createRes = await fetch("/api/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId,
              name: trimmedName,
              phone: trimmedPhone || "N/A",
            }),
          });
          if (createRes.ok) {
            const created = (await createRes.json()) as { id: string };
            customerId = created.id;
          }
          // Si la création échoue (ex: duplicate phone), on continue sans customerId
          // → l'API orders créera le walk-in.
        } catch {
          // Erreur réseau création customer → continuer avec walk-in
        }
      }

      // --- 2. Préparer les items ---
      const validItems = items
        .filter((it) => {
          const qty = Number(it.quantity);
          if (!qty || qty <= 0) return false;
          if (it.productId) return true;
          return it.manualName.trim() !== "" && Number(it.unitPrice) >= 0;
        })
        .map((it) => {
          if (it.productId) {
            return {
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: Math.max(0, Math.floor(Number(it.unitPrice))),
            };
          }
          // Article manuel
          return {
            name: it.manualName.trim(),
            quantity: it.quantity,
            unitPrice: Math.max(0, Math.floor(Number(it.unitPrice))),
          };
        });

      const isPaid = statusChoice === "paid";

      // --- 3. POST /api/orders ---
      const payload: Record<string, unknown> = {
        businessId,
        customerId,
        items: validItems,
        status: statusChoiceToApiStatus(statusChoice),
        orderType,
        deliveryFee: deliveryFeeNum,
        deliveryAddress:
          orderType === "delivery" && deliveryAddress.trim()
            ? deliveryAddress.trim()
            : null,
        paymentMethod,
        paid: isPaid,
        createdBy: userId ?? null,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (res.status === 403) {
          throw new Error(
            "Caisse fermée. Ouvrez une session de caisse avant d'encaisser une commande payée."
          );
        }
        throw new Error(data.error ?? "Échec de la création de la commande");
      }

      const order = (await res.json()) as { orderNumber?: string; id?: string };

      toast.success("Commande créée", {
        description: order.orderNumber
          ? `Commande ${order.orderNumber} enregistrée avec succès.`
          : "La commande a été créée avec succès.",
      });

      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de la commande"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Ajouter une commande
          </DialogTitle>
          <DialogDescription>
            Créez manuellement une commande (vente téléphone, livraison, etc.).
            Le total est calculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* === Section Client === */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <User className="w-4 h-4 text-primary" />
              Client
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="customer-name" className="text-xs">
                  Nom du client <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  id="customer-name"
                  placeholder="Ex : Awa Diop"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="h-9"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customer-phone" className="text-xs">
                  Téléphone <span className="text-muted-foreground">(optionnel)</span>
                </Label>
                <Input
                  id="customer-phone"
                  placeholder="Ex : 77 123 45 67"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="h-9"
                  inputMode="tel"
                  autoComplete="off"
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Laisser vide pour utiliser le client &quot;Client comptoir&quot; par défaut.
            </p>
          </section>

          <Separator />

          {/* === Section Articles === */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package className="w-4 h-4 text-primary" />
                Articles
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={addItem}
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div
                  key={it.key}
                  className="rounded-lg border border-border/70 bg-muted/30 p-3 space-y-2"
                >
                  {/* Row 1 : Product select */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Produit #{idx + 1}
                      </Label>
                      {productsLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground h-9">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Chargement...
                        </div>
                      ) : (
                        <Select
                          value={it.productId || "__manual__"}
                          onValueChange={(v) => handleProductChange(it.key, v)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72">
                            <SelectItem value="__manual__">
                              ✏️ Article personnalisé
                            </SelectItem>
                            {products.length === 0 ? (
                              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                                Aucun produit — saisissez un article personnalisé
                              </div>
                            ) : (
                              products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <span className="flex items-center justify-between w-full">
                                    <span className="truncate">{p.name}</span>
                                    <span className="text-[10px] text-muted-foreground ml-2">
                                      {formatFCFA(p.salePrice)}
                                    </span>
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 mt-5"
                      onClick={() => removeItem(it.key)}
                      disabled={items.length === 1}
                      aria-label="Supprimer cet article"
                      title="Supprimer cet article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Row 2 : Manual name (if no product selected) */}
                  {!it.productId && (
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Nom de l&apos;article
                      </Label>
                      <Input
                        placeholder="Ex : Thiébou rouge (grand)"
                        value={it.manualName}
                        onChange={(e) =>
                          updateItem(it.key, { manualName: e.target.value })
                        }
                        className="h-8 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  )}

                  {/* Row 3 : Quantity + Unit price */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Quantité
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={it.quantity}
                        onChange={(e) =>
                          updateItem(it.key, {
                            quantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">
                        Prix de vente (FCFA)
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={it.unitPrice}
                        onChange={(e) =>
                          updateItem(it.key, {
                            unitPrice: Math.max(0, parseInt(e.target.value, 10) || 0),
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Row total */}
                  <div className="flex justify-end text-xs text-muted-foreground">
                    Sous-total :{" "}
                    <span className="font-semibold text-foreground ml-1">
                      {formatFCFA((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator />

          {/* === Section Type de commande === */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {orderType === "delivery" ? (
                <Truck className="w-4 h-4 text-primary" />
              ) : (
                <Package className="w-4 h-4 text-primary" />
              )}
              Type de commande
            </div>
            <Select
              value={orderType}
              onValueChange={(v) => setOrderType(v as OrderTypeChoice)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {orderType === "delivery" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label htmlFor="delivery-fee" className="text-xs">
                    Frais de livraison (FCFA)
                  </Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="delivery-address" className="text-xs">
                    Adresse de livraison{" "}
                    <span className="text-muted-foreground">(optionnel)</span>
                  </Label>
                  <Input
                    id="delivery-address"
                    placeholder="Ex : Médina, Rue 10 x Corniche"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="h-9 text-sm"
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* === Section Paiement === */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="w-4 h-4 text-primary" />
              Paiement
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Statut</Label>
              <Select
                value={statusChoice}
                onValueChange={(v) => setStatusChoice(v as OrderStatusChoice)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {opt.hint}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {statusChoice === "paid" && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">Moyen de paiement</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod(v as PaymentMethodChoice)
                  }
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {statusChoice !== "paid" && (
              <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-2.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Aucun paiement ne sera enregistré. Vous pourrez marquer cette
                  commande comme payée plus tard depuis l&apos;historique.
                </p>
              </div>
            )}
          </section>

          <Separator />

          {/* === Récap total === */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Sous-total articles</span>
              <span className="font-medium text-foreground">
                {formatFCFA(subtotal)}
              </span>
            </div>
            {orderType === "delivery" && deliveryFeeNum > 0 && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Frais de livraison</span>
                <span className="font-medium text-foreground">
                  {formatFCFA(deliveryFeeNum)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1.5 border-t border-primary/15">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-yk-emerald">
                {formatFCFA(total)}
              </span>
            </div>
            <div className="flex items-center justify-end pt-0.5">
              <Badge
                variant="outline"
                className={`text-[10px] ${
                  statusChoice === "paid"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : statusChoice === "delivered"
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    : statusChoice === "unpaid"
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30"
                }`}
              >
                {STATUS_OPTIONS.find((s) => s.value === statusChoice)?.label}
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting || !!validationError}
              className="gap-1.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Créer la commande
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
