"use client";

// ============================================================
// YonuKom — BluetoothPrintButton
// Small reusable icon button that prints an order receipt to the
// paired Bluetooth thermal printer via the local bridge app.
// Uses the global radix <Toaster/> (mounted in layout.tsx) so it
// works in any component regardless of that component's own toast lib.
// ============================================================

import { useState } from "react";
import { Bluetooth, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { isBridgeAvailable, printOrderBluetooth } from "@/lib/bluetooth-print";

interface BluetoothPrintButtonProps {
  orderId: string;
  orderNumber?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}

export function BluetoothPrintButton({
  orderId,
  orderNumber,
  size = "sm",
  variant = "ghost",
  className,
}: BluetoothPrintButtonProps) {
  const [printing, setPrinting] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (printing) return;
    setPrinting(true);
    try {
      const status = await isBridgeAvailable();
      if (!status.available) {
        toast({
          title: "Pont d'impression introuvable",
          description:
            "Installez et lancez l'app « YonuKom Print Bridge » sur ce téléphone pour imprimer en Bluetooth.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Impression Bluetooth…",
        description: orderNumber
          ? `Envoi du ticket ${orderNumber} à l'imprimante.`
          : "Envoi du ticket à l'imprimante.",
      });
      const result = await printOrderBluetooth(orderId);
      if (result.ok) {
        toast({
          title: "Ticket imprimé ✓",
          description: "Le ticket a été envoyé à l'imprimante Bluetooth.",
        });
      } else {
        toast({
          title: "Échec de l'impression",
          description:
            result.error || "Vérifiez que l'imprimante est allumée et couplée.",
          variant: "destructive",
        });
      }
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={printing}
      title="Imprimer en Bluetooth"
      aria-label={`Imprimer le reçu${
        orderNumber ? " " + orderNumber : ""
      } en Bluetooth`}
      className={className}
    >
      {printing ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Bluetooth className="w-3.5 h-3.5" />
      )}
    </Button>
  );
}
