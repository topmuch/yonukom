// ============================================================
// YonuKom — API Products
// GET /api/products — retourne les produits pour le POS
// Pour la démo, retourne des données mock Sénégalaises
// En production, interroge la DB via Prisma
// ============================================================

import { NextResponse } from "next/server";

// Mock products — données réalistes pour un commerce Sénégalais
const MOCK_PRODUCTS = [
  // --- Plats (Restaurant) ---
  { id: "p1", name: "Thiébou Rouge", salePrice: 1500, quantity: 25, category: "Plats" },
  { id: "p2", name: "Thiébou Dieune", salePrice: 2000, quantity: 20, category: "Plats" },
  { id: "p3", name: "Yassa Poulet", salePrice: 1800, quantity: 15, category: "Plats" },
  { id: "p4", name: "Mafé Viande", salePrice: 1500, quantity: 18, category: "Plats" },
  { id: "p5", name: "Dibi", salePrice: 2500, quantity: 10, category: "Plats" },
  { id: "p6", name: "Accara", salePrice: 500, quantity: 30, category: "Plats" },

  // --- Boissons ---
  { id: "p7", name: "Bissap", salePrice: 300, quantity: 50, category: "Boissons" },
  { id: "p8", name: "Bouye", salePrice: 300, quantity: 40, category: "Boissons" },
  { id: "p9", name: "Coca-Cola 33cl", salePrice: 350, quantity: 100, category: "Boissons" },
  { id: "p10", name: "Sprite 33cl", salePrice: 350, quantity: 80, category: "Boissons" },
  { id: "p11", name: "Jus de Mango", salePrice: 500, quantity: 35, category: "Boissons" },
  { id: "p12", name: "Ataya", salePrice: 200, quantity: 60, category: "Boissons" },

  // --- Épicerie ---
  { id: "p13", name: "Riz 25kg", salePrice: 15000, quantity: 12, category: "Epicerie" },
  { id: "p14", name: "Huile 5L", salePrice: 7500, quantity: 8, category: "Epicerie" },
  { id: "p15", name: "Sucre 1kg", salePrice: 750, quantity: 45, category: "Epicerie" },
  { id: "p16", name: "Café Touba 500g", salePrice: 2500, quantity: 30, category: "Epicerie" },
  { id: "p17", name: "Lait Concentré", salePrice: 600, quantity: 55, category: "Epicerie" },
  { id: "p18", name: "Savon 500g", salePrice: 500, quantity: 0, category: "Epicerie" },

  // --- Cosmétiques ---
  { id: "p19", name: "Crème Mains 200ml", salePrice: 2000, quantity: 20, category: "Cosmetiques" },
  { id: "p20", name: "Huile Palme 1L", salePrice: 1500, quantity: 25, category: "Cosmetiques" },

  // --- Vêtements ---
  { id: "p21", name: "Boubou Homme", salePrice: 15000, quantity: 5, category: "Vetements" },
  { id: "p22", name: "Pagne Wax 6 yards", salePrice: 8000, quantity: 10, category: "Vetements" },
  { id: "p23", name: "T-shirt Coton", salePrice: 3000, quantity: 3, category: "Vetements" },

  // --- Électronique ---
  { id: "p24", name: "Chargeur USB-C", salePrice: 2500, quantity: 15, category: "Electronique" },
  { id: "p25", name: "Écouteurs Bluetooth", salePrice: 8000, quantity: 7, category: "Electronique" },
];

export async function GET() {
  // In production, replace with Prisma query:
  // const products = await db.product.findMany({ where: { isActive: true } });

  return NextResponse.json({
    products: MOCK_PRODUCTS,
    total: MOCK_PRODUCTS.length,
  });
}
