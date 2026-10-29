"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import {
  ShoppingBag, Plus, Minus, Trash2, X, CheckCircle2, Store,
  Phone, MapPin, Truck, Package, Loader2, ShoppingCart, Search,
  ChevronRight, ChevronLeft, Star, Shield, Clock,
  RefreshCw, Headphones, Facebook, Instagram, Mail, Heart,
  Sun, Moon, MessageCircle, Copy, Share2, Send, Sparkles, Tag,
  ClipboardCheck, Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

// ============================================================
// Boutique en Ligne — V2 (vedettes, promos, avis, partage, WA, dark mode)
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
  id: string; name: string; salePrice: number;
  compareAtPrice: number | null; isFeatured: boolean;
  quantity: number; reservedQuantity: number; availableQuantity: number;
  category: string | null; imageUrl: string | null; description: string | null;
  hasPromo: boolean; discountPercent: number;
}
interface CartItem { product: StoreProduct; quantity: number; }
interface Review {
  id: string; customerName: string; rating: number;
  comment: string | null; productId: string | null; createdAt: string;
}
interface Promo {
  id: string; name: string; type: string; percentage: number;
  ticketMessage: string | null; minAmount: number | null;
}

const HERO_SLIDES = [
  { title: "Nouveautés", subtitle: "Découvrez nos produits du jour", cta: "Commander maintenant" },
  { title: "Livraison rapide", subtitle: "Partout à Dakar en moins d'1 heure", cta: "Voir les produits" },
  { title: "Paiement sécurisé", subtitle: "Wave, Orange Money ou à la livraison", cta: "Découvrir" },
];

