// ============================================================
// YonuKom — POS Screen (Caisse)
// Écran principal de vente — style Tap Touch (3 colonnes desktop)
//
// Layout desktop (lg+) :
//   ┌────────────────────────────────────────────────────────┐
//   │  [Search bar]      [Categories chips — scrollable]       │  ← sticky top
//   ├──────────────────────────────────────┬───────────────────┤
//   │                                      │                   │
//   │  PRODUCT GRID (3-4 cols)             │  CART PANEL        │  ← sticky right
//   │                                      │  (full height)    │
//   └──────────────────────────────────────┴───────────────────┘
//
// Layout mobile :
//   - Top: search + scrollable categories
//   - Middle: product grid (2 cols)
//   - Bottom: floating "Panier (N items)" → opens bottom Sheet
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { useConfigStore } from "@/stores/use-config-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { ProductGrid, type ProductItem } from "@/components/pos/product-grid";
import {
  CartDrawer,
  CartButton,
  CartPanelContent,
} from "@/components/pos/cart-drawer";
import { QuickSale } from "@/components/pos/quick-sale";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ScanBarcode } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // --- Stores ---
  const cartTotal = useCartStore((s) => s.total);
  const cartItemCount = useCartStore((s) => s.itemCount);

  // Le mode restaurant masque la grille et utilise QuickSale (gros boutons)
  const isRestaurantMode = useConfigStore((s) => s.isRestaurantActive());

  // Business courant — nécessaire pour filtrer les produits et clients
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

  // --- Categories list ---
  // 1. "all" (Tous) — toujours présent
  // 2. Catégories dynamiques (depuis /api/categories)
  // 3. Catégories orphelines (texte non mappé à un categoryId)
  const categoryList = useMemo(() => {
    const dynamicNamesLower = new Set(
      categories.map((c) => c.name.toLowerCase())
    );
    const orphans = new Set<string>();
    for (const p of products) {
      if (
        p.category &&
        !dynamicNamesLower.has((p.category ?? "").toLowerCase())
      ) {
        orphans.add(p.category);
      }
    }
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
    <div className="flex flex-col h-full lg:h-screen">
      <ConnectivityBanner />

      {/* ---- Top Bar : Search + Categories ---- */}
      <div className="px-3 sm:px-4 pt-3 pb-2 space-y-2 shrink-0 border-b border-border/40 bg-background/95 backdrop-blur-sm">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-10 h-11 text-base"
            aria-label="Rechercher un produit"
          />
          <ScanBarcode
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            aria-label="Scanner un code-barres"
          />
        </div>

        {/* Category chips (horizontal scrollable) */}
        {!isRestaurantMode && categoryList.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {categoryList.map((cat) => {
              const isActive = activeCategory === cat.key;
              const activeStyle =
                isActive && cat.color
                  ? { backgroundColor: cat.color, color: "#ffffff", borderColor: cat.color }
                  : undefined;
              return (
                <Button
                  key={cat.key}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`
                    shrink-0 text-xs px-3 h-8 rounded-full transition-all min-w-[80px]
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

      {/* ---- Content Area : Product grid + sticky cart panel (desktop) ---- */}
      <div className="flex-1 flex min-h-0">
        {/* LEFT/CENTER : Product grid */}
        <div className="flex-1 min-w-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
          {isRestaurantMode ? (
            <QuickSale products={products} isLoading={isLoading} />
          ) : (
            <ProductGrid
              products={products}
              isLoading={isLoading}
              activeCategory={activeCategory}
              categories={categories}
              searchQuery={searchQuery}
            />
          )}
        </div>

        {/* RIGHT : Sticky cart panel (desktop only — lg+) */}
        <aside className="hidden lg:flex w-[380px] xl:w-[420px] shrink-0 border-l border-border bg-card flex-col">
          <CartPanelContent
            onNavigateToCash={onNavigateToCash}
            customers={customers}
            walkInCustomer={WALK_IN_CUSTOMER}
          />
        </aside>
      </div>

      {/* ---- Mobile : Floating cart button (always visible, even with empty cart) ---- */}
      <div className="lg:hidden px-3 pb-3 pt-2 shrink-0">
        <CartButton
          itemCount={cartItemCount}
          total={cartTotal}
          onClick={() => setCartOpen(true)}
        />
      </div>

      {/* ---- Mobile : Bottom Sheet cart ---- */}
      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        onNavigateToCash={onNavigateToCash}
        customers={customers}
        walkInCustomer={WALK_IN_CUSTOMER}
      />
    </div>
  );
}
