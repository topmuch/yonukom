"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import {
  ShoppingBag, Plus, Minus, Trash2, X, CheckCircle2, Store,
  Phone, MapPin, Truck, Package, Loader2, ShoppingCart, Search,
  ChevronRight, ChevronLeft, Star, Shield, Clock,
  RefreshCw, Headphones, Facebook, Instagram, Mail, Heart,
} from "lucide-react";

// ============================================================
// Boutique en Ligne — Design inspiré Shofy Beauty
// URL: /b/[slug]
// ============================================================

interface StoreInfo {
  id: string; name: string; storeSlug: string; isStoreActive: boolean;
  storeLogoUrl: string | null; storeBannerUrl: string | null;
  storeSliderImages?: string[] | string | null;
  storePrimaryColor: string; allowPickup: boolean; allowDelivery: boolean;
  deliveryFee: number; ownerPhone: string | null;
}
interface StoreProduct {
  id: string; name: string; salePrice: number; quantity: number;
  reservedQuantity: number; availableQuantity: number; category: string | null;
  imageUrl: string | null; description: string | null;
}
interface CartItem { product: StoreProduct; quantity: number; }

// Hero slides data
const HERO_SLIDES = [
  { title: "Nouveautés", subtitle: "Découvrez nos produits du jour", cta: "Commander maintenant" },
  { title: "Livraison rapide", subtitle: "Partout à Dakar en moins d'1 heure", cta: "Voir les produits" },
  { title: "Paiement sécurisé", subtitle: "Wave, Orange Money ou à la livraison", cta: "Découvrir" },
];

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Hero slider
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderImages: string[] = useMemo(() => {
    if (store?.storeSliderImages) {
      if (Array.isArray(store.storeSliderImages)) return store.storeSliderImages as string[];
      try { return JSON.parse(store.storeSliderImages as string); } catch { return []; }
    }
    return [];
  }, [store]);

  // Slides = images si disponibles, sinon slides texte par défaut
  const totalSlides = sliderImages.length > 0 ? sliderImages.length : HERO_SLIDES.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ totalAmount: number; waMeUrl: string } | null>(null);

  // Form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "WAVE_OM_LINK">("CASH_ON_DELIVERY");

  const fetchStore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/store?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) { if (res.status === 404) throw new Error("Boutique introuvable"); throw new Error("Erreur"); }
      const data = await res.json();
      setStore(data.store); setProducts(data.products || []); setIsClosed(data.isClosed || false);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const deliveryFee = deliveryMethod === "DELIVERY" && store ? store.deliveryFee : 0;
  const grandTotal = cartTotal + deliveryFee;

  const addToCart = (product: StoreProduct) => {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.availableQuantity) return;
      setCart(cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else { setCart([...cart, { product, quantity: 1 }]); }
  };
  const removeFromCart = (id: string) => setCart(cart.filter((i) => i.product.id !== id));
  const updateQuantity = (id: string, d: number) => {
    setCart(cart.map((i) => { if (i.product.id !== id) return i; const n = i.quantity + d; if (n <= 0 || n > i.product.availableQuantity) return i; return { ...i, quantity: n }; }));
  };

  const handleSubmitOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim()) return;
    if (deliveryMethod === "DELIVERY" && !deliveryAddress.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/public/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: store?.id, customerName: customerName.trim(), customerPhone: customerPhone.trim(),
          deliveryAddress: deliveryMethod === "DELIVERY" ? deliveryAddress.trim() : null, deliveryMethod, paymentMethod,
          items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Erreur"); }
      const data = await res.json();
      setOrderSuccess({ totalAmount: data.totalAmount, waMeUrl: data.waMeUrl });
      setCart([]); setCheckoutOpen(false); setCartOpen(false);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(null), 5000); }
    finally { setSubmitting(false); }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => cats.add(p.category || "Autres"));
    return Array.from(cats).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (activeCategory !== "all") result = result.filter((p) => (p.category || "Autres") === activeCategory);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase().trim(); result = result.filter((p) => p.name.toLowerCase().includes(q)); }
    return result;
  }, [products, activeCategory, searchQuery]);

  const primaryColor = store?.storePrimaryColor || "#1E40AF";
  const pLight = primaryColor + "15";

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }
  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto"><Store className="w-8 h-8 text-slate-400" /></div>
          <p className="text-lg font-bold text-slate-900">{error}</p>
          <p className="text-sm text-slate-500">Vérifiez le lien.</p>
        </div>
      </div>
    );
  }
  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto"><Store className="w-8 h-8 text-slate-400" /></div>
          <p className="text-lg font-bold text-slate-900">{store?.name}</p>
          <p className="text-sm text-slate-500">Boutique temporairement fermée.</p>
        </div>
      </div>
    );
  }
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 max-w-sm bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: primaryColor + "20" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
          <h1 className="text-xl font-bold text-slate-900">Commande envoyée !</h1>
          <p className="text-2xl font-bold" style={{ color: primaryColor }}>{orderSuccess.totalAmount.toLocaleString("fr-FR")} FCFA</p>
          <p className="text-sm text-slate-500">Le vendeur va vous contacter.</p>
          <a href={orderSuccess.waMeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg" style={{ backgroundColor: "#25D366" }}>
            <Phone className="w-4 h-4" /> Contacter le vendeur
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* ===== TOP BAR ===== */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-slate-300">📞 Commandez en ligne — Livraison & Retrait</span>
          <div className="flex items-center gap-3 text-slate-300">
            {store?.allowDelivery && <span>🚚 Livraison</span>}
            {store?.allowPickup && <span>📦 Retrait</span>}
          </div>
        </div>
      </div>

      {/* ===== HEADER (logo seul, pas de nom) ===== */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo uniquement */}
          <div className="shrink-0">
            {store?.storeLogoUrl ? (
              <img src={store.storeLogoUrl} alt={store.name} className="h-10 w-auto max-w-[120px] object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                <Store className="w-5 h-5" />
              </div>
            )}
          </div>

          {/* Search */}
          <div className="hidden sm:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-slate-300 focus:bg-white transition-colors" />
          </div>

          {/* Cart */}
          <button onClick={() => setCartOpen(true)} className="relative ml-auto shrink-0">
            <div className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search mobile */}
        <div className="sm:hidden px-4 pb-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm focus:outline-none focus:border-slate-300 focus:bg-white transition-colors" />
          </div>
        </div>
      </header>

      {/* ===== BANNIÈRE (si présente) ===== */}
      {store?.storeBannerUrl && sliderImages.length === 0 && (
        <div className="w-full max-h-48 sm:max-h-64 overflow-hidden">
          <img src={store.storeBannerUrl} alt={store.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* ===== HERO SLIDER ===== */}
      <section className="relative overflow-hidden h-56 sm:h-72 lg:h-80">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {sliderImages.length > 0 ? (
              // Mode image: afficher l'image en plein écran
              <img
                src={sliderImages[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              // Mode texte: gradient couleur + texte
              <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 50%, ${primaryColor}99 100%)` }}>
                <div className="h-full flex items-center px-6 sm:px-12">
                  <div className="text-white max-w-lg">
                    <p className="text-xs sm:text-sm font-medium text-white/70 mb-1">{store?.name}</p>
                    <h2 className="text-xl sm:text-3xl font-extrabold mb-2">{HERO_SLIDES[currentSlide].title}</h2>
                    <p className="text-sm text-white/80 mb-4">{HERO_SLIDES[currentSlide].subtitle}</p>
                    <button
                      onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-sm font-bold shadow-lg transition-transform hover:scale-105"
                      style={{ color: primaryColor }}
                    >
                      {HERO_SLIDES[currentSlide].cta}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlay texte si image présente */}
        {sliderImages.length > 0 && (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
            <div className="p-6 sm:p-12">
              <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">{store?.name}</p>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-1">{HERO_SLIDES[currentSlide % HERO_SLIDES.length]?.title || "Bienvenue"}</h2>
              <p className="text-sm text-white/80">{HERO_SLIDES[currentSlide % HERO_SLIDES.length]?.subtitle || ""}</p>
            </div>
          </div>
        )}

        {/* Slider dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}

        {/* Slide arrows */}
        {totalSlides > 1 && (
          <>
            <button onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center text-white transition-colors z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center text-white transition-colors z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </section>

      {/* ===== CATEGORY FILTERS ===== */}
      <div className="sticky top-[57px] sm:top-[61px] z-20 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
          <button onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === "all" ? "text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
            style={activeCategory === "all" ? { backgroundColor: primaryColor } : {}}>
            Tous ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => (p.category || "Autres") === cat).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "text-white shadow-sm" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                style={activeCategory === cat ? { backgroundColor: primaryColor } : {}}>
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== PRODUCTS ===== */}
      <main id="products" className="max-w-7xl mx-auto px-4 py-5">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{searchQuery ? "Aucun produit trouvé." : "Aucun produit."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const isAvailable = product.availableQuantity > 0;
              const isLowStock = isAvailable && product.availableQuantity <= 5;
              return (
                <div key={product.id} className={`group bg-white rounded-2xl overflow-hidden border border-slate-100 transition-all ${isAvailable ? "hover:shadow-lg hover:border-slate-200" : "opacity-60"}`}>
                  <div className="relative bg-slate-50 overflow-hidden" style={{ aspectRatio: "314 / 306" }}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-200" /></div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-lg bg-white text-xs font-bold text-slate-700">Rupture</span>
                      </div>
                    )}
                    {isLowStock && (
                      <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">Plus que {product.availableQuantity}</span></div>
                    )}
                    {/* Add button — always visible */}
                    {isAvailable && !inCart && (
                      <button onClick={() => addToCart(product)}
                        className="absolute bottom-2 right-2 w-9 h-9 rounded-xl text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    )}
                    {isAvailable && inCart && (
                      <div className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-xl p-1 shadow-lg" style={{ backgroundColor: pLight }}>
                        <button onClick={() => updateQuantity(product.id, -1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center" style={{ color: primaryColor }}><Minus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                        <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{inCart.quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} disabled={inCart.quantity >= product.availableQuantity} className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    {product.category && <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{product.category}</p>}
                    <p className="font-medium text-xs text-slate-900 line-clamp-2 min-h-[2rem]">{product.name}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm" style={{ color: primaryColor }}>{product.salePrice.toLocaleString("fr-FR")}<span className="text-[10px] font-normal text-slate-400 ml-0.5"> FCFA</span></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== SERVICE FEATURES ===== */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { Icon: Truck, title: "Livraison rapide", desc: "Partout à Dakar" },
            { Icon: Shield, title: "Paiement sécurisé", desc: "Vos données protégées" },
            { Icon: RefreshCw, title: "Retour facile", desc: "Satisfait ou remboursé" },
            { Icon: Headphones, title: "Support 24/7", desc: "WhatsApp disponible" },
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-100">
              <feat.Icon className="w-6 h-6 mb-1.5" style={{ color: primaryColor }} />
              <p className="text-xs font-bold text-slate-800">{feat.title}</p>
              <p className="text-[10px] text-slate-400">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-slate-900 text-slate-300 mt-6">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div>
              {store?.storeLogoUrl ? (
                <img src={store.storeLogoUrl} alt={store.name} className="h-10 w-auto max-w-[120px] object-contain mb-3" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white mb-3" style={{ backgroundColor: primaryColor }}><Store className="w-5 h-5" /></div>
              )}
              <p className="text-xs text-slate-400 mb-3">Votre boutique en ligne. Commandez en quelques clics.</p>
              <div className="flex items-center gap-2">
                {[Facebook, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"><Icon className="w-4 h-4" /></a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Informations</h4>
              <ul className="space-y-1.5 text-xs text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contact</h4>
              <div className="space-y-2 text-xs text-slate-400">
                {store?.ownerPhone && (
                  <a href={`https://wa.me/${store.ownerPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5" /> {store.ownerPhone}</a>
                )}
                <a href="mailto:contact@yonukom.sn" className="flex items-center gap-2 hover:text-white transition-colors"><Mail className="w-3.5 h-3.5" /> contact@yonukom.sn</a>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Dakar, Sénégal</p>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-500">© 2026 {store?.name}. Propulsé par <a href="https://yonukom.qrtags.pro" className="hover:text-white transition-colors font-medium">YonuKom</a></p>
          </div>
        </div>
      </footer>

      {/* ===== FLOATING CART BAR ===== */}
      <AnimatePresence>
        {cartCount > 0 && !cartOpen && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3">
            <button onClick={() => setCartOpen(true)} className="w-full max-w-7xl mx-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white font-bold shadow-2xl transition-transform active:scale-98" style={{ backgroundColor: primaryColor }}>
              <div className="relative"><ShoppingCart className="w-5 h-5" /><span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-[10px] font-bold flex items-center justify-center" style={{ color: primaryColor }}>{cartCount}</span></div>
              <span className="text-sm">Voir le panier</span>
              <span className="ml-auto text-base">{grandTotal.toLocaleString("fr-FR")} FCFA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CART SHEET ===== */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setCartOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white w-full max-w-7xl mx-auto rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="pt-3 flex justify-center"><div className="w-10 h-1 rounded-full bg-slate-300" /></div>
              <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} /><h3 className="font-bold text-slate-900">Mon panier ({cartCount})</h3></div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 shrink-0">{item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">{item.product.salePrice.toLocaleString("fr-FR")} FCFA × {item.quantity}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: primaryColor }}>{(item.product.salePrice * item.quantity).toLocaleString("fr-FR")} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pLight }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-md bg-white shadow-sm flex items-center justify-center" style={{ color: primaryColor }}><Minus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                      <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.availableQuantity} className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {cart.length === 0 && <div className="text-center py-8"><ShoppingCart className="w-10 h-10 text-slate-200 mx-auto mb-2" /><p className="text-sm text-slate-500">Panier vide</p></div>}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="flex gap-2">
                    {store?.allowPickup && <button onClick={() => setDeliveryMethod("PICKUP")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === "PICKUP" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"}`} style={deliveryMethod === "PICKUP" ? { backgroundColor: primaryColor } : {}}><Package className="w-4 h-4" /> Retrait</button>}
                    {store?.allowDelivery && <button onClick={() => setDeliveryMethod("DELIVERY")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === "DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"}`} style={deliveryMethod === "DELIVERY" ? { backgroundColor: primaryColor } : {}}><Truck className="w-4 h-4" /> Livraison</button>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500"><span>Sous-total</span><span>{cartTotal.toLocaleString("fr-FR")} FCFA</span></div>
                    {deliveryMethod === "DELIVERY" && <div className="flex items-center justify-between text-xs text-slate-500"><span>Livraison</span><span>{deliveryFee > 0 ? `${deliveryFee.toLocaleString("fr-FR")} FCFA` : "Gratuite"}</span></div>}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100"><span className="text-sm font-semibold text-slate-700">Total</span><span className="text-xl font-bold" style={{ color: primaryColor }}>{grandTotal.toLocaleString("fr-FR")} FCFA</span></div>
                  </div>
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-98" style={{ backgroundColor: primaryColor }}>Commander</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CHECKOUT ===== */}
      <AnimatePresence>
        {checkoutOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setCheckoutOpen(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h3 className="font-bold text-lg text-slate-900">Finaliser ma commande</h3><button onClick={() => setCheckoutOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button></div>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Nom complet *</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: Awa Diallo" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone (WhatsApp) *</label><input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="78 382 18 22" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" /></div>
                {deliveryMethod === "DELIVERY" && <div><label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse de livraison *</label><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ex: 2m Sicap Foire, Dakar" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none" /></div>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1 block">Mode de paiement</label><div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaymentMethod("CASH_ON_DELIVERY")} className={`py-3 rounded-xl text-xs font-medium border transition-all ${paymentMethod === "CASH_ON_DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"}`} style={paymentMethod === "CASH_ON_DELIVERY" ? { backgroundColor: primaryColor } : {}}>💵 À la livraison</button>
                  <button onClick={() => setPaymentMethod("WAVE_OM_LINK")} className={`py-3 rounded-xl text-xs font-medium border transition-all ${paymentMethod === "WAVE_OM_LINK" ? "text-white border-transparent shadow-sm" : "bg-white text-slate-600 border-slate-200"}`} style={paymentMethod === "WAVE_OM_LINK" ? { backgroundColor: primaryColor } : {}}>📱 Wave / OM</button>
                </div></div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between"><span className="text-sm text-slate-500">{cartCount} article{cartCount > 1 ? "s" : ""}</span><span className="text-2xl font-bold" style={{ color: primaryColor }}>{grandTotal.toLocaleString("fr-FR")} FCFA</span></div>
              <button onClick={handleSubmitOrder} disabled={submitting || !customerName.trim() || !customerPhone.trim() || (deliveryMethod === "DELIVERY" && !deliveryAddress.trim())} className="w-full py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 shadow-lg transition-transform active:scale-98" style={{ backgroundColor: primaryColor }}>{submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</span> : `Confirmer — ${grandTotal.toLocaleString("fr-FR")} FCFA`}</button>
              <p className="text-[10px] text-center text-slate-400">En confirmant, vous acceptez d'être contacté par le vendeur.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
