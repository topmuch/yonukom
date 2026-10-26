// ============================================================
// YonuKom — Product Card
// Displays product info with stock color coding + image preview
// ============================================================

"use client";

import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

export interface ProductCardData {
  id: string;
  name: string;
  sku?: string | null;
  salePrice: number;
  purchasePrice?: number;
  quantity: number;
  reservedQuantity?: number;
  category?: string | null;
  productType?: string;
  unitType?: string;
  minStockAlert?: number;
  imageUrl?: string | null;
}

interface ProductCardProps {
  product: ProductCardData;
  onClick?: (product: ProductCardData) => void;
}

function getStockBadge(quantity: number, minAlert: number): { label: string; className: string } {
  if (quantity === 0) return { label: "Rupture", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (quantity <= minAlert) return { label: `${quantity} restant`, className: "bg-yk-amber/10 text-yk-amber border-yk-amber/20" };
  return { label: `${quantity} en stock`, className: "bg-yk-emerald/10 text-yk-emerald border-yk-emerald/20" };
}

// Subtle gradient based on category for the placeholder (no image)
const CATEGORY_GRADIENTS: Record<string, string> = {
  Plats: "from-orange-400/30 to-rose-400/30",
  Boissons: "from-cyan-400/30 to-blue-400/30",
  Epicerie: "from-amber-400/30 to-orange-400/30",
  Cosmetiques: "from-pink-400/30 to-fuchsia-400/30",
  Vetements: "from-violet-400/30 to-indigo-400/30",
  Electronique: "from-slate-400/30 to-cyan-400/30",
  Autre: "from-emerald-400/30 to-teal-400/30",
};

function placeholderGradient(category?: string | null): string {
  return CATEGORY_GRADIENTS[category ?? ""] ?? "from-primary/20 to-yk-emerald/20";
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const minAlert = product.minStockAlert ?? 5;
  const stock = getStockBadge(product.quantity, minAlert);
  const hasImage = Boolean(product.imageUrl);
  const gradient = placeholderGradient(product.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
        onClick={() => onClick?.(product)}
      >
        {/* --- Image (or colorful gradient placeholder) --- */}
        <div className={`relative w-full aspect-square bg-gradient-to-br ${gradient}`}>
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl as string}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-foreground/40" strokeWidth={1.5} />
            </div>
          )}

          {/* Category badge overlaid on image */}
          {product.category && (
            <Badge
              variant="outline"
              className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-white/85 backdrop-blur-sm border-white/50"
            >
              {product.category}
            </Badge>
          )}
        </div>

        <CardContent className="p-3 space-y-1.5">
          {/* Name */}
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* SKU */}
          {product.sku && (
            <p className="text-[10px] text-muted-foreground font-mono">{product.sku}</p>
          )}

          {/* Price */}
          <p className="font-bold text-sm text-yk-emerald">{formatFCFA(product.salePrice)}</p>

          {/* Stock badge */}
          <Badge className={`${stock.className} border text-[10px]`}>
            {stock.label}
          </Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}
