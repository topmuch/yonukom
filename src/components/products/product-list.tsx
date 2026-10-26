// ============================================================
// YonuKom — Product List
// Search, category filter, product grid with add/edit
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductCard, type ProductCardData } from "./product-card";
import { ProductForm, type ProductFormData } from "./product-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";

export function ProductList() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCardData | null>(null);

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
      // Adapter les champs Prisma vers ProductCardData
      setProducts(
        (data.products || []).map((p: Record<string, unknown>) => ({
          id: String(p.id),
          name: String(p.name ?? ""),
          sku: (p.sku as string) ?? null,
          salePrice: Number(p.salePrice ?? 0),
          purchasePrice: Number(p.purchasePrice ?? 0),
          quantity: Number(p.quantity ?? 0),
          reservedQuantity: Number(p.reservedQuantity ?? 0),
          category: (p.category as string) ?? null,
          productType: (p.productType as string) ?? "standard",
          unitType: (p.unitType as string) ?? "piece",
          minStockAlert: Number(p.minStockAlert ?? 5),
          imageUrl: (p.imageUrl as string) ?? null,
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

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))];

  // Filter products
  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    const matchCategory =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Handle save (create or update) — POST sur /api/products (nouveau) ou PUT sur /api/products/[id]
  const handleSave = async (data: ProductFormData) => {
    try {
      if (data.id) {
        // Update
        const res = await fetch(`/api/products/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          setProducts((prev) =>
            prev.map((p) => (p.id === data.id ? { ...p, ...data } : p))
          );
        }
      } else {
        // Create — on POST sur /api/products (Prisma) avec businessId
        if (!businessId) return;
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            businessId,
          }),
        });
        if (res.ok) {
          const newProduct = await res.json();
          setProducts((prev) => [
            {
              id: String(newProduct.id),
              name: String(newProduct.name ?? ""),
              sku: (newProduct.sku as string) ?? null,
              salePrice: Number(newProduct.salePrice ?? 0),
              purchasePrice: Number(newProduct.purchasePrice ?? 0),
              quantity: Number(newProduct.quantity ?? 0),
              reservedQuantity: Number(newProduct.reservedQuantity ?? 0),
              category: (newProduct.category as string) ?? null,
              productType: (newProduct.productType as string) ?? "standard",
              unitType: (newProduct.unitType as string) ?? "piece",
              minStockAlert: Number(newProduct.minStockAlert ?? 5),
              imageUrl: (newProduct.imageUrl as string) ?? null,
            },
            ...prev,
          ]);
        }
      }
    } catch {
      // silently fail
    }
  };

  // Handle edit click
  const handleEdit = (product: ProductCardData) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  // Handle add click
  const handleAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Produits
        </h2>
        <Button size="sm" className="gap-1" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px]
              ${categoryFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
          >
            {cat === "all" ? "Tous" : cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              {products.length === 0 ? (
                <>
                  <h3 className="font-semibold">Aucun produit</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez votre premier produit pour commencer !
                  </p>
                  <Button className="gap-1" onClick={handleAdd}>
                    <Plus className="w-4 h-4" />
                    Ajouter un produit
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold">Aucun résultat</h3>
                  <p className="text-sm text-muted-foreground">
                    Essayez un autre terme de recherche ou catégorie.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Product count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} produit{filtered.length > 1 ? "s" : ""}
          {categoryFilter !== "all" && ` dans ${categoryFilter}`}
        </p>
      )}

      {/* Product Form Dialog — key forces remount when product changes */}
      <ProductForm
        key={editingProduct?.id ?? "new"}
        product={editingProduct}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />
    </div>
  );
}
