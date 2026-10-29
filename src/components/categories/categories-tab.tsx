"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Check,
  Package,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";

interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

const COLOR_PRESETS = [
  { name: "Bleu", value: "#3B82F6" },
  { name: "Vert", value: "#10B981" },
  { name: "Ambre", value: "#F59E0B" },
  { name: "Rose", value: "#EC4899" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Rouge", value: "#EF4444" },
  { name: "Slate", value: "#64748B" },
];

export function CategoriesTab() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState<string>("#3B82F6");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/categories?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormColor("#3B82F6");
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormColor(cat.color ?? "#3B82F6");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !formName.trim()) return;
    setSaving(true);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PATCH" : "POST";
      const body = editingCategory
        ? { businessId, name: formName.trim(), color: formColor }
        : { businessId, name: formName.trim(), color: formColor };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }

      toast.success(
        editingCategory
          ? "Catégorie mise à jour"
          : "Catégorie créée avec succès"
      );
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !businessId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/categories/${deleteTarget.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      toast.success("Catégorie supprimée");
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setDeleting(false);
    }
  };

  if (!businessId) {
    return (
      <div className="px-4 py-6">
        <ConnectivityBanner />
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Aucun commerce associé à votre compte.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <ConnectivityBanner />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Catégories de produits
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Créez vos propres catégories pour organiser vos produits dans la
            caisse et le catalogue.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-1.5 shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouvelle catégorie</span>
          <span className="sm:hidden">Nouvelle</span>
        </Button>
      </motion.div>

      {loading ? (
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">
              Chargement...
            </span>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-rose-200">
          <CardContent className="p-4 flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Tag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm mb-1">Aucune catégorie</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Créez votre première catégorie pour organiser vos produits (ex :
              Boissons, Plats, Cosmétiques, Vêtements...).
            </p>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Créer ma première catégorie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat, idx) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: (cat.color ?? "#64748B") + "20",
                      }}
                    >
                      <Tag
                        className="w-5 h-5"
                        style={{ color: cat.color ?? "#64748B" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Package className="w-3 h-3" />
                        {cat._count?.products ?? 0} produit
                        {(cat._count?.products ?? 0) > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1"
                      onClick={() => openEdit(cat)}
                    >
                      <Edit2 className="w-3 h-3" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto"
                      onClick={() => setDeleteTarget(cat)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Dialog Création / Édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "Modifier la catégorie"
                : "Nouvelle catégorie"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Modifiez le nom et la couleur de cette catégorie."
                : "Choisissez un nom et une couleur pour cette catégorie."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nom de la catégorie *</Label>
              <Input
                id="cat-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Boissons, Plats, Cosmétiques..."
                required
                autoFocus
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setFormColor(c.value)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform ${
                      formColor === c.value
                        ? "ring-2 ring-offset-2 ring-primary scale-105"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                    aria-label={c.name}
                  >
                    {formColor === c.value && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                La couleur permet d&apos;identifier la catégorie dans la caisse
                et la liste des produits.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={saving || !formName.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Sauvegarde...
                  </>
                ) : editingCategory ? (
                  "Mettre à jour"
                ) : (
                  "Créer la catégorie"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmation de suppression */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de supprimer la catégorie{" "}
              <strong className="text-foreground">{deleteTarget?.name}</strong>.
              {(deleteTarget?._count?.products ?? 0) > 0 && (
                <>
                  {" "}
                  Elle est associée à{" "}
                  <strong className="text-foreground">
                    {deleteTarget?._count?.products} produit
                    {(deleteTarget?._count?.products ?? 0) > 1 ? "s" : ""}
                  </strong>
                  . Ces produits ne seront pas supprimés mais n&apos;auront plus
                  de catégorie (ils apparaîtront dans &quot;Autres&quot;).
                </>
              )}
              <br />
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
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
