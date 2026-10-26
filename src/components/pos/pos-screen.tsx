// ============================================================
// YonuKom — POS Screen
// Écran principal de vente — le cœur de YonuKom
// Objectif : une vente complète en < 15 secondes
// Layout mobile-first : barre recherche + grille produits + tiroir panier
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { ProductGrid, type ProductItem } from "@/components/pos/product-grid";
import { CartDrawer, CartButton } from "@/components/pos/cart-drawer";
import { QuickSale } from "@/components/pos/quick-sale";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ScanBarcode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Mock customers for the selector ---
const MOCK_CUSTOMERS = [
  { id: "walk-in", name: "Client comptoir", phone: "" },
  { id: "c1", name: "Fatou Diallo", phone: "+221 77 123 45 67" },
  { id: "c2", name: "Moussa Sow", phone: "+221 78 987 65 43" },
  { id: "c3", name: "Aïssatou Ba", phone: "+221 76 555 12 34" },
];

export function PosScreen() {
  // --- State ---
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  // --- Stores ---
  const cartTotal = useCartStore((s) => s.total);
  const cartItemCount = useCartStore((s) => s.itemCount);
  const cartCustomer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const clearCustomer = useCartStore((s) => s.clearCustomer);
  const isRestaurantMode = useConfigStore((s) => s.isRestaurantActive());

  // Business courant — nécessaire pour filtrer les produits
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // --- Fetch products ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = businessId
        ? `/api/products?businessId=${encodeURIComponent(businessId)}`
        : `/api/products`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
      } else {
        setProducts([]);
      }
    } catch {
      // Offline: use empty array (products may be in IndexedDB)
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Categories ---
  const categories = products.reduce<Set<string>>((acc, p) => {
    if (p.category) acc.add(p.category);
    return acc;
  }, new Set<string>());
  const categoryList = ["all", ...Array.from(categories).sort()];

  const categoryLabels: Record<string, string> = {
    all: "Tous",
    Plats: "Plats",
    Boissons: "Boissons",
    Epicerie: "Épicerie",
    Cosmetiques: "Cosmétiques",
    Vetements: "Vêtements",
    Electronique: "Électronique",
  };

  return (
    <div className="flex flex-col h-full">
      <ConnectivityBanner />

      {/* ---- Top Bar ---- */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        {/* Customer selector */}
        <div className="flex items-center gap-2">
          <Select
            value={cartCustomer?.id ?? "walk-in"}
            onValueChange={(val) => {
              if (val === "walk-in") {
                clearCustomer();
              } else {
                const found = MOCK_CUSTOMERS.find((c) => c.id === val);
                if (found) setCustomer(found);
              }
            }}
          >
            <SelectTrigger className="flex-1 h-11" aria-label="Sélectionner un client">
              <User className="w-4 h-4 text-muted-foreground mr-1" />
              <SelectValue placeholder="Client comptoir" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CUSTOMERS.map((c) => (
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

          {/* Scan button */}
          <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" aria-label="Scanner un code-barres">
            <ScanBarcode className="w-5 h-5" />
          </Button>
        </div>

        {/* Category tabs (if not restaurant mode) */}
        {!isRestaurantMode && categoryList.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {categoryList.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`
                  shrink-0 text-xs px-3 h-8 rounded-full
                  ${activeCategory === cat ? "bg-primary text-primary-foreground" : ""}
                `}
              >
                {categoryLabels[cat] ?? cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* ---- Content Area ---- */}
      <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
        {isRestaurantMode ? (
          <QuickSale products={products} isLoading={isLoading} />
        ) : (
          <ProductGrid
            products={products}
            isLoading={isLoading}
            activeCategory={activeCategory}
          />
        )}
      </div>

      {/* ---- Cart floating button / drawer ---- */}
      <AnimatePresence>
        {cartItemCount > 0 && !cartOpen && (
          <div className="px-4 pb-4 pt-2">
            <CartButton
              itemCount={cartItemCount}
              total={cartTotal}
              onClick={() => setCartOpen(true)}
            />
          </div>
        )}
      </AnimatePresence>

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
