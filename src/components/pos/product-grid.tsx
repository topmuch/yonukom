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
import { Search, ScanBarcode, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Product type returned from API ---
export interface ProductItem {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  category?: string;
  categoryId?: string | null;
  imageUrl?: string;
}

// Catégorie dynamique transmise par PosScreen
export interface CategoryItem {
  id: string;
  name: string;
  color?: string | null;
}

interface ProductGridProps {
  /** Products to display */
  products: ProductItem[];
  /** Are products still loading? */
  isLoading: boolean;
  /** Optional category filter (peut être "all", "<categoryId>", ou "orphan:Name") */
  activeCategory?: string;
  /** Catégories dynamiques (pour résoudre categoryId → name) */
  categories?: CategoryItem[];
}

// Category-based gradient placeholders — used when no imageUrl
// On garde un fallback par "type" de produit (texte libre) pour les anciens
// produits qui n'ont pas encore de categoryId. La couleur préférée reste
// celle de la catégorie dynamique si elle est définie.
const CATEGORY_GRADIENTS: Record<string, string> = {
  Plats: "from-orange-400 to-rose-400",
  Boissons: "from-cyan-400 to-blue-500",
  Epicerie: "from-amber-400 to-orange-500",
  Cosmetiques: "from-pink-400 to-fuchsia-500",
  Vetements: "from-violet-400 to-indigo-500",
  Electronique: "from-slate-500 to-cyan-500",
  Autre: "from-emerald-400 to-teal-500",
};

function gradientFor(category?: string): string {
  return CATEGORY_GRADIENTS[category ?? ""] ?? "from-[#338BE2] to-yk-emerald";
}

export function ProductGrid({ products, isLoading, activeCategory, categories }: ProductGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  // Filter by search and category
  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory && activeCategory !== "all") {
      if (activeCategory.startsWith("orphan:")) {
        // Catégorie orpheline (texte libre non mappée à un categoryId)
        const orphanName = activeCategory.slice("orphan:".length).toLowerCase();
        result = result.filter(
          (p) =>
            (p.category ?? "").toLowerCase() === orphanName && !p.categoryId
        );
      } else {
        // Catégorie dynamique : match par categoryId (FK) OU par category (texte)
        // correspondant au nom de la catégorie — pour la rétro-compatibilité.
        const cat = categories?.find((c) => c.id === activeCategory);
        const catName = cat?.name?.toLowerCase();
        result = result.filter(
          (p) =>
            p.categoryId === activeCategory ||
            (catName && (p.category ?? "").toLowerCase() === catName)
        );
      }
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
  }, [products, searchQuery, activeCategory, categories]);

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
  const hasImage = Boolean(product.imageUrl);
  const gradient = gradientFor(product.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      whileTap={{ scale: 0.96 }}
    >
      <Card
        className={`
          cursor-pointer transition-all duration-150 overflow-hidden
          hover:shadow-md active:scale-[0.97]
          ${isOutOfStock ? "opacity-70" : ""}
        `}
        onClick={onAdd}
      >
        {/* Image / gradient placeholder */}
        <div className={`relative w-full aspect-square bg-gradient-to-br ${gradient}`}>
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl as string}
              alt={product.name}
              className="w-full aspect-square h-full object-cover rounded-lg"
              loading="eager"
              // Important pour le POS : pas de decoding bloquant
              decoding="async"
            />
          ) : (
            <div className="w-full aspect-square h-full rounded-lg flex items-center justify-center text-white/90">
              <Package className="w-8 h-8 drop-shadow-sm" strokeWidth={1.5} />
            </div>
          )}

          {/* Out-of-stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-[10px]">Rupture</Badge>
            </div>
          )}

          {/* Price pill overlay (bottom-left) */}
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
            <span className="text-xs font-bold text-yk-emerald">
              {formatFCFA(product.salePrice)}
            </span>
          </div>
        </div>

        <CardContent className="p-2.5 space-y-1">
          {/* Product name */}
          <h3 className="text-xs font-semibold leading-tight line-clamp-2 min-h-[2rem]">
            {product.name}
          </h3>

          {/* Stock badge */}
          <div className="flex items-center justify-between gap-1">
            {isOutOfStock ? (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                Rupture
              </Badge>
            ) : isLowStock ? (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-yk-amber/10 text-yk-amber border-yk-amber/30">
                Stock bas
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-yk-emerald/10 text-yk-emerald border-yk-emerald/30">
                {product.quantity} dispo
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
        <Card key={i} className="overflow-hidden">
          <Skeleton className="w-full aspect-square rounded-none" />
          <CardContent className="p-2.5 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
