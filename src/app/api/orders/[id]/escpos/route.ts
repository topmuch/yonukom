// ============================================================
// YonuKom — ESC/POS receipt bytes
// GET /api/orders/:id/escpos
// Returns application/octet-stream (raw ESC/POS bytes for 58mm
// thermal printers). Consumed by the Bluetooth print bridge app.
// Mirrors the HTML receipt (/api/orders/:id/receipt) content.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  EscPosBuilder,
  formatFCFA,
  formatNum,
  padLine,
} from "@/lib/escpos";

export const dynamic = "force-dynamic";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Especes",
  wave: "Wave",
  orange_money: "Orange Money",
  cb: "Carte bancaire",
  cheque: "Cheque",
  virement: "Virement",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "A emporter",
  delivery: "Livraison",
};

const DEFAULT_QR_URL = "https://yonukom.qrtags.pro/";
const LINE_WIDTH = 32 as const;

function formatDate(d: Date): string {
  return (
    d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        orderItems: { include: { product: { select: { name: true } } } },
        payments: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    const [business, cashier, promo] = await Promise.all([
      db.business.findUnique({
        where: { id: order.businessId },
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          qrCodeUrl: true,
          ticketFooterMessage: true,
        },
      }),
      order.createdBy
        ? db.user.findUnique({
            where: { id: order.createdBy },
            select: { name: true },
          })
        : Promise.resolve(null),
      order.promoId
        ? db.promo.findUnique({
            where: { id: order.promoId },
            select: {
              name: true,
              percentage: true,
              type: true,
              productId: true,
              minAmount: true,
            },
          })
        : Promise.resolve(null),
    ]);

    const mainPayment = order.payments[0];
    const paymentLabel = mainPayment
      ? PAYMENT_LABELS[mainPayment.method] ?? mainPayment.method
      : "Non specifie";
    const orderTypeLabel =
      ORDER_TYPE_LABELS[order.orderType] ??
      (order.orderType === "delivery" ? "Livraison" : "Sur place");
    const deliveryFee =
      typeof order.deliveryFee === "number" ? order.deliveryFee : 0;
    const showDeliveryLine = order.orderType === "delivery" && deliveryFee > 0;

    // Promo discount calc (same as HTML receipt)
    let promoDiscount = 0;
    if (promo) {
      const pct = promo.percentage ?? 0;
      if (promo.type === "global" || promo.type === "amount") {
        promoDiscount = Math.round((order.subtotal * pct) / 100);
      } else if (promo.type === "product") {
        const matchingItemsTotal = order.orderItems
          .filter((it) => it.productId === promo.productId)
          .reduce((sum, it) => sum + it.totalPrice, 0);
        promoDiscount = Math.round((matchingItemsTotal * pct) / 100);
      }
    }
    const showPromoLine = Boolean(promo) && promoDiscount > 0;

    const shortId = order.id.slice(-8).toUpperCase();
    const qrTargetUrl = business?.qrCodeUrl?.trim() || DEFAULT_QR_URL;
    const footerMessage = business?.ticketFooterMessage?.trim() || "";

    // --- Build ESC/POS bytes ---
    const b = new EscPosBuilder();
    b.init();

    // Header — business name (double-size, bold, centered)
    b.align("center").size(1, 1).bold(true).line(business?.name ?? "YonuKom");
    b.size(0, 0).bold(false);
    if (business?.address)
      b.line(`${business.address}${business.city ? ", " + business.city : ""}`);
    else if (business?.city) b.line(business.city);
    if (business?.phone) b.line(`Tel: ${business.phone}`);

    b.separator(LINE_WIDTH);

    // Date / ticket number / cashier
    b.align("left");
    b.line(formatDate(order.createdAt));
    b.line(padLine("Ticket N", order.orderNumber || shortId, LINE_WIDTH));
    if (cashier) b.line(padLine("Caissier", cashier.name, LINE_WIDTH));

    b.separator(LINE_WIDTH);

    // Items
    for (const item of order.orderItems) {
      const name = item.product?.name ?? "Article";
      b.bold(true).line(name.slice(0, LINE_WIDTH)).bold(false);
      b.line(
        padLine(
          `x${item.quantity}  ${formatNum(item.unitPrice)}`,
          formatNum(item.totalPrice),
          LINE_WIDTH
        )
      );
    }

    b.separator(LINE_WIDTH);

    // Totals
    b.line(padLine("Sous-total", formatFCFA(order.subtotal), LINE_WIDTH));
    if (showDeliveryLine)
      b.line(padLine("Livraison", formatFCFA(deliveryFee), LINE_WIDTH));
    if (showPromoLine && promo) {
      b.line(
        padLine(
          `Promo ${promo.name} -${promo.percentage}%`,
          `-${formatNum(promoDiscount)}`,
          LINE_WIDTH
        )
      );
    }
    b.size(1, 1).bold(true);
    b.line(padLine("TOTAL", formatFCFA(order.totalAmount), LINE_WIDTH));
    b.size(0, 0).bold(false);

    b.separator(LINE_WIDTH);

    // Payment
    b.line(padLine("Paiement", paymentLabel, LINE_WIDTH));
    if (mainPayment)
      b.line(padLine("Recu", formatFCFA(mainPayment.amount), LINE_WIDTH));
    b.line(padLine("Type", orderTypeLabel, LINE_WIDTH));

    b.separator(LINE_WIDTH);

    // QR code
    b.align("center").qr(qrTargetUrl, 6).lf(1);
    b.line("Scannez pour noter notre service");

    // Footer message
    if (footerMessage) {
      b.lf(1).align("center").line(footerMessage);
    }

    // Thanks + cut
    b.lf(1).bold(true).size(1, 0).line("Merci de votre visite !").size(0, 0).bold(false);
    b.cut();

    const bytes = b.encode();

    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
        // Filename for debugging / saving to file
        "Content-Disposition": `inline; filename="ticket-${order.orderNumber || shortId}.bin"`,
      },
    });
  } catch (error) {
    console.error("Error generating ESC/POS receipt:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
