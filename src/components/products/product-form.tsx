// ============================================================
// YonuKom — Product Form Dialog
// Create / Edit product form
// ============================================================

"use client";

import { useState } from "react";
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
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Modifier les informations du produit" : "Créer un nouveau produit"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
