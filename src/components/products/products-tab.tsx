// ============================================================
// YonuKom — Products Tab
// CRUD products management (separate from Stock tab which is for
// stock movements/alerts/loss declaration).
// Header + search + category chips + product grid with stock color
// coding + Edit/Delete actions.
// ============================================================

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatFCFA } from "@/lib/fcfa";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/products/product-form";
import type { ProductCardData } from "@/components/products/product-card";

// Same category list as ProductForm
const CATEGORIES = [
  "Plats",
  "Boissons",
  "Epicerie",
  "Cosmetiques",
  "Vetements",
  "Electronique",
  "Autre",
];

/** Stock level color coding based on quantity. */
function getStockLevel(
  quantity: number
): { label: string; className: string; dot: string } {
  if (quantity === 0) {
    return {
      label: "Rupture",
      className:
        "bg-destructive/10 text-destructive border-destructive/20",
      dot: "bg-destructive",
    };
  }
  if (quantity < 5) {
    return {
      label: `${quantity} en stock`,
      className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
      dot: "bg-red-500",
    };
  }
  if (quantity < 10) {
    return {
      label: `${quantity} en stock`,
      className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
      dot: "bg-amber-500",
    };
  }
  return {
    label: `${quantity} en stock`,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
    dot: "bg-emerald-500",
  };
}

export function ProductsTab() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const userRole = user?.role;

  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCardData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductCardData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Fetch products ---
  const fetchProducts = useCallback(async () => {
    if (!businessId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/products?businessId=${encodeURIComponent(businessId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Échec du chargement");
      const data = (await res.json()) as { products?: ProductCardData[] };
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // --- Save (create or update) ---
  const handleSave = async (data: ProductFormData) => {
    if (!businessId) return;
    try {
      if (data.id) {
        // Update
        const res = await fetch(`/api/products/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            sku: data.sku,
            category: data.category,
            salePrice: data.salePrice,
            purchasePrice: data.purchasePrice,
            quantity: data.quantity,
            productType: data.productType,
            unitType: data.unitType,
            minStockAlert: data.minStockAlert,
            imageUrl: data.imageUrl,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Échec de la mise à jour");
        }
        const updated = (await res.json()) as ProductCardData;
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
        );
        toast.success(`Produit ${updated.name} mis à jour`);
      } else {
        // Create
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            name: data.name,
            sku: data.sku,
            category: data.category,
            salePrice: data.salePrice,
            purchasePrice: data.purchasePrice,
            quantity: data.quantity,
            productType: data.productType,
            unitType: data.unitType,
            minStockAlert: data.minStockAlert,
            imageUrl: data.imageUrl,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Échec de la création");
        }
        const created = (await res.json()) as ProductCardData;
        setProducts((prev) => [created, ...prev]);
        toast.success(`Produit ${created.name} créé`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement"
      );
    }
  };

  // --- Delete ---
  const handleDelete = async () => {
    if (!deleteTarget || !businessId) return;
    const target = deleteTarget;
    setDeletingId(target.id);
    try {
      const params = new URLSearchParams({
        businessId,
      });
      if (userRole) params.set("userRole", userRole);

      const res = await fetch(
        `/api/products/${target.id}?${params.toString()}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression");
      }
      setProducts((prev) => prev.filter((p) => p.id !== target.id));
      toast.success(`Produit ${target.name} supprimé`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // --- Derived data: categories present in this business ---
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return CATEGORIES.filter((c) => set.has(c));
  }, [products]);

  // --- Filtered products ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q);
      const matchCategory =
        activeCategory === "all" || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  // --- Handlers for opening dialogs ---
  const handleNew = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEdit = (product: ProductCardData) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-8 w-72" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Permission check: only patron or gerant can delete
  const canDelete = userRole === "patron" || userRole === "gerant";

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-2"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-500" />
          Produits
        </h2>
        <Button size="sm" className="gap-1" onClick={handleNew}>
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau produit</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou référence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category chips */}
      {availableCategories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors ${
              activeCategory === "all"
                ? "bg-purple-500 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Tous
            <span className="ml-1.5 text-[10px] opacity-80">
              {products.length}
            </span>
          </button>
          {availableCategories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-3 h-8 rounded-full text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-purple-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {cat}
                <span className="ml-1.5 text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Product grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            {products.length === 0 ? (
              <>
                <h3 className="font-semibold">Aucun produit</h3>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur &laquo;&nbsp;Nouveau produit&nbsp;&raquo; pour
                  ajouter votre premier article.
                </p>
                <Button className="gap-1" onClick={handleNew}>
                  <Plus className="w-4 h-4" />
                  Nouveau produit
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
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => {
                const stock = getStockLevel(product.quantity);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                      {/* Image */}
                      <div className="relative w-full aspect-square bg-muted">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-muted-foreground/40" />
                          </div>
                        )}
                        {product.category && (
                          <Badge
                            variant="outline"
                            className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-white/85 backdrop-blur-sm"
                          >
                            {product.category}
                          </Badge>
                        )}
                        {/* Stock dot */}
                        <span
                          className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${stock.dot} ring-2 ring-white`}
                          aria-hidden
                        />
                      </div>

                      <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                        {/* Name */}
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                          {product.name}
                        </h3>

                        {/* SKU */}
                        {product.sku && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {product.sku}
                          </p>
                        )}

                        {/* Price */}
                        <p className="font-bold text-sm text-yk-emerald">
                          {formatFCFA(product.salePrice)}
                        </p>

                        {/* Stock badge */}
                        <Badge
                          className={`${stock.className} border text-[10px] w-fit`}
                        >
                          {stock.label}
                        </Badge>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-auto pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 flex-1 gap-1 text-xs"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={deletingId === product.id}
                              onClick={() => setDeleteTarget(product)}
                              title="Supprimer"
                              aria-label={`Supprimer ${product.name}`}
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Count */}
          <p className="text-xs text-muted-foreground text-center">
            {filtered.length} produit{filtered.length > 1 ? "s" : ""}
            {activeCategory !== "all" && ` dans « ${activeCategory} »`}
          </p>
        </>
      )}

      {/* Product form dialog — ProductForm renders its own Dialog wrapper */}
      <ProductForm
        key={editingProduct?.id ?? "new"}
        product={editingProduct}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer cette commande/client/facture/devis ? Cette action est
              irréversible.
              {deleteTarget && (
                <span className="block mt-1 text-xs font-medium">
                  {deleteTarget.name}
                  {deleteTarget.sku && (
                    <span className="block font-mono text-[10px] text-muted-foreground">
                      {deleteTarget.sku}
                    </span>
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
