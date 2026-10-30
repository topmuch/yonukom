// ============================================================
// YonuKom — Loss Dialog
// Declare a stock loss (for restaurant mode)
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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface LossDialogProps {
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quantity: number, reason: string) => void;
}

export function LossDialog({ productName, open, onOpenChange, onConfirm }: LossDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity);
    if (!qty || qty <= 0) return;

    onConfirm(qty, reason.trim());
    setQuantity("");
    setReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yk-amber" />
            Déclarer une perte
          </DialogTitle>
          <DialogDescription>
            {productName} — cette quantité sera déduite du stock sans impacter le CA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="loss-qty">Quantité perdue *</Label>
            <Input
              id="loss-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="1"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="loss-reason">Motif</Label>
            <Textarea
              id="loss-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: produit périmé, casse..."
              rows={2}
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
            >
              Confirmer la perte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
