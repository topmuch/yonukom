// ============================================================
// YonuKom — Customer Form
// Quick add (name + phone) + full edit dialog with address
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import type { CustomerCardData } from "./customer-card";

interface CustomerFormProps {
  customer?: CustomerCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CustomerFormData) => void;
}

export interface CustomerFormData {
  id?: string;
  name: string;
  phone: string;
  address?: string | null;
  paymentMethod: string;
  isB2B: boolean;
}

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Espèces" },
  { value: "wave", label: "Wave" },
  { value: "orange_money", label: "Orange Money" },
  { value: "cb", label: "Carte Bancaire" },
];

export function CustomerForm({ customer, open, onOpenChange, onSave }: CustomerFormProps) {
  const isEdit = !!customer;
  const isQuickAdd = !customer;

  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState<string>(customer?.address ?? "");
  const [paymentMethod, setPaymentMethod] = useState(customer?.paymentMethod ?? "cash");
  const [isB2B, setIsB2B] = useState(customer?.isB2B ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    onSave({
      id: customer?.id,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || null,
      paymentMethod,
      isB2B,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isQuickAdd ? "max-w-sm" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le client" : "Nouveau client"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? "Modifier les informations du client" : "Ajouter un nouveau client rapidement"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick add: name + phone */}
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">Nom *</Label>
            <Input
              id="cust-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fatou Diallo"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Téléphone *</Label>
            <Input
              id="cust-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="771234567"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cust-address">Adresse</Label>
            <Textarea
              id="cust-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quartier, rue, ville (ex: Médina, Dakar)"
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Extended fields for edit */}
          {isEdit && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <Label>Moyen de paiement</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="cust-b2b"
                  checked={isB2B}
                  onCheckedChange={(checked) => setIsB2B(checked === true)}
                />
                <Label htmlFor="cust-b2b" className="text-sm cursor-pointer">
                  Client B2B (grossiste)
                </Label>
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              {isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
