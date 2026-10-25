// ============================================================
// YonuKom — Génération de liens WhatsApp (wa.me)
// Module E-Commerce Social : envoi automatique du récapitulatif
// de commande via WhatsApp avec champ pour lien de paiement
// ============================================================

import { formatFCFA } from "./fcfa";

interface WhatsAppOrderData {
  customerPhone: string; // Numéro du client (format: "221771234567")
  customerName: string;
  orderNumber: string;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  businessName: string;
  paymentMethod?: string; // "wave" | "orange_money"
  paymentNumber?: string; // Numéro Wave/OM du commerçant
}

/**
 * Génère un lien WhatsApp pré-rempli avec le récapitulatif de commande.
 * 
 * Format du message :
 * ─────────────────────────
 * 🛒 YonuKom - [Nom Business]
 * 
 * Bonjour [Nom Client] ! 🎉
 * Voici le récapitulatif de votre commande :
 * 
 * 📋 Commande #[Numéro]
 * ─────────────
 * • [Produit] x[Qté] : [Prix] FCFA
 * • [Produit] x[Qté] : [Prix] FCFA
 * ─────────────
 * 💰 TOTAL : [Total] FCFA
 * 
 * 💳 Paiement : [Wave/OM] au [Numéro]
 * 👇 Collez votre lien de paiement ici :
 * 
 * Merci pour votre confiance ! 🙏
 * ─────────────────────────
 * 
 * @returns URL wa.me complète (prête à ouvrir)
 */
export function generateWhatsAppLink(data: WhatsAppOrderData): string {
  const message = buildOrderMessage(data);
  const encodedMessage = encodeURIComponent(message);
  // Format: https://wa.me/[numéro]?text=[message encodé]
  return `https://wa.me/${data.customerPhone}?text=${encodedMessage}`;
}

/**
 * Construit le corps du message WhatsApp.
 */
function buildOrderMessage(data: WhatsAppOrderData): string {
  const lines: string[] = [];

  // En-tête
  lines.push(`🛒 *${data.businessName}*`);
  lines.push("");
  lines.push(`Bonjour ${data.customerName} ! 🎉`);
  lines.push("Voici le récapitulatif de votre commande :");
  lines.push("");

  // Détails commande
  lines.push(`📋 *Commande #${data.orderNumber}*`);
  lines.push("─────────────");

  for (const item of data.items) {
    lines.push(`• ${item.name} ×${item.quantity} : ${formatFCFA(item.totalPrice)}`);
  }

  lines.push("─────────────");
  lines.push(`💰 *TOTAL : ${formatFCFA(data.totalAmount)}*`);
  lines.push("");

  // Instructions de paiement
  if (data.paymentMethod && data.paymentNumber) {
    const methodLabel =
      data.paymentMethod === "wave" ? "Wave" : "Orange Money";
    lines.push(`💳 *Paiement ${methodLabel}* au : ${data.paymentNumber}`);
  }

  lines.push("👇 *Collez votre lien/confirmation de paiement ici :*");
  lines.push("");
  lines.push("Merci pour votre confiance ! 🙏");

  return lines.join("\n");
}

/**
 * Valide un numéro de téléphone sénégalais.
 * Formats acceptés : 77XXXXXX, 78XXXXXX, 76XXXXXX, 70XXXXXX
 * Avec ou sans préfixe : 22177XXXXXX ou 77XXXXXX
 */
export function validateSenegalPhone(phone: string): {
  isValid: boolean;
  formatted: string; // Format international: 221771234567
} {
  // Supprimer les espaces, tirets, etc.
  const cleaned = phone.replace(/[\s\-()]/g, "");

  // Vérifier le format
  const withPrefix = /^221(77|78|76|70)\d{6}$/.test(cleaned);
  const withoutPrefix = /^(77|78|76|70)\d{6}$/.test(cleaned);

  if (withPrefix) {
    return { isValid: true, formatted: cleaned };
  }

  if (withoutPrefix) {
    return { isValid: true, formatted: `221${cleaned}` };
  }

  return { isValid: false, formatted: cleaned };
}
