// ============================================================
// YonuKom — Product Card
// Displays product info with stock color coding
// ============================================================

"use client";

import { formatFCFA } from "@/lib/fcfa";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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

export function ProductCard({ product, onClick }: ProductCardProps) {
  const minAlert = product.minStockAlert ?? 5;
  const stock = getStockBadge(product.quantity, minAlert);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onClick?.(product)}
      >
        <CardContent className="p-3 space-y-1.5">
          {/* Name + category */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
            {product.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                {product.category}
              </Badge>
            )}
          </div>

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
