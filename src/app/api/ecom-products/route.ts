// ============================================================
// YonuKom — API E-Commerce Products (mock for dev)
// Extended product data with full fields for product management
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const MOCK_PRODUCTS = [
  { id: "p1", name: "Thiébou Rouge", sku: "PL-001", salePrice: 1500, purchasePrice: 800, quantity: 25, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 5, isActive: true },
  { id: "p2", name: "Thiébou Dieune", sku: "PL-002", salePrice: 2000, purchasePrice: 1100, quantity: 20, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 5, isActive: true },
  { id: "p3", name: "Yassa Poulet", sku: "PL-003", salePrice: 1800, purchasePrice: 1000, quantity: 15, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 5, isActive: true },
  { id: "p4", name: "Mafé Viande", sku: "PL-004", salePrice: 1500, purchasePrice: 850, quantity: 18, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 5, isActive: true },
  { id: "p5", name: "Dibi", sku: "PL-005", salePrice: 2500, purchasePrice: 1400, quantity: 10, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 3, isActive: true },
  { id: "p6", name: "Accara", sku: "PL-006", salePrice: 500, purchasePrice: 250, quantity: 30, reservedQuantity: 0, category: "Plats", productType: "plate_restaurant", unitType: "plat", minStockAlert: 10, isActive: true },
  { id: "p7", name: "Bissap", sku: "BO-001", salePrice: 300, purchasePrice: 100, quantity: 50, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 10, isActive: true },
  { id: "p8", name: "Bouye", sku: "BO-002", salePrice: 300, purchasePrice: 120, quantity: 40, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 10, isActive: true },
  { id: "p9", name: "Coca-Cola 33cl", sku: "BO-003", salePrice: 350, purchasePrice: 200, quantity: 100, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 20, isActive: true },
  { id: "p10", name: "Sprite 33cl", sku: "BO-004", salePrice: 350, purchasePrice: 200, quantity: 80, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 20, isActive: true },
  { id: "p11", name: "Jus de Mango", sku: "BO-005", salePrice: 500, purchasePrice: 250, quantity: 35, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 10, isActive: true },
  { id: "p12", name: "Ataya", sku: "BO-006", salePrice: 200, purchasePrice: 50, quantity: 60, reservedQuantity: 0, category: "Boissons", productType: "standard", unitType: "piece", minStockAlert: 15, isActive: true },
  { id: "p13", name: "Riz 25kg", sku: "EP-001", salePrice: 15000, purchasePrice: 12000, quantity: 12, reservedQuantity: 2, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 3, isActive: true },
  { id: "p14", name: "Huile 5L", sku: "EP-002", salePrice: 7500, purchasePrice: 6000, quantity: 8, reservedQuantity: 0, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 3, isActive: true },
  { id: "p15", name: "Sucre 1kg", sku: "EP-003", salePrice: 750, purchasePrice: 550, quantity: 45, reservedQuantity: 0, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 10, isActive: true },
  { id: "p16", name: "Café Touba 500g", sku: "EP-004", salePrice: 2500, purchasePrice: 1800, quantity: 30, reservedQuantity: 0, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 5, isActive: true },
  { id: "p17", name: "Lait Concentré", sku: "EP-005", salePrice: 600, purchasePrice: 400, quantity: 55, reservedQuantity: 0, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 10, isActive: true },
  { id: "p18", name: "Savon 500g", sku: "EP-006", salePrice: 500, purchasePrice: 300, quantity: 0, reservedQuantity: 0, category: "Epicerie", productType: "standard", unitType: "piece", minStockAlert: 5, isActive: true },
  { id: "p19", name: "Crème Mains 200ml", sku: "CO-001", salePrice: 2000, purchasePrice: 1200, quantity: 20, reservedQuantity: 0, category: "Cosmetiques", productType: "standard", unitType: "piece", minStockAlert: 5, isActive: true },
  { id: "p20", name: "Huile Palme 1L", sku: "CO-002", salePrice: 1500, purchasePrice: 900, quantity: 25, reservedQuantity: 0, category: "Cosmetiques", productType: "standard", unitType: "litre", minStockAlert: 5, isActive: true },
  { id: "p21", name: "Boubou Homme", sku: "VE-001", salePrice: 15000, purchasePrice: 8000, quantity: 5, reservedQuantity: 1, category: "Vetements", productType: "standard", unitType: "piece", minStockAlert: 2, isActive: true },
  { id: "p22", name: "Pagne Wax 6 yards", sku: "VE-002", salePrice: 8000, purchasePrice: 5000, quantity: 10, reservedQuantity: 0, category: "Vetements", productType: "standard", unitType: "piece", minStockAlert: 3, isActive: true },
  { id: "p23", name: "T-shirt Coton", sku: "VE-003", salePrice: 3000, purchasePrice: 1500, quantity: 3, reservedQuantity: 0, category: "Vetements", productType: "standard", unitType: "piece", minStockAlert: 5, isActive: true },
  { id: "p24", name: "Chargeur USB-C", sku: "EL-001", salePrice: 2500, purchasePrice: 1200, quantity: 15, reservedQuantity: 0, category: "Electronique", productType: "standard", unitType: "piece", minStockAlert: 5, isActive: true },
  { id: "p25", name: "Écouteurs Bluetooth", sku: "EL-002", salePrice: 8000, purchasePrice: 4000, quantity: 7, reservedQuantity: 0, category: "Electronique", productType: "standard", unitType: "piece", minStockAlert: 3, isActive: true },
];

export async function GET() {
  return NextResponse.json({ products: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length });
}

// POST — add product (mock)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProduct = {
      id: `p${Date.now()}`,
      name: body.name || "",
      sku: body.sku || null,
      salePrice: Number(body.salePrice) || 0,
      purchasePrice: Number(body.purchasePrice) || 0,
      quantity: Number(body.quantity) || 0,
      reservedQuantity: 0,
      category: body.category || null,
      productType: body.productType || "standard",
      unitType: body.unitType || "piece",
      minStockAlert: Number(body.minStockAlert) || 5,
      isActive: true,
    };

    MOCK_PRODUCTS.push(newProduct);

    return NextResponse.json(newProduct, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT — update product (mock)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    const idx = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    Object.assign(MOCK_PRODUCTS[idx], updates);

    return NextResponse.json(MOCK_PRODUCTS[idx]);
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}
