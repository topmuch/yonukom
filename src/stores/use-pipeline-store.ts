// ============================================================
// YonuKom — Store Zustand : Pipeline B2B
// Gère l'état du pipeline de devis B2B (grossiste)
// ============================================================

import { create } from "zustand";
import { toast } from "sonner";
import type { B2BOrderStatus } from "@/types";

export interface PipelineQuote {
  id: string;
  orderNumber: string;
  status: B2BOrderStatus;
  subtotal: number; // FCFA
  totalAmount: number; // FCFA
  paidAmount: number; // FCFA
  remainingAmount: number; // FCFA
  deliveryAddress?: string;
  deliveryDate?: string;
  isDelivered: boolean;
  isCancelled: boolean;
  customer: {
    id: string;
    name: string;
    phone: string;
    isB2B: boolean;
    creditLimit?: number;
  };
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    isDeposit: boolean;
    reference?: string;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineState {
  // --- ÉTAT ---
  /** All B2B quotes loaded */
  quotes: PipelineQuote[];
  /** Currently selected quote for detail view */
  selectedQuoteId: string | null;
  /** Filter by status */
  statusFilter: B2BOrderStatus | "all";
  /** Loading state */
  isLoading: boolean;
  /** Search query */
  searchQuery: string;

  // --- DERIVED (computed in component, not store) ---

  // --- ACTIONS ---
  /** Load quotes from API */
  loadQuotes: (businessId: string) => Promise<void>;
  /** Set selected quote */
  selectQuote: (id: string | null) => void;
  /** Set status filter */
  setStatusFilter: (status: B2BOrderStatus | "all") => void;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Validate a quote (draft → quote_validated) */
  validateQuote: (quoteId: string) => Promise<boolean>;
  /** Mark as delivered (quote_validated → delivery_note) */
  deliverQuote: (quoteId: string) => Promise<boolean>;
  /** Invoice a quote (delivery_note → invoiced) */
  invoiceQuote: (quoteId: string) => Promise<boolean>;
  /** Cancel a quote */
  cancelQuote: (quoteId: string, reason: string) => Promise<boolean>;
  /** Refresh data */
  refresh: () => Promise<void>;
}

// Keep track of the last businessId used for refresh
let _lastBusinessId = "";

export const usePipelineStore = create<PipelineState>((set, get) => ({
  // --- ÉTAT INITIAL ---
  quotes: [],
  selectedQuoteId: null,
  statusFilter: "all",
  isLoading: false,
  searchQuery: "",

  // --- ACTIONS ---

  loadQuotes: async (businessId: string) => {
    set({ isLoading: true });
    _lastBusinessId = businessId;

    try {
      const res = await fetch("/api/b2b-quotes?businessId=" + encodeURIComponent(businessId));

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      set({ quotes: data.quotes ?? data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de chargement des devis";
      toast.error(message);
      set({ isLoading: false });
    }
  },

  selectQuote: (id) => {
    set({ selectedQuoteId: id });
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  validateQuote: async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "quote_validated" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const updated = await res.json();
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? { ...q, ...updated, updatedAt: new Date().toISOString() } : q)),
      }));
      toast.success("Devis validé avec succès");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de validation";
      toast.error(message);
      return false;
    }
  },

  deliverQuote: async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivery_note" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const updated = await res.json();
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? { ...q, ...updated, isDelivered: true, updatedAt: new Date().toISOString() } : q)),
      }));
      toast.success("Bon de livraison créé");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de livraison";
      toast.error(message);
      return false;
    }
  },

  invoiceQuote: async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "invoiced" }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const updated = await res.json();
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? { ...q, ...updated, updatedAt: new Date().toISOString() } : q)),
      }));
      toast.success("Facture créée avec succès");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de facturation";
      toast.error(message);
      return false;
    }
  },

  cancelQuote: async (quoteId: string, reason: string) => {
    try {
      const res = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled", cancellationReason: reason }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Erreur ${res.status}`);
      }

      const updated = await res.json();
      set((state) => ({
        quotes: state.quotes.map((q) => (q.id === quoteId ? { ...q, ...updated, isCancelled: true, updatedAt: new Date().toISOString() } : q)),
      }));
      toast.success("Devis annulé");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur d'annulation";
      toast.error(message);
      return false;
    }
  },

  refresh: async () => {
    const businessId = _lastBusinessId;
    if (!businessId) return;
    await get().loadQuotes(businessId);
  },
}));
