"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Store,
  Phone,
  MapPin,
  Truck,
  Package,
  Loader2,
  ShoppingCart,
  Search,
  ChevronRight,
  Star,
  Shield,
  Clock,
} from "lucide-react";

// ============================================================
// Page publique de la Boutique en Ligne Express
// URL: /b/[slug] — pas d'auth requise
// Design: vraie boutique e-commerce (mobile-first, premium)
// ============================================================

interface StoreInfo {
  id: string;
  name: string;
  storeSlug: string;
  isStoreActive: boolean;
  storeLogoUrl: string | null;
  storeBannerUrl: string | null;
  storePrimaryColor: string;
  allowPickup: boolean;
  allowDelivery: boolean;
  deliveryFee: number;
  ownerPhone: string | null;
}

interface StoreProduct {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
}

interface CartItem {
  product: StoreProduct;
  quantity: number;
}

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    totalAmount: number;
    waMeUrl: string;
  } | null>(null);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "WAVE_OM_LINK">("CASH_ON_DELIVERY");

  const fetchStore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/store?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Boutique introuvable");
        throw new Error("Erreur de chargement");
      }
      const data = await res.json();
      setStore(data.store);
      setProducts(data.products || []);
      setIsClosed(data.isClosed || false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  // Cart helpers
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const deliveryFee = deliveryMethod === "DELIVERY" && store ? store.deliveryFee : 0;
  const grandTotal = cartTotal + deliveryFee;

  const addToCart = (product: StoreProduct) => {
    const existing = cart.find((item) => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.availableQuantity) return;
      setCart(cart.map((item) =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.product.availableQuantity) return item;
      return { ...item, quantity: newQty };
    }));
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (deliveryMethod === "DELIVERY" && !deliveryAddress.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: store?.id,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress.trim() : null,
          deliveryMethod,
          paymentMethod,
          items: cart.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la commande");
      }
      const data = await res.json();
      setOrderSuccess({ totalAmount: data.totalAmount, waMeUrl: data.waMeUrl });
      setCart([]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter(p => p.name.toLowerCase().includes(q) || (p.category?.toLowerCase().includes(q)));
  }, [products, searchQuery]);

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, StoreProduct[]> = {};
    for (const p of filteredProducts) {
      const cat = p.category || "Autres";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [filteredProducts]);

  const primaryColor = store?.storePrimaryColor || "#1E40AF";

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-900">{error}</p>
          <p className="text-sm text-slate-500">Vérifiez le lien de la boutique.</p>
        </div>
      </div>
    );
  }

  // --- Boutique fermée ---
  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-lg font-bold text-slate-900">{store?.name}</p>
          <p className="text-sm text-slate-500">Cette boutique est temporairement fermée.</p>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: primaryColor + "20" }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
          <h1 className="text-xl font-bold text-slate-900">Commande envoyée !</h1>
          <p className="text-2xl font-bold" style={{ color: primaryColor }}>
            {orderSuccess.totalAmount.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-sm text-slate-500">
            Le vendeur va vous contacter pour confirmer votre commande.
          </p>
          <a
            href={orderSuccess.waMeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: "#25D366" }}
          >
            <Phone className="w-4 h-4" />
            Contacter le vendeur
          </a>
        </motion.div>
      </div>
    );
  }

  // --- Page principale ---
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ===== HEADER avec bannière ===== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        {/* Banner */}
        {store?.storeBannerUrl && (
          <div className="w-full h-28 sm:h-36 overflow-hidden">
            <img src={store.storeBannerUrl} alt={store.name} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Store info bar */}
        <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
          {store?.storeLogoUrl ? (
            <img src={store.storeLogoUrl} alt={store.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/30" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center ring-2 ring-white/30">
              <Store className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-white truncate">{store?.name}</h1>
            <div className="flex items-center gap-3 text-[11px] text-white/80">
              {store?.allowPickup && (
                <span className="flex items-center gap-0.5"><Package className="w-3 h-3" /> Retrait</span>
              )}
              {store?.allowDelivery && (
                <span className="flex items-center gap-0.5"><Truck className="w-3 h-3" /> Livraison {store.deliveryFee > 0 ? `${store.deliveryFee.toLocaleString("fr-FR")} F` : "gratuite"}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-semibold text-white">Ouvert</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-slate-300 focus:bg-white transition-colors"
            />
          </div>
        </div>
      </header>

      {/* Error toast */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-40 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm shadow-lg">
          {error}
        </div>
      )}

      {/* ===== PRODUCTS ===== */}
      <main className="max-w-3xl mx-auto px-4 py-4">
        {Object.entries(groupedProducts).map(([category, catProducts]) => (
          <div key={category} className="mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2.5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
              {category}
              <span className="text-xs text-slate-400 font-normal">({catProducts.length})</span>
            </h2>

            {/* Product cards — grid 2 cols mobile, 3 cols desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {catProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isAvailable = product.availableQuantity > 0;
                return (
                  <div
                    key={product.id}
                    className={`relative bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all ${
                      isAvailable ? "hover:shadow-md hover:border-slate-200" : "opacity-60"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-slate-100">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                      {/* Stock badge */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-lg bg-white text-xs font-bold text-slate-700">Rupture</span>
                        </div>
                      )}
                      {isAvailable && product.availableQuantity <= 5 && (
                        <div className="absolute top-1.5 right-1.5">
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold">Plus que {product.availableQuantity}</span>
                        </div>
                      )}
                    </div>

                    {/* Info + price */}
                    <div className="p-2.5">
                      <p className="font-medium text-xs text-slate-900 line-clamp-2 min-h-[2rem]">{product.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="font-bold text-sm" style={{ color: primaryColor }}>
                          {product.salePrice.toLocaleString("fr-FR")}
                          <span className="text-[10px] font-normal text-slate-400 ml-0.5">FCFA</span>
                        </span>
                        {/* Add button */}
                        {isAvailable && !inCart && (
                          <button
                            onClick={() => addToCart(product)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-transform active:scale-90"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                          </button>
                        )}
                        {isAvailable && inCart && (
                          <div className="inline-flex items-center gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: primaryColor + "15" }}>
                            <button onClick={() => updateQuantity(product.id, -1)} className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center" style={{ color: primaryColor }}>
                              <Minus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                            <span className="min-w-[1.2rem] text-center text-xs font-bold" style={{ color: primaryColor }}>{inCart.quantity}</span>
                            <button onClick={() => updateQuantity(product.id, 1)} disabled={inCart.quantity >= product.availableQuantity} className="w-6 h-6 rounded-md flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}>
                              <Plus className="w-3 h-3" strokeWidth={2.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {searchQuery ? "Aucun produit trouvé." : "Aucun produit disponible pour le moment."}
            </p>
          </div>
        )}
      </main>

      {/* ===== TRUST BADGES ===== */}
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border border-slate-100">
            <Shield className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 text-center">Paiement sécurisé</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border border-slate-100">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 text-center">Réponse rapide</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white border border-slate-100">
            <Phone className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 text-center">Contact WhatsApp</span>
          </div>
        </div>
      </div>

      {/* ===== FLOATING CART BAR ===== */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3"
          >
            <button
              onClick={() => setCartOpen(true)}
              className="w-full max-w-3xl mx-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white font-bold shadow-2xl transition-transform active:scale-98"
              style={{ backgroundColor: primaryColor }}
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-[10px] font-bold flex items-center justify-center" style={{ color: primaryColor }}>
                  {cartCount}
                </span>
              </div>
              <span className="text-sm">Voir le panier</span>
              <span className="ml-auto text-base">{grandTotal.toLocaleString("fr-FR")} FCFA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CART SHEET (bottom) ===== */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end"
            onClick={() => setCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full max-w-3xl mx-auto rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="pt-3 flex justify-center">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="font-bold text-slate-900">Mon panier ({cartCount})</h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      {item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{item.product.salePrice.toLocaleString("fr-FR")} FCFA × {item.quantity}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: primaryColor }}>{(item.product.salePrice * item.quantity).toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: primaryColor + "15" }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center" style={{ color: primaryColor }}>
                        <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.availableQuantity} className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Votre panier est vide</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  {/* Delivery method */}
                  <div className="flex gap-2">
                    {store?.allowPickup && (
                      <button onClick={() => setDeliveryMethod("PICKUP")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          deliveryMethod === "PICKUP" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"
                        }`}
                        style={deliveryMethod === "PICKUP" ? { backgroundColor: primaryColor } : {}}>
                        <Package className="w-4 h-4" /> Retrait boutique
                      </button>
                    )}
                    {store?.allowDelivery && (
                      <button onClick={() => setDeliveryMethod("DELIVERY")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${
                          deliveryMethod === "DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"
                        }`}
                        style={deliveryMethod === "DELIVERY" ? { backgroundColor: primaryColor } : {}}>
                        <Truck className="w-4 h-4" /> Livraison
                      </button>
                    )}
                  </div>

                  {/* Total */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Sous-total</span>
                      <span>{cartTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    {deliveryMethod === "DELIVERY" && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Livraison</span>
                        <span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString("fr-FR")} FCFA` : "Gratuite"}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                      <span className="text-sm font-semibold text-slate-700">Total</span>
                      <span className="text-xl font-bold" style={{ color: primaryColor }}>{grandTotal.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>

                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-98"
                    style={{ backgroundColor: primaryColor }}>
                    Commander
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CHECKOUT DIALOG ===== */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setCheckoutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-slate-900">Finaliser ma commande</h3>
                <button onClick={() => setCheckoutOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Nom complet *</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Awa Diallo"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Téléphone (WhatsApp) *
                  </label>
                  <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="78 382 18 22"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                </div>
                {deliveryMethod === "DELIVERY" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Adresse de livraison *
                    </label>
                    <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ex: 2m Sicap Foire, Dakar — près de la pharmacie"
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className={`py-3 rounded-xl text-xs font-medium border transition-all ${
                        paymentMethod === "CASH_ON_DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={paymentMethod === "CASH_ON_DELIVERY" ? { backgroundColor: primaryColor } : {}}>
                      💵 À la livraison
                    </button>
                    <button onClick={() => setPaymentMethod("WAVE_OM_LINK")}
                      className={`py-3 rounded-xl text-xs font-medium border transition-all ${
                        paymentMethod === "WAVE_OM_LINK" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={paymentMethod === "WAVE_OM_LINK" ? { backgroundColor: primaryColor } : {}}>
                      📱 Wave / Orange Money
                    </button>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  {cartCount} article{cartCount > 1 ? "s" : ""} {deliveryMethod === "DELIVERY" ? `+ livraison` : ""}
                </span>
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {grandTotal.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              {/* Submit */}
              <button onClick={handleSubmitOrder}
                disabled={submitting || !customerName.trim() || !customerPhone.trim() || (deliveryMethod === "DELIVERY" && !deliveryAddress.trim())}
                className="w-full py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 shadow-lg transition-transform active:scale-98"
                style={{ backgroundColor: primaryColor }}>
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...
                  </span>
                ) : (
                  `Confirmer — ${grandTotal.toLocaleString("fr-FR")} FCFA`
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400">
                En confirmant, vous acceptez d'être contacté par le vendeur pour finaliser votre commande.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
