// ============================================================
// YonuKom — POS Screen
// Écran principal de vente — le cœur de YonuKom
// Objectif : une vente complète en < 15 secondes
// Layout mobile-first : barre recherche + grille produits + tiroir panier
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { User, ScanBarcode } from "lucide-react";
import { AnimatePresence } from "framer-motion";

// --- Walk-in customer fallback (when no real customers in DB yet) ---
const WALK_IN_CUSTOMER = { id: "walk-in", name: "Client comptoir", phone: "" };

// Catégorie dynamique retournée par /api/categories
interface CategoryItem {
  id: string;
  name: string;
  color?: string | null;
}

export function PosScreen({ onNavigateToCash }: { onNavigateToCash?: () => void } = {}) {
  // --- State ---
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string }[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
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

  // Business courant — nécessaire pour filtrer les produits et clients
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // Liste combinée : "Client comptoir" + vrais clients du business
  const customerOptions = [WALK_IN_CUSTOMER, ...customers];

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

  // --- Fetch customers (real ones from DB, filtered by businessId) ---
  const fetchCustomers = useCallback(async () => {
    if (!businessId) {
      setCustomers([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = await res.json();
        // L'API retourne un array de Customer ou { customers: [...] }
        const list = Array.isArray(data) ? data : (data.customers ?? []);
        setCustomers(
          list.map((c: any) => ({
            id: c.id,
            name: c.name,
            phone: c.phone ?? undefined,
          }))
        );
      } else {
        setCustomers([]);
      }
    } catch {
      setCustomers([]);
    }
  }, [businessId]);

  // --- Fetch categories (dynamic — créées par le commerçant) ---
  const fetchCategories = useCallback(async () => {
    if (!businessId) {
      setCategories([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/categories?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } else {
        setCategories([]);
      }
    } catch {
      setCategories([]);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchCategories();
  }, [fetchProducts, fetchCustomers, fetchCategories]);

  // --- Categories ---
  // Construit la liste des chips à afficher :
  // 1. "all" (Tous) — toujours présent
  // 2. Catégories dynamiques (depuis /api/categories)
  // 3. Catégories orphelines (produits avec un `category` texte qui ne correspond
  //    à aucune catégorie dynamique — rétro-compatibilité)
  const categoryList = useMemo(() => {
    const dynamicNamesLower = new Set(
      categories.map((c) => c.name.toLowerCase())
    );
    // Orphelins : noms de `category` (texte) qui ne sont pas dans les catégories dynamiques
    const orphans = new Set<string>();
    for (const p of products) {
      if (
        p.category &&
        !dynamicNamesLower.has((p.category ?? "").toLowerCase())
      ) {
        orphans.add(p.category);
      }
    }
    // On utilise ici des "clés" qui peuvent être soit l'id d'une catégorie
    // dynamique (ex: "abc123"), soit "orphan:NomCategorie" pour les orphelins.
    const list: Array<{ key: string; label: string; color?: string | null }> = [
      { key: "all", label: "Tous", color: null },
      ...categories.map((c) => ({ key: c.id, label: c.name, color: c.color })),
      ...Array.from(orphans)
        .sort()
        .map((name) => ({ key: `orphan:${name}`, label: name, color: null as string | null })),
    ];
    return list;
  }, [categories, products]);

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
                const found = customerOptions.find((c) => c.id === val);
                if (found) setCustomer(found);
              }
            }}
          >
            <SelectTrigger className="flex-1 h-11 bg-gradient-to-r from-[#338BE2]/5 to-cyan-500/5 border-[#338BE2]/20" aria-label="Sélectionner un client">
              <User className="w-4 h-4 text-[#338BE2] mr-1" />
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

          {/* Scan button */}
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 bg-gradient-to-br from-yk-amber/5 to-yk-coral/5 border-yk-amber/30 hover:bg-yk-amber/10 hover:border-yk-amber/40 text-yk-amber"
            aria-label="Scanner un code-barres"
          >
            <ScanBarcode className="w-5 h-5" />
          </Button>
        </div>

        {/* Category tabs (if not restaurant mode) */}
        {!isRestaurantMode && categoryList.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {categoryList.map((cat) => {
              const isActive = activeCategory === cat.key;
              // Pour les chips dynamiques, on utilise la couleur si définie
              const activeStyle =
                isActive && cat.color
                  ? { backgroundColor: cat.color, color: "#ffffff" }
                  : undefined;
              return (
                <Button
                  key={cat.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`
                    shrink-0 text-xs px-3 h-8 rounded-full transition-all
                    ${isActive
                      ? "bg-gradient-to-r from-[#338BE2] to-cyan-500 text-white border-0 shadow-md shadow-[#338BE2]/20"
                      : "hover:border-[#338BE2]/30 hover:text-[#338BE2]"
                    }
                  `}
                  style={activeStyle}
                >
                  {!isActive && cat.color && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden
                    />
                  )}
                  {cat.label}
                </Button>
              );
            })}
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
            categories={categories}
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

      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} onNavigateToCash={onNavigateToCash} />
    </div>
  );
}
