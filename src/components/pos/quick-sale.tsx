// ============================================================
// YonuKom — Quick Sale
// Mode restaurant : gros boutons produit pour vente ultra-rapide
// Un tap = ajout au panier, pas de recherche ni filtre
// ============================================================

"use client";

import { useCartStore } from "@/stores/use-cart-store";
import { formatFCFA } from "@/lib/fcfa";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProductItem } from "@/components/pos/product-grid";
import { motion, AnimatePresence } from "framer-motion";

interface QuickSaleProps {
  /** Products to show as buttons */
  products: ProductItem[];
  /** Are products loading? */
  isLoading: boolean;
}

export function QuickSale({ products, isLoading }: QuickSaleProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);

  // Get quantity in cart for a product
  const getCartQty = (productId: string) => {
    return items.find((i) => i.productId === productId)?.quantity ?? 0;
  };

  const handleQuickAdd = (product: ProductItem) => {
    addItem({
      id: product.id,
      name: product.name,
      salePrice: product.salePrice,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Group by category for visual organization
  const groupedByCategory = products.reduce<Record<string, ProductItem[]>>(
    (acc, product) => {
      const cat = product.category || "Autres";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    },
    {}
  );

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {Object.entries(groupedByCategory).map(([category, catProducts]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence mode="popLayout">
                {catProducts.map((product) => {
                  const cartQty = getCartQty(product.id);
                  const isOutOfStock = product.quantity === 0;

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant={cartQty > 0 ? "default" : "outline"}
                        disabled={isOutOfStock}
                        onClick={() => handleQuickAdd(product)}
                        className={`
                          w-full h-auto min-h-[64px] py-3 px-3
                          flex flex-col items-start gap-0.5
                          relative transition-all
                          ${cartQty > 0 ? "bg-yk-emerald hover:bg-yk-emerald/90" : ""}
                          ${isOutOfStock ? "opacity-50" : ""}
                        `}
                      >
                        <span className="text-sm font-semibold leading-tight text-left line-clamp-1">
                          {product.name}
                        </span>
                        <span className={`text-xs font-medium ${cartQty > 0 ? "text-primary-foreground/80" : "text-yk-emerald"}`}>
                          {formatFCFA(product.salePrice)}
                        </span>
                        {cartQty > 0 && (
                          <Badge className="absolute top-1 right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                            {cartQty}
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm">Aucun produit configuré</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
