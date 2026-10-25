// ============================================================
// YonuKom — API E-Commerce Customers (mock for dev)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const MOCK_CUSTOMERS = [
  { id: "c1", name: "Fatou Diallo", phone: "771234567", paymentMethod: "wave", isB2B: false, totalOrders: 2 },
  { id: "c2", name: "Moussa Sow", phone: "782345678", paymentMethod: "orange_money", isB2B: false, totalOrders: 2 },
  { id: "c3", name: "Aïssa Ba", phone: "763456789", paymentMethod: "cash", isB2B: false, totalOrders: 1 },
  { id: "c4", name: "Ibrahima Ndiaye", phone: "774567890", paymentMethod: "wave", isB2B: true, totalOrders: 1 },
  { id: "c5", name: "Mariama Fall", phone: "705678901", paymentMethod: "orange_money", isB2B: false, totalOrders: 1 },
  { id: "c6", name: "Ousmane Sy", phone: "776789012", paymentMethod: "cash", isB2B: true, totalOrders: 3 },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let filtered = MOCK_CUSTOMERS;
  if (search) {
    const q = search.toLowerCase();
    filtered = MOCK_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }

  return NextResponse.json({ customers: filtered, total: filtered.length });
}

// POST — add customer (mock)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "name and phone are required" }, { status: 400 });
    }

    const newCustomer = {
      id: `c${Date.now()}`,
      name,
      phone,
      paymentMethod: body.paymentMethod || "cash",
      isB2B: body.isB2B || false,
      totalOrders: 0,
    };

    MOCK_CUSTOMERS.push(newCustomer);

    return NextResponse.json(newCustomer, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
