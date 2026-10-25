// ============================================================
// YonuKom — Quote Form (B2B Pipeline)
// Dialog form for creating a new B2B quote (devis)
// Client selector, product lines, delivery address, notes
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Search,
  Loader2,
  FileText,
} from "lucide-react";

// --- Types ---

interface B2BCustomer {
  id: string;
  name: string;
  phone: string;
  isB2B: boolean;
  creditLimit?: number;
}

interface Product {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  category?: string | null;
}

interface FormLine {
  key: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface QuoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (quoteId: string) => void;
  businessId?: string;
}

// --- Helpers ---

let lineKeyCounter = 0;
function nextLineKey(): string {
  lineKeyCounter += 1;
  return `line-${lineKeyCounter}`;
}

// --- Component ---

export function QuoteForm({
  open,
  onOpenChange,
  onSuccess,
  businessId,
}: QuoteFormProps) {
  // --- State ---
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState<FormLine[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data from APIs
  const [customers, setCustomers] = useState<B2BCustomer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  // --- Fetch data on open ---
  useEffect(() => {
    if (!open) return;

    setCustomersLoading(true);
    fetch("/api/b2b-customers")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.customers ?? [];
        setCustomers(list);
      })
      .catch(() => toast.error("Erreur de chargement des clients"))
      .finally(() => setCustomersLoading(false));

    setProductsLoading(true);
    fetch("/api/ecom-products")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.products ?? [];
        setProducts(list);
      })
      .catch(() => toast.error("Erreur de chargement des produits"))
      .finally(() => setProductsLoading(false));
  }, [open]);

  // Reset form on close
  useEffect(() => {
    if (!open) {
      setCustomerId("");
      setLines([]);
      setDeliveryAddress("");
      setNotes("");
      setProductSearch("");
      setIsSubmitting(false);
    }
  }, [open]);

  // --- Line management ---
  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        key: nextLineKey(),
        productId: "",
        productName: "",
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const updateLine = useCallback(
    (key: string, field: keyof FormLine, value: string | number) => {
      setLines((prev) =>
        prev.map((l) => {
          if (l.key !== key) return l;
          const updated = { ...l, [field]: value };

          // Auto-fill product info when selecting a product
          if (field === "productId" && typeof value === "string" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
              updated.productName = product.name;
              updated.unitPrice = product.salePrice;
            }
          }

          // Recalculate total
          updated.totalPrice = Math.floor(updated.quantity * updated.unitPrice);
          return updated;
        })
      );
    },
    [products]
  );

  // --- Computed ---
  const totalAmount = lines.reduce((sum, l) => sum + l.totalPrice, 0);
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Filtered products for search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // --- Submit ---
  const handleSubmit = async () => {
    // Validation
    if (!customerId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    const validLines = lines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error("Ajoutez au moins un produit");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerId,
        businessId: businessId || "default",
        items: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        deliveryAddress: deliveryAddress || undefined,
        paymentLink: notes || undefined, // notes stored in paymentLink field
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const created = await res.json();
      toast.success("Devis créé avec succès");
      onOpenChange(false);
      onSuccess?.(created.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de création du devis";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Nouveau Devis B2B
          </DialogTitle>
          <DialogDescription className="sr-only">
            Créer un nouveau devis pour un client B2B
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-8rem)] pr-1">
          {/* Client selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un client B2B" />
              </SelectTrigger>
              <SelectContent>
                {customersLoading ? (
                  <SelectItem value="_loading" disabled>
                    Chargement...
                  </SelectItem>
                ) : (
                  customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        {c.name}
                        {c.creditLimit != null && c.creditLimit > 0 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-primary/20 text-primary"
                          >
                            {formatFCFA(c.creditLimit)}
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedCustomer && (
              <p className="text-xs text-muted-foreground">
                📞 {selectedCustomer.phone}
              </p>
            )}
          </div>

          <Separator />

          {/* Product lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Produits <span className="text-destructive">*</span>
              </label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={addLine}
                disabled={productsLoading}
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </Button>
            </div>

            {/* Product search */}
            {lines.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            )}

            {lines.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">
                Cliquez sur &quot;Ajouter&quot; pour ajouter des produits au
                devis
              </p>
            )}

            {lines.map((line) => (
              <div
                key={line.key}
                className="space-y-2 p-3 rounded-lg border bg-muted/30"
              >
                {/* Product select */}
                <Select
                  value={line.productId}
                  onValueChange={(v) => updateLine(line.key, "productId", v)}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Choisir un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="_loading" disabled>
                        Chargement...
                      </SelectItem>
                    ) : (
                      filteredProducts.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {formatFCFA(p.salePrice)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {/* Quantity + Price row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Qté
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          line.key,
                          "quantity",
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Prix unit. (FCFA)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(
                          line.key,
                          "unitPrice",
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-muted-foreground">
                      Total
                    </label>
                    <p className="text-sm font-medium h-8 flex items-center">
                      {formatFCFA(line.totalPrice)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 mt-4"
                    onClick={() => removeLine(line.key)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Delivery address */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Adresse de livraison
            </label>
            <Input
              placeholder="Ex: Médina, Dakar"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              placeholder="Notes internes ou instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="min-h-16"
            />
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold text-emerald-600">
              {formatFCFA(totalAmount)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={isSubmitting || !customerId || lines.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                "Créer le devis"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
