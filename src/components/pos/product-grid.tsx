// ============================================================
// YonuKom — Product Grid (POS)
// Grille de produits avec images — cartes larges type Tap Touch
// 2 colonnes mobile, 3-4 colonnes desktop
// Click ajout instantané au panier (pas de confirmation)
// ============================================================

"use client";

import { useMemo } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { formatFCFA } from "@/lib/fcfa";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package } from "lucide-react";
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
  /** Search query (texte libre) — filtrage par nom */
  searchQuery?: string;
}

// Fallback gradient used for image-less cards.
const DEFAULT_GRADIENT = "from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900";

export function ProductGrid({
  products,
  isLoading,
  activeCategory,
  categories,
  searchQuery = "",
}: ProductGridProps) {
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

  if (isLoading) {
    return <ProductGridSkeleton />;
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
          <Package className="w-7 h-7 text-muted-foreground/70" strokeWidth={1.5} />
        </div>
        <p className="text-muted-foreground text-sm">
          {searchQuery ? "Aucun produit trouvé" : "Aucun produit disponible"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => {
          const cat = product.categoryId
            ? categories?.find((c) => c.id === product.categoryId)
            : undefined;
          return (
            <ProductCard
              key={product.id}
              product={product}
              categoryColor={cat?.color}
              onAdd={() => handleAddToCart(product)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// --- Individual Product Card ---
interface ProductCardProps {
  product: ProductItem;
  categoryColor?: string | null;
  onAdd: () => void;
}

function ProductCard({ product, categoryColor, onAdd }: ProductCardProps) {
  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;
  const hasImage = Boolean(product.imageUrl);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      whileTap={isOutOfStock ? undefined : { scale: 0.95 }}
      className={`
        group relative rounded-2xl overflow-hidden border border-slate-200 bg-card
        dark:border-slate-800 transition-all duration-150
        ${isOutOfStock
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-primary/40 hover:shadow-lg cursor-pointer active:scale-[0.97]"
        }
      `}
      onClick={isOutOfStock ? undefined : onAdd}
      role={isOutOfStock ? undefined : "button"}
      aria-label={`Ajouter ${product.name} au panier, ${formatFCFA(product.salePrice)}`}
    >
      {/* Image / fallback */}
      <div
        className={`relative aspect-square w-full bg-gradient-to-br ${DEFAULT_GRADIENT} overflow-hidden`}
      >
        {hasImage ? (
          <img
            src={product.imageUrl as string}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
            <Package className="w-10 h-10" strokeWidth={1.25} />
          </div>
        )}

        {/* Category color dot (top-left) */}
        {categoryColor && (
          <span
            className="absolute top-2 left-2 w-3 h-3 rounded-full ring-2 ring-white/80 shadow-sm"
            style={{ backgroundColor: categoryColor }}
            aria-hidden
          />
        )}

        {/* Out-of-stock badge (top-right) */}
        {isOutOfStock ? (
          <div className="absolute top-2 right-2">
            <Badge
              variant="destructive"
              className="text-[10px] px-2 py-0.5 font-semibold shadow-sm"
            >
              Rupture
            </Badge>
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              className="text-[10px] px-2 py-0.5 bg-yk-amber/15 text-yk-amber border border-yk-amber/40 shadow-sm"
            >
              Stock bas
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Product info */}
      <div className="p-2.5 sm:p-3 space-y-1">
        <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-1">
          <span className="text-base font-bold text-primary tabular-nums">
            {formatFCFA(product.salePrice)}
          </span>
          {!isOutOfStock && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {product.quantity} dispo
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// --- Loading Skeleton ---
function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          <Skeleton className="w-full aspect-square rounded-none" />
          <div className="p-2.5 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