// --- Helpers ---
function formatPrice(n: number) { return n.toLocaleString("fr-FR"); }
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let sid = localStorage.getItem("yonukom_session");
    if (!sid) {
      sid = "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("yonukom_session", sid);
    }
    return sid;
  } catch { return "anon"; }
}

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<StoreProduct[]>([]);
  const [activePromos, setActivePromos] = useState<Promo[]>([]);
  const [reviewsSummary, setReviewsSummary] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
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
  const totalSlides = sliderImages.length > 0 ? sliderImages.length : HERO_SLIDES.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % totalSlides), 4000);
    return () => clearInterval(timer);
  }, [totalSlides]);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [productReviews, setProductReviews] = useState<Review[]>([]);
  const [productReviewsLoading, setProductReviewsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderId: string; totalAmount: number; waMeUrl: string } | null>(null);

  // Review form
  const [reviewForm, setReviewForm] = useState({ customerName: "", rating: 5, comment: "" });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Newsletter
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_DELIVERY" | "WAVE_OM_LINK">("CASH_ON_DELIVERY");

  // Toast simple
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStore = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/public/store?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) { if (res.status === 404) throw new Error("Boutique introuvable"); throw new Error("Erreur"); }
      const data = await res.json();
      setStore(data.store); setProducts(data.products || []);
      setFeaturedProducts(data.featuredProducts || []);
      setActivePromos(data.activePromos || []);
      setReviewsSummary(data.reviewsSummary || { average: 0, count: 0 });
      setIsClosed(data.isClosed || false);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchStore(); }, [fetchStore]);

  // Analytics : page_view au chargement
  useEffect(() => {
    if (!store) return;
    const sid = getOrCreateSessionId();
    fetch("/api/public/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type: "page_view", path: `/b/${slug}`, sessionId: sid }),
    }).catch(() => {});
  }, [store, slug]);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.product.salePrice * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const deliveryFee = deliveryMethod === "DELIVERY" && store ? store.deliveryFee : 0;
  const grandTotal = cartTotal + deliveryFee;

  const trackEvent = useCallback((type: string, productId?: string) => {
    const sid = getOrCreateSessionId();
    fetch("/api/public/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, type, path: `/b/${slug}`, productId, sessionId: sid }),
    }).catch(() => {});
  }, [slug]);

  const addToCart = (product: StoreProduct) => {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.availableQuantity) return;
      setCart(cart.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else { setCart([...cart, { product, quantity: 1 }]); }
    trackEvent("add_to_cart", product.id);
  };
  const removeFromCart = (id: string) => setCart(cart.filter((i) => i.product.id !== id));
  const updateQuantity = (id: string, d: number) => {
    setCart(cart.map((i) => { if (i.product.id !== id) return i; const n = i.quantity + d; if (n <= 0 || n > i.product.availableQuantity) return i; return { ...i, quantity: n }; }));
  };

  const openProduct = useCallback(async (product: StoreProduct) => {
    setSelectedProduct(product);
    setReviewSubmitted(false);
    setReviewForm({ customerName: "", rating: 5, comment: "" });
    trackEvent("product_view", product.id);
    // Fetch les avis approuvés pour ce produit
    setProductReviewsLoading(true);
    try {
      const res = await fetch(`/api/public/reviews?slug=${encodeURIComponent(slug)}&productId=${product.id}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setProductReviews(data.reviews || []);
      } else { setProductReviews([]); }
    } catch { setProductReviews([]); }
    finally { setProductReviewsLoading(false); }
  }, [slug, trackEvent]);

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
      setOrderSuccess({ orderId: data.orderId, totalAmount: data.totalAmount, waMeUrl: data.waMeUrl });
      trackEvent("purchase");
      setCart([]); setCheckoutOpen(false); setCartOpen(false);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(null), 5000); }
    finally { setSubmitting(false); }
  };

  const handleSubmitReview = async () => {
    if (!selectedProduct || !reviewForm.customerName.trim()) {
      showToast("Veuillez renseigner votre nom", "err"); return;
    }
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/public/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug, productId: selectedProduct.id,
          customerName: reviewForm.customerName.trim(),
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim() || undefined,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Erreur"); }
      setReviewSubmitted(true);
      trackEvent("review_submit", selectedProduct.id);
      showToast("Merci ! Votre avis sera visible après modération.", "ok");
    } catch (err: any) { showToast(err.message || "Erreur", "err"); }
    finally { setReviewSubmitting(false); }
  };

  const handleSubscribeNewsletter = async () => {
    if (!newsletterEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setNewsletterStatus({ ok: false, msg: "Email invalide" }); return;
    }
    try {
      const res = await fetch("/api/public/newsletter", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email: newsletterEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus({ ok: true, msg: data.message || "Abonné !" });
        setNewsletterEmail("");
        trackEvent("newsletter_subscribe");
      } else { setNewsletterStatus({ ok: false, msg: data.error || "Erreur" }); }
    } catch { setNewsletterStatus({ ok: false, msg: "Erreur réseau" }); }
  };

  // --- Partage social ---
  const storeUrl = typeof window !== "undefined" ? window.location.href : `https://yonukom.qrtags.pro/b/${slug}`;
  const shareWhatsApp = (product?: StoreProduct) => {
    const text = product
      ? `Regardez "${product.name}" sur ${store?.name || "la boutique"} — ${formatPrice(product.salePrice)} FCFA${product.hasPromo ? ` (promo -${product.discountPercent}%)` : ""}\n${storeUrl}`
      : `Découvrez ${store?.name || "notre boutique"} en ligne !\n${storeUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    trackEvent("whatsapp_click");
  };
  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`, "_blank", "noopener,noreferrer");
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(storeUrl); showToast("Lien copié dans le presse-papier !", "ok"); }
    catch { showToast("Impossible de copier le lien", "err"); }
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

  const primaryColor = store?.storePrimaryColor || "#059669";
  const pLight = primaryColor + "15";

  // Lien WhatsApp flottant (boutique)
  const waFloatingUrl = useMemo(() => {
    if (!store?.ownerPhone) return null;
    const digits = store.ownerPhone.replace(/\D/g, "");
    const normalized = digits.startsWith("221") ? digits : (digits.length === 9 && /^[789]/.test(digits) ? "221" + digits : digits);
    const msg = `Bonjour, j'ai une question sur ${store.name}`;
    return `https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`;
  }, [store]);

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-slate-800 dark:border-t-slate-200 animate-spin mx-auto" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }
  if (error && !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto"><Store className="w-8 h-8 text-slate-400" /></div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{error}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Vérifiez le lien.</p>
        </div>
      </div>
    );
  }
  if (isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto"><Store className="w-8 h-8 text-slate-400" /></div>
          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{store?.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Boutique temporairement fermée.</p>
        </div>
      </div>
    );
  }
  if (orderSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-100 dark:border-slate-800">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: primaryColor + "20" }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: primaryColor }} />
          </motion.div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Commande envoyée !</h1>
          <p className="text-2xl font-bold" style={{ color: primaryColor }}>{formatPrice(orderSuccess.totalAmount)} FCFA</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Numéro de commande</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-wide">CMD-{orderSuccess.orderId.slice(-6).toUpperCase()}</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Le vendeur va vous contacter pour confirmer.</p>
          <div className="flex flex-col gap-2">
            <a href={orderSuccess.waMeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-colors" style={{ backgroundColor: "#25D366" }}>
              <Phone className="w-4 h-4" /> Contacter le vendeur sur WhatsApp
            </a>
            <a href={`/b/${slug}/commande/${orderSuccess.orderId}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-colors text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Package className="w-4 h-4" /> Suivre ma commande
            </a>
            <button onClick={() => { setOrderSuccess(null); }} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-1">
              Continuer mes achats
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-28 transition-colors">
      {/* ===== TOP BAR ===== */}
      <div className="bg-slate-900 text-white text-xs px-4 py-1.5 hidden sm:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-slate-300">Commandez en ligne — Livraison & Retrait</span>
          <div className="flex items-center gap-3 text-slate-300">
            {store?.allowDelivery && <span>Livraison</span>}
            {store?.allowPickup && <span>Retrait</span>}
            {reviewsSummary.count > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {reviewsSummary.average} ({reviewsSummary.count})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="shrink-0">
            {store?.storeLogoUrl ? (
              <img src={store.storeLogoUrl} alt={store.name} className="h-14 sm:h-16 w-auto max-w-[180px] object-contain" />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: primaryColor }}>
                <Store className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="hidden sm:flex flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-slate-300 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-700 transition-colors" />
          </div>

          <div className="ml-auto flex items-center gap-1 shrink-0">
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Cart */}
            <button onClick={() => setCartOpen(true)} className="relative">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                <ShoppingCart className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-md" style={{ backgroundColor: primaryColor }}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Recherche masquée sur mobile (visibile uniquement sm+ via le bloc ci-dessus) */}
      </header>

      {/* ===== BANNIÈRE ===== */}
      {store?.storeBannerUrl && (
        <div className="w-full overflow-hidden bg-white dark:bg-slate-900">
          <img src={store.storeBannerUrl} alt={store.name} className="w-full h-auto object-contain" />
        </div>
      )}

      {/* ===== HERO SLIDER ===== */}
      {/* Ratio de référence 1983×793 pour tous les slides.
          Mobile : hauteur fixe h-56 (rognage centré, comme actuellement —
          l'utilisateur confirme que le mobile s'affiche bien).
          Desktop (sm+) : aspect-[1983/793] → l'image s'affiche ENTIÈRE
          sans rognage (corrige le problème d'affichage web où h-80 fixe
          rognait trop l'image horizontalement). */}
      {sliderImages.length > 0 && (
      <section className="relative overflow-hidden h-56 sm:h-auto sm:aspect-[1983/793] bg-slate-100 dark:bg-slate-800">
        <AnimatePresence mode="wait">
          <motion.div key={currentSlide} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
            <img src={sliderImages[currentSlide]} alt={`Slide ${currentSlide + 1}`} className="w-full h-full object-cover" />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none">
          <div className="p-6 sm:p-12">
            <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">{store?.name}</p>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white mb-1">Bienvenue</h2>
          </div>
        </div>
        {totalSlides > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all ${i === currentSlide ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
            ))}
          </div>
        )}
        {totalSlides > 1 && (
          <>
            <button onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center text-white transition-colors z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur hover:bg-black/50 flex items-center justify-center text-white transition-colors z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </section>
      )}

      {/* ===== PROMOS BANNER ===== */}
      {activePromos.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-5">
          <div className="rounded-2xl p-4 flex items-center gap-3 shadow-sm" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}>
            <Tag className="w-6 h-6 text-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">{activePromos[0].name}</p>
              {activePromos[0].ticketMessage && (
                <p className="text-white/90 text-xs truncate">{activePromos[0].ticketMessage}</p>
              )}
            </div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold shrink-0">-{activePromos[0].percentage}%</span>
          </div>
        </section>
      )}

      {/* ===== PRODUITS VEDETTES ===== */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Produits vedettes</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">({featuredProducts.length})</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: "thin" }}>
            {featuredProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const isAvailable = product.availableQuantity > 0;
              return (
                <div key={product.id} className="shrink-0 w-44 sm:w-52 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="relative bg-slate-50 dark:bg-slate-800 overflow-hidden cursor-pointer" style={{ aspectRatio: "1" }} onClick={() => isAvailable && openProduct(product)}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-200 dark:text-slate-700" /></div>
                    )}
                    {product.hasPromo && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-white text-[10px] font-bold" style={{ backgroundColor: "#ef4444" }}>-{product.discountPercent}%</span>
                    )}
                    {isAvailable && !inCart && (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-2 right-2 w-9 h-9 rounded-xl text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95" style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[2rem]">{product.name}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                      <span className="font-bold text-sm" style={{ color: primaryColor }}>{formatPrice(product.salePrice)}</span>
                      <span className="text-[10px] font-normal text-slate-400">FCFA</span>
                      {product.hasPromo && product.compareAtPrice && (
                        <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.compareAtPrice)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===== CATÉGORIES ===== */}
      <section className="max-w-7xl mx-auto px-4 py-5">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">Nos catégories</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => (p.category || "Autres") === cat).length;
            const catImage = cat.toLowerCase().includes("plat") ? "/demo-store/cat-plats.jpg"
              : cat.toLowerCase().includes("yassa") ? "/demo-store/cat-yassa.jpg"
              : cat.toLowerCase().includes("boisson") ? "/demo-store/cat-boissons.jpg"
              : cat.toLowerCase().includes("entrée") || cat.toLowerCase().includes("entree") ? "/demo-store/cat-entrees.jpg"
              : "/demo-store/cat-plats.jpg";
            return (
              <button key={cat} onClick={() => { setActiveCategory(cat); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }} className="group relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all" style={{ aspectRatio: "313 / 523" }}>
                <img src={catImage} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                  <p className="text-white font-bold text-sm sm:text-base">{cat}</p>
                  <p className="text-white/70 text-xs">{count} produit{count > 1 ? "s" : ""}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ===== CATEGORY FILTERS ===== */}
      <div className="sticky top-[57px] sm:top-[61px] z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex gap-2 overflow-x-auto scrollbar-none">
          <button onClick={() => setActiveCategory("all")} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === "all" ? "text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`} style={activeCategory === "all" ? { backgroundColor: primaryColor } : {}}>
            Tous ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => (p.category || "Autres") === cat).length;
            return (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "text-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100"}`} style={activeCategory === cat ? { backgroundColor: primaryColor } : {}}>
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
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">{searchQuery ? "Aucun produit trouvé." : "Aucun produit."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((i) => i.product.id === product.id);
              const isAvailable = product.availableQuantity > 0;
              const isLowStock = isAvailable && product.availableQuantity <= 5;
              return (
                <div key={product.id} className={`group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-all ${isAvailable ? "hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700" : "opacity-60"}`}>
                  <div className="relative bg-slate-50 dark:bg-slate-800 overflow-hidden cursor-pointer" style={{ aspectRatio: "314 / 306" }} onClick={() => isAvailable && openProduct(product)}>
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-200 dark:text-slate-700" /></div>
                    )}
                    {/* Badges */}
                    {product.hasPromo && (
                      <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold">-{product.discountPercent}%</span></div>
                    )}
                    {product.isFeatured && !product.hasPromo && (
                      <div className="absolute top-2 left-2"><span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1"><Sparkles className="w-2.5 h-2.5" /> Vedette</span></div>
                    )}
                    {!isAvailable && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="px-3 py-1 rounded-lg bg-white text-xs font-bold text-slate-700">Rupture</span>
                      </div>
                    )}
                    {isLowStock && (
                      <div className="absolute top-2 right-2"><span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold">Plus que {product.availableQuantity}</span></div>
                    )}
                    {isAvailable && !inCart && (
                      <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} className="absolute bottom-2 right-2 w-9 h-9 rounded-xl text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95" style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-5 h-5" strokeWidth={2.5} />
                      </button>
                    )}
                    {isAvailable && inCart && (
                      <div className="absolute bottom-2 right-2 inline-flex items-center gap-0.5 rounded-xl p-1 shadow-lg" style={{ backgroundColor: pLight }}>
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, -1); }} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center" style={{ color: primaryColor }}><Minus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                        <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{inCart.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); updateQuantity(product.id, 1); }} disabled={inCart.quantity >= product.availableQuantity} className="w-7 h-7 rounded-lg flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    {product.category && <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{product.category}</p>}
                    <p className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-2 min-h-[2rem]">{product.name}</p>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className="font-bold text-sm" style={{ color: primaryColor }}>{formatPrice(product.salePrice)}</span>
                      <span className="text-[10px] font-normal text-slate-400">FCFA</span>
                      {product.hasPromo && product.compareAtPrice && (
                        <span className="text-[10px] text-slate-400 line-through ml-auto">{formatPrice(product.compareAtPrice)}</span>
                      )}
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
            <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <feat.Icon className="w-6 h-6 mb-1.5" style={{ color: primaryColor }} />
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{feat.title}</p>
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
                <img src={store.storeLogoUrl} alt={store.name} className="h-14 w-auto max-w-[180px] object-contain mb-3" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white mb-3" style={{ backgroundColor: primaryColor }}><Store className="w-7 h-7" /></div>
              )}
              <p className="text-xs text-slate-400 mb-3">Votre boutique en ligne. Commandez en quelques clics.</p>
              <div className="flex items-center gap-2">
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"><Facebook className="w-4 h-4" /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"><Instagram className="w-4 h-4" /></a>
                {store?.ownerPhone && (
                  <a href={waFloatingUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE58] flex items-center justify-center transition-colors text-white"><MessageCircle className="w-4 h-4" /></a>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Newsletter</h4>
              <p className="text-xs text-slate-400 mb-2">Recevez nos nouveautés et promos par email.</p>
              <div className="flex gap-2">
                <input type="email" value={newsletterEmail} onChange={(e) => { setNewsletterEmail(e.target.value); setNewsletterStatus(null); }} placeholder="votre@email.com"
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-500" />
                <button onClick={handleSubscribeNewsletter} className="px-3 py-2 rounded-lg text-white text-xs font-semibold shrink-0" style={{ backgroundColor: primaryColor }}>
                  <Mail className="w-4 h-4" />
                </button>
              </div>
              {newsletterStatus && (
                <p className={`text-[11px] mt-2 ${newsletterStatus.ok ? "text-emerald-400" : "text-rose-400"}`}>{newsletterStatus.msg}</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-3">Contact</h4>
              <div className="space-y-2 text-xs text-slate-400">
                {store?.ownerPhone && (
                  <a href={waFloatingUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><Phone className="w-3.5 h-3.5" /> {store.ownerPhone}</a>
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
              <span className="ml-auto text-base">{formatPrice(grandTotal)} FCFA</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CART SHEET ===== */}
      <AnimatePresence>
        {cartOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setCartOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white dark:bg-slate-900 w-full max-w-7xl mx-auto rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="pt-3 flex justify-center"><div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" /></div>
              <div className="flex items-center justify-between p-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} /><h3 className="font-bold text-slate-900 dark:text-slate-100">Mon panier ({cartCount})</h3></div>
                <button onClick={() => setCartOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">{item.product.imageUrl && <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{item.product.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatPrice(item.product.salePrice)} FCFA × {item.quantity}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: primaryColor }}>{formatPrice(item.product.salePrice * item.quantity)} FCFA</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ backgroundColor: pLight }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-7 h-7 rounded-md bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center" style={{ color: primaryColor }}><Minus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                      <span className="min-w-[1.5rem] text-center font-bold text-sm" style={{ color: primaryColor }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} disabled={item.quantity >= item.product.availableQuantity} className="w-7 h-7 rounded-md flex items-center justify-center text-white disabled:opacity-40" style={{ backgroundColor: primaryColor }}><Plus className="w-3.5 h-3.5" strokeWidth={2.5} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {cart.length === 0 && <div className="text-center py-8"><ShoppingCart className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" /><p className="text-sm text-slate-500 dark:text-slate-400">Panier vide</p></div>}
              </div>
              {cart.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex gap-2">
                    {store?.allowPickup && <button onClick={() => setDeliveryMethod("PICKUP")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === "PICKUP" ? "text-white border-transparent shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`} style={deliveryMethod === "PICKUP" ? { backgroundColor: primaryColor } : {}}><Package className="w-4 h-4" /> Retrait</button>}
                    {store?.allowDelivery && <button onClick={() => setDeliveryMethod("DELIVERY")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all flex items-center justify-center gap-1.5 ${deliveryMethod === "DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`} style={deliveryMethod === "DELIVERY" ? { backgroundColor: primaryColor } : {}}><Truck className="w-4 h-4" /> Livraison</button>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>Sous-total</span><span>{formatPrice(cartTotal)} FCFA</span></div>
                    {deliveryMethod === "DELIVERY" && <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400"><span>Livraison</span><span>{deliveryFee > 0 ? `${formatPrice(deliveryFee)} FCFA` : "Gratuite"}</span></div>}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total</span><span className="text-xl font-bold" style={{ color: primaryColor }}>{formatPrice(grandTotal)} FCFA</span></div>
                  </div>
                  <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); trackEvent("checkout"); }} className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-98" style={{ backgroundColor: primaryColor }}>Commander</button>
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
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between"><h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">Finaliser ma commande</h3><button onClick={() => setCheckoutOpen(false)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><X className="w-4 h-4 text-slate-500" /></button></div>
              <div className="space-y-3">
                <div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Nom complet *</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: Awa Diallo" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all" /></div>
                <div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone (WhatsApp) *</label><input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="78 382 18 22" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all" /></div>
                {deliveryMethod === "DELIVERY" && <div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse de livraison *</label><textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Ex: 2m Sicap Foire, Dakar" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all resize-none" /></div>}
                <div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">Mode de paiement</label><div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setPaymentMethod("CASH_ON_DELIVERY")} className={`py-3 rounded-xl text-xs font-medium border transition-all ${paymentMethod === "CASH_ON_DELIVERY" ? "text-white border-transparent shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`} style={paymentMethod === "CASH_ON_DELIVERY" ? { backgroundColor: primaryColor } : {}}>À la livraison</button>
                  <button onClick={() => setPaymentMethod("WAVE_OM_LINK")} className={`py-3 rounded-xl text-xs font-medium border transition-all ${paymentMethod === "WAVE_OM_LINK" ? "text-white border-transparent shadow-sm" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`} style={paymentMethod === "WAVE_OM_LINK" ? { backgroundColor: primaryColor } : {}}>Wave / OM</button>
                </div></div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 flex items-center justify-between"><span className="text-sm text-slate-500 dark:text-slate-400">{cartCount} article{cartCount > 1 ? "s" : ""}</span><span className="text-2xl font-bold" style={{ color: primaryColor }}>{formatPrice(grandTotal)} FCFA</span></div>
              <button onClick={handleSubmitOrder} disabled={submitting || !customerName.trim() || !customerPhone.trim() || (deliveryMethod === "DELIVERY" && !deliveryAddress.trim())} className="w-full py-4 rounded-xl text-white font-bold text-sm disabled:opacity-40 shadow-lg transition-transform active:scale-98" style={{ backgroundColor: primaryColor }}>{submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</span> : `Confirmer — ${formatPrice(grandTotal)} FCFA`}</button>
              <p className="text-[10px] text-center text-slate-400">En confirmant, vous acceptez d'être contacté par le vendeur.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== PRODUCT DETAIL MODAL ===== */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedProduct(null)} className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5 text-slate-700 dark:text-slate-200" />
              </button>

              {/* Image */}
              <div className="relative w-full aspect-square sm:aspect-[16/10] bg-slate-50 dark:bg-slate-800 overflow-hidden">
                {selectedProduct.imageUrl ? (
                  <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-16 h-16 text-slate-200 dark:text-slate-700" /></div>
                )}
                {selectedProduct.hasPromo && (
                  <div className="absolute top-3 left-3"><span className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold">-{selectedProduct.discountPercent}%</span></div>
                )}
                {selectedProduct.availableQuantity <= 5 && selectedProduct.availableQuantity > 0 && (
                  <div className="absolute top-3 left-3" style={selectedProduct.hasPromo ? { top: "3.5rem" } : {}}><span className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-bold">Plus que {selectedProduct.availableQuantity} disponibles</span></div>
                )}
                {selectedProduct.availableQuantity === 0 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="px-4 py-2 rounded-xl bg-white text-sm font-bold text-slate-700">Rupture de stock</span>
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="p-5 sm:p-6 space-y-4">
                {selectedProduct.category && (
                  <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: primaryColor + "15", color: primaryColor }}>
                    {selectedProduct.category}
                  </span>
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedProduct.name}</h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>{formatPrice(selectedProduct.salePrice)} FCFA</p>
                  {selectedProduct.hasPromo && selectedProduct.compareAtPrice && (
                    <p className="text-base text-slate-400 line-through">{formatPrice(selectedProduct.compareAtPrice)} FCFA</p>
                  )}
                </div>

                {/* Partage social */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Share2 className="w-3.5 h-3.5" /> Partager :</span>
                  <button onClick={() => shareWhatsApp(selectedProduct)} aria-label="Partager sur WhatsApp" className="w-8 h-8 rounded-lg bg-[#25D366] hover:bg-[#1EBE58] text-white flex items-center justify-center transition-colors">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button onClick={shareFacebook} aria-label="Partager sur Facebook" className="w-8 h-8 rounded-lg bg-[#1877F2] hover:bg-[#0e5fc0] text-white flex items-center justify-center transition-colors">
                    <Facebook className="w-4 h-4" />
                  </button>
                  <button onClick={copyLink} aria-label="Copier le lien" className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Description</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Stock */}
                <div className="flex items-center gap-2 text-xs">
                  {selectedProduct.availableQuantity > 0 ? (
                    <><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-green-600 font-medium">{selectedProduct.availableQuantity} en stock</span></>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-rose-600 font-medium">Rupture de stock</span></>
                  )}
                </div>

                {/* Avis */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Avis clients</h3>
                    {productReviews.length > 0 && <span className="text-xs text-slate-400">{productReviews.length} avis</span>}
                  </div>
                  {productReviewsLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Chargement des avis...</div>
                  ) : productReviews.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {productReviews.map((r) => (
                        <div key={r.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{r.customerName}</p>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600"}`} />
                              ))}
                            </div>
                          </div>
                          {r.comment && <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Soyez le premier à donner votre avis sur ce produit.</p>
                  )}

                  {/* Form avis */}
                  {reviewSubmitted ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Merci ! Votre avis sera visible après modération par le vendeur.
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-2">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Laisser un avis</p>
                      <input type="text" value={reviewForm.customerName} onChange={(e) => setReviewForm({ ...reviewForm, customerName: e.target.value })} placeholder="Votre nom" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400" />
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <button key={i} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })} aria-label={`${i + 1} étoile${i > 0 ? "s" : ""}`}>
                            <Star className={`w-5 h-5 transition-colors ${i < reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600 hover:text-amber-300"}`} />
                          </button>
                        ))}
                      </div>
                      <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Votre commentaire (optionnel)" rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 resize-none" />
                      <button onClick={handleSubmitReview} disabled={reviewSubmitting} className="w-full py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                        {reviewSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...</> : <><Send className="w-3.5 h-3.5" /> Publier mon avis</>}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quantité + Acheter */}
                {selectedProduct.availableQuantity > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center gap-1 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                      <button onClick={() => { const inCart = cart.find((i) => i.product.id === selectedProduct.id); if (inCart && inCart.quantity > 1) updateQuantity(selectedProduct.id, -1); }} className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                        <Minus className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-[2rem] text-center font-bold text-base text-slate-900 dark:text-slate-100">
                        {cart.find((i) => i.product.id === selectedProduct.id)?.quantity || 0}
                      </span>
                      <button onClick={() => { const inCart = cart.find((i) => i.product.id === selectedProduct.id); if (!inCart || inCart.quantity < selectedProduct.availableQuantity) addToCart(selectedProduct); }} disabled={(cart.find((i) => i.product.id === selectedProduct.id)?.quantity || 0) >= selectedProduct.availableQuantity} className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-opacity" style={{ backgroundColor: primaryColor }}>
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>
                    <button onClick={() => { const inCart = cart.find((i) => i.product.id === selectedProduct.id); if (!inCart || inCart.quantity < selectedProduct.availableQuantity) addToCart(selectedProduct); setSelectedProduct(null); setCartOpen(true); }} className="flex-1 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                      <ShoppingBag className="w-4 h-4" /> Acheter
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== FLOATING WHATSAPP BUTTON (boutique) ===== */}
      {waFloatingUrl && (
        <a
          href={waFloatingUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Contacter ${store?.name} sur WhatsApp`}
          className="fixed bottom-24 right-4 z-40 group"
        >
          {/* Pulsation */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          <span className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE58] shadow-2xl shadow-[#25D366]/40 flex items-center justify-center text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </span>
          {/* Tooltip au survol */}
          <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium px-2.5 py-1.5 shadow-lg border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:block">
            Une question ? Écrivez-nous
          </span>
        </a>
      )}

      {/* ===== TOAST ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className={`fixed bottom-4 left-1/2 z-[60] px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 ${toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}
          >
            {toast.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
