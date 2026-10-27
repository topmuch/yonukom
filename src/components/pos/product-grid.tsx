// ============================================================
// YonuKom — Product List (POS)
// Liste verticale de produits façon "Hungry Puppies" — carte horizontale
// par produit : image à gauche + nom/description milieu + prix/bouton droite.
// Bouton "ADD" si pas encore dans le panier, sinon sélecteur - N +.
// Fonctionne en mobile (1 col) et desktop (jusqu'à 2 cols pour profiter
// de l'espace, mais reste une liste verticale).
// ============================================================

"use client";

import { useMemo } from "react";
import { useCartStore } from "@/stores/use-cart-store";
import { formatFCFA } from "@/lib/fcfa";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Plus, Minus } from "lucide-react";
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
  description?: string;
  sku?: string;
}

// Catégorie dynamique transmise par PosScreen
export interface CategoryItem {
  id: string;
  name: string;
  color?: string | null;
}

interface ProductGridProps {
  products: ProductItem[];
  isLoading: boolean;
  activeCategory?: string;
  categories?: CategoryItem[];
  searchQuery?: string;
}

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
        const orphanName = activeCategory.slice("orphan:".length).toLowerCase();
        result = result.filter(
          (p) =>
            (p.category ?? "").toLowerCase() === orphanName && !p.categoryId
        );
      } else {
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
    return <ProductListSkeleton />;
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
      <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => {
          const cat = product.categoryId
            ? categories?.find((c) => c.id === product.categoryId)
            : undefined;
          return (
            <ProductRow
              key={product.id}
              product={product}
              categoryColor={cat?.color}
              categoryName={cat?.name}
              onAdd={() => handleAddToCart(product)}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// --- Individual Product Row (carte horizontale) ---
interface ProductRowProps {
  product: ProductItem;
  categoryColor?: string | null;
  categoryName?: string;
  onAdd: () => void;
}

function ProductRow({ product, categoryColor, categoryName, onAdd }: ProductRowProps) {
  const isOutOfStock = product.quantity === 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 5;
  const hasImage = Boolean(product.imageUrl);

  // Récupère la quantité dans le panier pour ce produit (pour le sélecteur)
  const cartItem = useCartStore((s) =>
    s.items.find((item) => item.productId === product.id)
  );
  const cartQty = cartItem?.quantity ?? 0;
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = () => {
    if (cartQty <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, cartQty - 1);
    }
  };

  const handleIncrement = () => {
    updateQuantity(product.id, cartQty + 1);
  };

  // Description secondaire (ex: "6 Inches (4 serve)" ou "Stock: 25 dispo")
  const description = product.description || categoryName || `Stock: ${product.quantity} dispo`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`
        relative flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3
        rounded-2xl border border-slate-200 dark:border-slate-800 bg-card
        transition-all duration-150
        ${isOutOfStock
          ? "opacity-60"
          : "hover:border-primary/40 hover:shadow-md"
        }
      `}
    >
      {/* Image produit (carrée, à gauche) — taille augmentée */}
      <div
        className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 shrink-0"
      >
        {hasImage ? (
          <img
            src={product.imageUrl as string}
            alt={product.name}
            className="object-cover w-full h-full"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" strokeWidth={1.25} />
          </div>
        )}
        {/* Dot de couleur catégorie en haut à gauche */}
        {categoryColor && (
          <span
            className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white/80 shadow-sm"
            style={{ backgroundColor: categoryColor }}
            aria-hidden
          />
        )}
        {/* Badge rupture/stock bas en haut à droite */}
        {isOutOfStock ? (
          <div className="absolute top-1.5 right-1.5">
            <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
              Rupture
            </Badge>
          </div>
        ) : isLowStock ? (
          <div className="absolute top-1.5 right-1.5">
            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-300">
              Stock bas
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Infos produit (milieu) */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {description}
        </p>
        <p className="text-base sm:text-lg font-bold text-primary tabular-nums mt-1">
          {formatFCFA(product.salePrice)}
        </p>
      </div>

      {/* Bouton ADD ou sélecteur de quantité (droite) */}
      <div className="shrink-0">
        {isOutOfStock ? (
          <span className="text-xs text-muted-foreground italic">Indispo</span>
        ) : cartQty === 0 ? (
          // Bouton ADD (pas encore dans le panier)
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
            aria-label={`Ajouter ${product.name} au panier`}
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
            Ajouter
          </motion.button>
        ) : (
          // Sélecteur de quantité (- N +)
          <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl border border-primary/30 bg-primary/5 p-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleDecrement}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              aria-label={`Retirer un ${product.name} du panier`}
            >
              <Minus className="w-4 h-4" strokeWidth={2.5} />
            </motion.button>
            <span className="min-w-[2rem] text-center font-bold text-base sm:text-lg tabular-nums text-foreground">
              {cartQty}
            </span>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={handleIncrement}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary text-primary-foreground shadow-sm flex items-center justify-center hover:bg-primary/90 transition-colors"
              aria-label={`Ajouter un ${product.name} au panier`}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// --- Loading Skeleton (liste verticale) ---
function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800"
        >
          <Skeleton className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-5 w-1/3" />
          </div>
          <Skeleton className="w-16 h-9 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  );
}
