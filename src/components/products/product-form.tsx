// ============================================================
// YonuKom — Product Form Dialog
// Create / Edit product form — with image upload (base64)
// ============================================================

"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImagePlus, ImageOff, Loader2, X } from "lucide-react";
import type { ProductCardData } from "./product-card";

interface ProductFormProps {
  product?: ProductCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ProductFormData) => void;
}

export interface ProductFormData {
  id?: string;
  name: string;
  sku: string;
  category: string;
  salePrice: number;
  purchasePrice: number;
  quantity: number;
  productType: string;
  unitType: string;
  minStockAlert: number;
  imageUrl?: string;
}

const CATEGORIES = ["Plats", "Boissons", "Epicerie", "Cosmetiques", "Vetements", "Electronique", "Autre"];
const PRODUCT_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "plate_restaurant", label: "Plat restaurant" },
  { value: "service", label: "Service" },
];
const UNIT_TYPES = [
  { value: "piece", label: "Pièce" },
  { value: "kg", label: "Kilogramme" },
  { value: "litre", label: "Litre" },
  { value: "plat", label: "Plat" },
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 1_200_000; // ~1.2 MB → base64 ≲ 1.6 MB

/**
 * Lit un fichier image et retourne sa représentation en base64 (data URL).
 * On redimensionne côté client si l'image est trop grosse pour rester
 * compatible avec les limits de column Prisma (Text).
 */
function fileToResizedDataUrl(file: File, maxDim = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error("Format non supporté. Utilisez JPG, PNG ou WEBP."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Si l'image est déjà petite, on la garde telle quelle
      if (dataUrl.length <= MAX_IMAGE_BYTES) {
        resolve(dataUrl);
        return;
      }

      // Sinon on redimensionne via canvas
      const img = new Image();
      img.onerror = () => reject(new Error("Image invalide"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // WEBP d'abord (plus compact), fallback JPEG
        const out = canvas.toDataURL("image/webp", quality) || canvas.toDataURL("image/jpeg", quality);
        resolve(out);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ProductForm({ product, open, onOpenChange, onSave }: ProductFormProps) {
  const isEdit = !!product;

  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [salePrice, setSalePrice] = useState(product ? String(product.salePrice) : "");
  const [purchasePrice, setPurchasePrice] = useState(product ? String(product.purchasePrice ?? 0) : "");
  const [quantity, setQuantity] = useState(product ? String(product.quantity) : "0");
  const [productType, setProductType] = useState(product?.productType ?? "standard");
  const [unitType, setUnitType] = useState(product?.unitType ?? "piece");
  const [minStockAlert, setMinStockAlert] = useState(product ? String(product.minStockAlert ?? 5) : "5");
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    product?.imageUrl ?? undefined
  );
  const [imageError, setImageError] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setIsProcessingImage(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Erreur lors du chargement de l'image");
    } finally {
      setIsProcessingImage(false);
      // Reset input so selecting the same file again still triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(undefined);
    setImageError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !salePrice) return;

    onSave({
      id: product?.id,
      name: name.trim(),
      sku: sku.trim(),
      category,
      salePrice: parseInt(salePrice) || 0,
      purchasePrice: parseInt(purchasePrice) || 0,
      quantity: parseInt(quantity) || 0,
      productType,
      unitType,
      minStockAlert: parseInt(minStockAlert) || 5,
      imageUrl,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Modifier les informations du produit" : "Créer un nouveau produit"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* --- Image upload --- */}
          <div className="space-y-1.5">
            <Label>Photo du produit</Label>
            <div className="flex items-center gap-3">
              {/* Preview / Drop zone */}
              {imageUrl ? (
                <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={name || "Aperçu produit"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white"
                    aria-label="Retirer l'image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Ajouter une photo"
                >
                  {isProcessingImage ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[9px] mt-1">Ajouter</span>
                    </>
                  )}
                </button>
              )}

              {/* Text + Change button */}
              <div className="flex-1 space-y-1.5">
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {imageUrl
                    ? "Photo ajoutée. Vous pouvez la changer ou la retirer."
                    : "JPG, PNG ou WEBP. La photo sera affichée sur le POS et la fiche produit."}
                </p>
                {imageUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Changer
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessingImage}
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Choisir une image
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Téléverser une image produit"
              />
            </div>
            {imageError && (
              <p className="text-[10px] text-destructive flex items-center gap-1">
                <ImageOff className="w-3 h-3" />
                {imageError}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Nom du produit *</Label>
            <Input
              id="prod-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Thiébou Rouge"
              required
            />
          </div>

          {/* SKU + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sku">Référence (SKU)</Label>
              <Input
                id="prod-sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="PL-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-sale">Prix de vente (FCFA) *</Label>
              <Input
                id="prod-sale"
                type="number"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="1500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-purchase">Prix d&apos;achat (FCFA)</Label>
              <Input
                id="prod-purchase"
                type="number"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="800"
              />
            </div>
          </div>

          <Separator />

          {/* Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-qty">Quantité en stock</Label>
              <Input
                id="prod-qty"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-alert">Alerte stock bas</Label>
              <Input
                id="prod-alert"
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type de produit</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Unité</Label>
              <Select value={unitType} onValueChange={setUnitType}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_TYPES.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
