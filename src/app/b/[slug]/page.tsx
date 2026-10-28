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
} from "lucide-react";

// ============================================================
// Page publique de la Boutique en Ligne Express
// URL: /b/[slug] — pas d'auth requise
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

  // Fetch store data
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
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
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
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la commande");
      }

      const data = await res.json();
      setOrderSuccess({
        totalAmount: data.totalAmount,
        waMeUrl: data.waMeUrl,
      });
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

  // Group products by category
  const groupedProducts = useMemo(() => {
    const groups: Record<string, StoreProduct[]> = {};
    for (const p of products) {
      const cat = p.category || "Autres";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return groups;
  }, [products]);

  const primaryColor = store?.storePrimaryColor || "#1E40AF";

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: primaryColor }} />
          <p className="text-sm text-slate-500">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3 max-w-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-lg font-bold text-slate-900">{error}</p>
          <p className="text-sm text-slate-500">Vérifiez le lien de la boutique.</p>
        </div>
      </div>
    );
  }

  // --- Boutique fermée ---
  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-3 max-w-sm">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-lg font-bold text-slate-900">{store?.name}</p>
          <p className="text-sm text-slate-500">Cette boutique est temporairement fermée.</p>
        </div>
      </div>
    );
  }

  // --- Success ---
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm bg-white rounded-3xl shadow-xl p-8"
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
          <p className="text-sm text-slate-500">
            Total : <span className="font-bold" style={{ color: primaryColor }}>
              {orderSuccess.totalAmount.toLocaleString("fr-FR")} FCFA
            </span>
          </p>
          <p className="text-sm text-slate-500">
            Le vendeur va vous contacter pour confirmer votre commande.
          </p>
          <a
            href={orderSuccess.waMeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm"
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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Banner */}
      {store?.storeBannerUrl && (
        <div className="w-full h-32 sm:h-40 overflow-hidden">
          <img
            src={store.storeBannerUrl}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div
        className="px-4 py-4 flex items-center gap-3"
        style={{ backgroundColor: primaryColor }}
      >
        {store?.storeLogoUrl ? (
          <img
            src={store.storeLogoUrl}
            alt={store.name}
            className="w-12 h-12 rounded-xl object-cover bg-white/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-lg font-bold text-white">{store?.name}</h1>
          <p className="text-xs text-white/70">
            {store?.allowPickup && "Retrait en boutique"}
            {store?.allowPickup && store?.allowDelivery && " • "}
            {store?.allowDelivery && "Livraison"}
          </p>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Products by category */}
      <div className="px-4 py-4 space-y-6">
        {Object.entries(groupedProducts).map(([category, catProducts]) => (
          <div key={category}>
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2 px-1">
              {category}
            </h2>
            <div className="space-y-2">
              {catProducts.map((product) => {
                const inCart = cart.find((item) => item.product.id === product.id);
                const isAvailable = product.availableQuantity > 0;
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-slate-200 transition-all ${
                      isAvailable ? "hover:border-slate-300 hover:shadow-sm" : "opacity-60"
                    }`}
                  >
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 truncate">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>
                      )}
                      <p className="font-bold text-sm mt-0.5" style={{ color: primaryColor }}>
                        {product.salePrice.toLocaleString("fr-FR")} FCFA
                      </p>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {!isAvailable ? (
                        <span className="text-xs text-slate-400 italic">Rupture</span>
                      ) : inCart ? (
                        <div
                          className="inline-flex items-center gap-1 rounded-xl p-1"
                          style={{ backgroundColor: primaryColor + "15" }}
                        >
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1)}
                            className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center"
                            style={{ color: primaryColor }}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>
                            {inCart.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1)}
                            disabled={inCart.quantity >= product.availableQuantity}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-xs font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Aucun produit disponible pour le moment.</p>
          </div>
        )}
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.button
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-4 left-4 right-4 z-40 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white font-bold shadow-xl"
            style={{ backgroundColor: primaryColor }}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>{cartCount} article{cartCount > 1 ? "s" : ""}</span>
            <span className="ml-auto">{grandTotal.toLocaleString("fr-FR")} FCFA</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Cart sheet */}
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
              className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Mon panier</h3>
                <button
                  onClick={() => setCartOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                      {item.product.imageUrl && (
                        <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{item.product.salePrice.toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: primaryColor + "15" }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-md bg-white flex items-center justify-center" style={{ color: primaryColor }}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.availableQuantity} className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-400 hover:text-rose-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 p-4 space-y-3">
                {/* Delivery method */}
                <div className="flex gap-2">
                  {store?.allowPickup && (
                    <button
                      onClick={() => setDeliveryMethod("PICKUP")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        deliveryMethod === "PICKUP"
                          ? "text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={deliveryMethod === "PICKUP" ? { backgroundColor: primaryColor } : {}}
                    >
                      <Package className="w-4 h-4 inline mr-1" />
                      Retrait
                    </button>
                  )}
                  {store?.allowDelivery && (
                    <button
                      onClick={() => setDeliveryMethod("DELIVERY")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        deliveryMethod === "DELIVERY"
                          ? "text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={deliveryMethod === "DELIVERY" ? { backgroundColor: primaryColor } : {}}
                    >
                      <Truck className="w-4 h-4 inline mr-1" />
                      Livraison
                    </button>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {deliveryMethod === "DELIVERY" && `Livraison: ${deliveryFee.toLocaleString("fr-FR")} FCFA • `}
                    Total
                  </span>
                  <span className="text-lg font-bold" style={{ color: primaryColor }}>
                    {grandTotal.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>

                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Commander
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout dialog */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setCheckoutOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-slate-900">Finaliser la commande</h3>

              {/* Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Nom complet *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Téléphone (WhatsApp) *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="78 382 18 22"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
                  />
                </div>
                {deliveryMethod === "DELIVERY" && (
                  <div>
                    <label className="text-xs font-medium text-slate-500">Adresse de livraison *</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ex: 2m Sicap Foire, Dakar"
                      rows={2}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-500">Paiement</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setPaymentMethod("CASH_ON_DELIVERY")}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border ${
                        paymentMethod === "CASH_ON_DELIVERY"
                          ? "text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={paymentMethod === "CASH_ON_DELIVERY" ? { backgroundColor: primaryColor } : {}}
                    >
                      À la livraison
                    </button>
                    <button
                      onClick={() => setPaymentMethod("WAVE_OM_LINK")}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border ${
                        paymentMethod === "WAVE_OM_LINK"
                          ? "text-white border-transparent"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                      style={paymentMethod === "WAVE_OM_LINK" ? { backgroundColor: primaryColor } : {}}
                    >
                      Wave / OM
                    </button>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-sm text-slate-500">Total</span>
                <span className="text-lg font-bold" style={{ color: primaryColor }}>
                  {grandTotal.toLocaleString("fr-FR")} FCFA
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !customerName.trim() || !customerPhone.trim() || (deliveryMethod === "DELIVERY" && !deliveryAddress.trim())}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40"
                style={{ backgroundColor: primaryColor }}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoi...
                  </span>
                ) : (
                  "Confirmer la commande"
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
