// ============================================================
// YonuKom — Stock Dashboard
// Summary cards + product list with stock issues
// Loss declaration for restaurant mode
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { LossDialog } from "./loss-dialog";
import { ProductList } from "@/components/products/product-list";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingDown,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatFCFA } from "@/lib/fcfa";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";

interface StockProduct {
  id: string;
  name: string;
  quantity: number;
  reservedQuantity: number;
  salePrice: number;
  minStockAlert: number;
  category?: string | null;
}

export function StockDashboard() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [lossProduct, setLossProduct] = useState<StockProduct | null>(null);
  const [lossOpen, setLossOpen] = useState(false);
  const [activeView, setActiveView] = useState<"dashboard" | "products">("dashboard");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      const url = businessId
        ? `/api/products?businessId=${encodeURIComponent(businessId)}`
        : `/api/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(
        (data.products || []).map((p: Record<string, unknown>) => ({
          id: String(p.id),
          name: String(p.name ?? ""),
          quantity: Number(p.quantity ?? 0),
          reservedQuantity: Number(p.reservedQuantity ?? 0),
          salePrice: Number(p.salePrice ?? 0),
          minStockAlert: Number(p.minStockAlert ?? 5),
          category: (p.category as string) ?? null,
        }))
      );
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Computed stats
  const totalProducts = products.length;
  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.minStockAlert
  );
  const stockIssues = [...outOfStock, ...lowStock];
  const displayProducts = showAll ? products : stockIssues;

  // Handle loss
  const handleLoss = (product: StockProduct) => {
    setLossProduct(product);
    setLossOpen(true);
  };

  const confirmLoss = async (quantity: number, reason: string) => {
    if (!lossProduct || !businessId) return;
    setActioningId("loss");
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("yonukom_token")
          : null;
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          productId: lossProduct.id,
          quantity,
          reason,
          type: "loss",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de l'enregistrement");
      }
      const data = await res.json();
      // Mettre à jour le stock localement depuis la réponse du serveur
      // (le serveur a déduit + clampé à 0).
      setProducts((prev) =>
        prev.map((p) =>
          p.id === lossProduct.id
            ? { ...p, quantity: data.product?.quantity ?? Math.max(0, p.quantity - quantity) }
            : p
        )
      );
      toast.success(
        `Perte enregistrée — ${lossProduct.name} (${quantity} unité${
          quantity > 1 ? "s" : ""
        })`
      );
      setLossProduct(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement de la perte");
    } finally {
      setActioningId(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View switcher */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Stock
        </h2>
        <div className="flex gap-2">
          <Button
            variant={activeView === "dashboard" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("dashboard")}
          >
            Tableau de bord
          </Button>
          <Button
            variant={activeView === "products" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView("products")}
          >
            Produits
          </Button>
        </div>
      </motion.div>

      {activeView === "products" ? (
        <ProductList />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardContent className="p-3 text-center">
                  <Package className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xl font-bold">{totalProducts}</p>
                  <p className="text-[10px] text-muted-foreground">Produits</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-yk-amber/30">
                <CardContent className="p-3 text-center">
                  <AlertTriangle className="w-5 h-5 text-yk-amber mx-auto mb-1" />
                  <p className="text-xl font-bold text-yk-amber">{lowStock.length}</p>
                  <p className="text-[10px] text-muted-foreground">Stock bas</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-destructive/30">
                <CardContent className="p-3 text-center">
                  <XCircle className="w-5 h-5 text-destructive mx-auto mb-1" />
                  <p className="text-xl font-bold text-destructive">{outOfStock.length}</p>
                  <p className="text-[10px] text-muted-foreground">Rupture</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filter toggle */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">
              {showAll ? "Tous les produits" : "Problèmes de stock"}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setShowAll(!showAll)}
            >
              <Filter className="w-3.5 h-3.5" />
              {showAll ? "Voir problèmes" : "Voir tout"}
            </Button>
          </div>

          {/* Stock items */}
          {displayProducts.length > 0 ? (
            <div className="space-y-2">
              {displayProducts.map((product) => {
                const available = product.quantity - product.reservedQuantity;
                const isOut = product.quantity === 0;
                const isLow = !isOut && product.quantity <= product.minStockAlert;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className={`${isOut ? "border-destructive/30" : isLow ? "border-yk-amber/30" : ""}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              {product.category && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0">
                                  {product.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-xs font-medium ${isOut ? "text-destructive" : isLow ? "text-yk-amber" : "text-yk-emerald"}`}>
                                Stock: {product.quantity}
                              </span>
                              {product.reservedQuantity > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  Réservé: {product.reservedQuantity}
                                </span>
                              )}
                              {product.reservedQuantity > 0 && (
                                <span className="text-xs text-primary">
                                  Dispo: {available}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Value + loss button */}
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">
                              {formatFCFA(product.quantity * product.salePrice)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[10px] gap-0.5 text-yk-amber hover:text-yk-amber"
                              onClick={() => handleLoss(product)}
                            >
                              <TrendingDown className="w-3 h-3" />
                              Perte
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                {stockIssues.length === 0 && !showAll ? (
                  <>
                    <p className="text-sm font-medium text-yk-emerald">Stock OK !</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Aucun produit en alerte ou rupture.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs"
                      onClick={() => setShowAll(true)}
                    >
                      Voir tous les produits
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun produit</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Total stock value */}
          {showAll && products.length > 0 && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground text-center">
                Valeur totale du stock :{" "}
                <span className="font-semibold text-foreground">
                  {formatFCFA(products.reduce((sum, p) => sum + p.quantity * p.salePrice, 0))}
                </span>
              </p>
            </>
          )}
        </>
      )}

      {/* Loss Dialog */}
      {lossProduct && (
        <LossDialog
          productName={lossProduct.name}
          open={lossOpen}
          onOpenChange={setLossOpen}
          onConfirm={confirmLoss}
        />
      )}
    </div>
  );
}
