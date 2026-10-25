// ============================================================
// YonuKom — Store Zustand : Panier POS (Caisse)
// Gère le panier de vente rapide — objectif : vente en < 15 secondes
// ============================================================

import { create } from "zustand";

export interface CartItem {
  productId: string;
  productName: string;
  salePrice: number; // Prix unitaire en FCFA
  quantity: number;
  totalPrice: number; // = quantity × salePrice
}

export interface CartState {
  // --- ÉTAT ---
  /** Articles dans le panier */
  items: CartItem[];
  /** Client sélectionné pour cette vente */
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  /** Total du panier en FCFA */
  total: number;
  /** Nombre d'articles */
  itemCount: number;

  // --- ACTIONS ---
  /** Ajouter un produit au panier (ou incrémenter si déjà présent) */
  addItem: (product: { id: string; name: string; salePrice: number }) => void;
  /** Retirer un produit du panier */
  removeItem: (productId: string) => void;
  /** Changer la quantité d'un produit */
  updateQuantity: (productId: string, quantity: number) => void;
  /** Vider le panier */
  clearCart: () => void;
  /** Sélectionner un client */
  setCustomer: (customer: NonNullable<CartState["customer"]>) => void;
  /** Retirer le client */
  clearCustomer: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  total: 0,
  itemCount: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      // Incrémenter la quantité si déjà dans le panier
      const newQuantity = existing.quantity + 1;
      set({
        items: items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
                totalPrice: newQuantity * item.salePrice,
              }
            : item
        ),
      });
    } else {
      // Ajouter un nouveau produit
      set({
        items: [
          ...items,
          {
            productId: product.id,
            productName: product.name,
            salePrice: product.salePrice,
            quantity: 1,
            totalPrice: product.salePrice,
          },
        ],
      });
    }

    // Recalculer les totaux
    recalculateTotals(set, get);
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.productId !== productId),
    }));
    recalculateTotals(set, get);
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set((state) => ({
      items: state.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              totalPrice: quantity * item.salePrice,
            }
          : item
      ),
    }));
    recalculateTotals(set, get);
  },

  clearCart: () => {
    set({ items: [], customer: null, total: 0, itemCount: 0 });
  },

  setCustomer: (customer) => {
    set({ customer });
  },

  clearCustomer: () => {
    set({ customer: null });
  },
}));

// --- HELPER ---
function recalculateTotals(
  set: (fn: (state: CartState) => Partial<CartState>) => void,
  get: () => CartState
) {
  const { items } = get();
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  set({ total, itemCount });
}
