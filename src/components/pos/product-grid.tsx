// ============================================================
// YonuKom — Product Grid
// Grille de produits pour le POS — 2 colonnes mobile, 3 tablette
// Click ajout instantané au panier (pas de confirmation)
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ScanBarcode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Product type returned from API ---
export interface ProductItem {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  category?: string;
  imageUrl?: string;
}

interface ProductGridProps {
  /** Products to display */
  products: ProductItem[];
  /** Are products still loading? */
  isLoading: boolean;
  /** Optional category filter */
  activeCategory?: string;
}

export function ProductGrid({ products, isLoading, activeCategory }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  // Filter by search and category
  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory && activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, searchQuery, activeCategory]);

  const handleAddToCart = (product: ProductItem) => {
    addItem({
      id: product.id,
      name: product.name,
      salePrice: product.salePrice,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-10 h-11 text-base"
          aria-label="Rechercher un produit"
        />
        <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </div>

      {/* Product grid */}
      {isLoading ? (
        <ProductGridSkeleton />
      ) : filteredProducts.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {searchQuery ? "Aucun produit trouvé" : "Aucun produit disponible"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAdd={() => handleAddToCart(product)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// --- Individual Product Card ---
interface ProductCardProps {
  product: ProductItem;
  onAdd: () => void;
}

function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={`
          cursor-pointer transition-all duration-150
          hover:shadow-md active:scale-[0.97]
          ${isOutOfStock ? "opacity-60" : ""}
        `}
        onClick={onAdd}
      >
        <CardContent className="p-3 space-y-2">
          {/* Product name */}
          <h3 className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Price */}
          <p className="text-yk-emerald font-bold text-base leading-tight">
            {formatFCFA(product.salePrice)}
          </p>

          {/* Stock badge */}
          <div className="flex items-center justify-between">
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                Rupture
              </Badge>
            ) : isLowStock ? (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-yk-amber/10 text-yk-amber border-yk-amber/30">
                Stock bas
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {product.quantity} en stock
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- Loading Skeleton ---
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
