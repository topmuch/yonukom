// ============================================================
// YonuKom — API E-Commerce Orders (mock for dev)
// Returns mock orders in e-commerce social format with Kanban statuses
// ============================================================

import { NextRequest, NextResponse } from "next/server";

// Mock customers
const MOCK_CUSTOMERS = [
  { id: "c1", name: "Fatou Diallo", phone: "771234567" },
  { id: "c2", name: "Moussa Sow", phone: "782345678" },
  { id: "c3", name: "Aïssa Ba", phone: "763456789" },
  { id: "c4", name: "Ibrahima Ndiaye", phone: "774567890" },
  { id: "c5", name: "Mariama Fall", phone: "705678901" },
];

// Mock orders for e-commerce social kanban
const MOCK_ORDERS = [
  // À Payer
  {
    id: "o1",
    orderNumber: "YK-2025-0001",
    status: "to_pay",
    totalAmount: 15500,
    paidAmount: 0,
    remainingAmount: 15500,
    customerId: "c1",
    customer: MOCK_CUSTOMERS[0],
    orderItems: [
      { id: "oi1", productName: "Boubou Homme", quantity: 1, unitPrice: 15000, totalPrice: 15000 },
      { id: "oi2", productName: "Bissap", quantity: 1, unitPrice: 500, totalPrice: 500 },
    ],
    payments: [] as { id: string; amount: number; method: string; createdAt: string }[],
    paymentMethod: "wave",
    whatsappSent: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "o2",
    orderNumber: "YK-2025-0002",
    status: "to_pay",
    totalAmount: 8000,
    paidAmount: 0,
    remainingAmount: 8000,
    customerId: "c2",
    customer: MOCK_CUSTOMERS[1],
    orderItems: [
      { id: "oi3", productName: "Pagne Wax 6 yards", quantity: 1, unitPrice: 8000, totalPrice: 8000 },
    ],
    payments: [] as { id: string; amount: number; method: string; createdAt: string }[],
    paymentMethod: "orange_money",
    whatsappSent: false,
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: "o3",
    orderNumber: "YK-2025-0003",
    status: "to_pay",
    totalAmount: 3500,
    paidAmount: 0,
    remainingAmount: 3500,
    customerId: "c3",
    customer: MOCK_CUSTOMERS[2],
    orderItems: [
      { id: "oi4", productName: "Thiébou Rouge", quantity: 1, unitPrice: 1500, totalPrice: 1500 },
      { id: "oi5", productName: "Coca-Cola 33cl", quantity: 2, unitPrice: 350, totalPrice: 700 },
      { id: "oi6", productName: "Bissap", quantity: 2, unitPrice: 300, totalPrice: 600 },
      { id: "oi7", productName: "Ataya", quantity: 1, unitPrice: 200, totalPrice: 200 },
      { id: "oi8", productName: "Accara", quantity: 1, unitPrice: 500, totalPrice: 500 },
    ],
    payments: [] as { id: string; amount: number; method: string; createdAt: string }[],
    paymentMethod: "cash",
    whatsappSent: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  // À Livrer
  {
    id: "o4",
    orderNumber: "YK-2025-0004",
    status: "to_ship",
    totalAmount: 15000,
    paidAmount: 15000,
    remainingAmount: 0,
    customerId: "c4",
    customer: MOCK_CUSTOMERS[3],
    orderItems: [
      { id: "oi9", productName: "Riz 25kg", quantity: 1, unitPrice: 15000, totalPrice: 15000 },
    ],
    payments: [
      { id: "pay1", amount: 15000, method: "wave", createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    ],
    paymentMethod: "wave",
    whatsappSent: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "o5",
    orderNumber: "YK-2025-0005",
    status: "to_ship",
    totalAmount: 22500,
    paidAmount: 22500,
    remainingAmount: 0,
    customerId: "c5",
    customer: MOCK_CUSTOMERS[4],
    orderItems: [
      { id: "oi10", productName: "Boubou Homme", quantity: 1, unitPrice: 15000, totalPrice: 15000 },
      { id: "oi11", productName: "Crème Mains 200ml", quantity: 1, unitPrice: 2000, totalPrice: 2000 },
      { id: "oi12", productName: "Huile Palme 1L", quantity: 1, unitPrice: 1500, totalPrice: 1500 },
      { id: "oi13", productName: "Savon 500g", quantity: 2, unitPrice: 500, totalPrice: 1000 },
      { id: "oi14", productName: "Bissap", quantity: 2, unitPrice: 1500, totalPrice: 3000 },
    ],
    payments: [
      { id: "pay2", amount: 22500, method: "orange_money", createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
    ],
    paymentMethod: "orange_money",
    whatsappSent: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  // Livré
  {
    id: "o6",
    orderNumber: "YK-2025-0006",
    status: "shipped",
    totalAmount: 7500,
    paidAmount: 7500,
    remainingAmount: 0,
    customerId: "c1",
    customer: MOCK_CUSTOMERS[0],
    orderItems: [
      { id: "oi15", productName: "Huile 5L", quantity: 1, unitPrice: 7500, totalPrice: 7500 },
    ],
    payments: [
      { id: "pay3", amount: 7500, method: "cash", createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    ],
    paymentMethod: "cash",
    whatsappSent: true,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "o7",
    orderNumber: "YK-2025-0007",
    status: "shipped",
    totalAmount: 3000,
    paidAmount: 3000,
    remainingAmount: 0,
    customerId: "c2",
    customer: MOCK_CUSTOMERS[1],
    orderItems: [
      { id: "oi16", productName: "T-shirt Coton", quantity: 1, unitPrice: 3000, totalPrice: 3000 },
    ],
    payments: [
      { id: "pay4", amount: 3000, method: "wave", createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
    ],
    paymentMethod: "wave",
    whatsappSent: true,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let filtered = MOCK_ORDERS;
  if (status) {
    filtered = MOCK_ORDERS.filter((o) => o.status === status);
  }

  return NextResponse.json({ orders: filtered, total: filtered.length });
}

// PUT — update order status (mock)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    const order = MOCK_ORDERS.find((o) => o.id === id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update in place (mock)
    order.status = status;

    if (status === "to_ship" || status === "shipped") {
      order.paidAmount = order.totalAmount;
      order.remainingAmount = 0;
      order.payments = [
        {
          id: `pay-mock-${Date.now()}`,
          amount: order.totalAmount,
          method: order.paymentMethod || "cash",
          createdAt: new Date().toISOString(),
        },
      ];
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
