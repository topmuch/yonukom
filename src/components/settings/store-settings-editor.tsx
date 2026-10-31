"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, Loader2, CheckCircle2, Truck, Package, ExternalLink, Copy, Plus, X, QrCode, Download, Printer } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

export function StoreSettingsEditor() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeSlug: "", isStoreActive: false, storePrimaryColor: "#1E40AF",
    allowPickup: true, allowDelivery: true, deliveryFee: 0,
    storeBannerUrl: "",
  });
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [uploadingSlide, setUploadingSlide] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  /**
   * Upload une image vers /api/upload (compression sharp côté serveur → WebP).
   * Retourne l'URL publique (/api/uploads/{businessId}/{file}.webp) ou null
   * en cas d'échec. Affiche un toast en cas d'erreur.
   *
   * Remplace l'ancienne approche base64 (FileReader) qui :
   *  - limitait à 2 Mo (les photos téléphone étaient rejetées)
   *  - stockait des Mo de base64 dans la colonne storeSliderImages
   *  - cassait la sauvegarde/relecture au-delà de ~2 Mo
   */
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!businessId) { toast.error("Session expirée — reconnectez-vous"); return null; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image trop grande (max 5 Mo)"); return null; }
    const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("businessId", businessId);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || "Échec de l'upload");
        return null;
      }
      const data = await res.json();
      return (data.url as string) || null;
    } catch {
      toast.error("Erreur réseau lors de l'upload");
      return null;
    }
  }, [businessId]);

  const fetchSettings = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/store/settings?businessId=${encodeURIComponent(businessId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.store;
        setForm({
          storeSlug: s.storeSlug || "", isStoreActive: s.isStoreActive || false,
          storePrimaryColor: s.storePrimaryColor || "#1E40AF",
          allowPickup: s.allowPickup ?? true, allowDelivery: s.allowDelivery ?? true,
          deliveryFee: s.deliveryFee || 0,
          storeBannerUrl: s.storeBannerUrl || "",
        });
        setSliderImages(Array.isArray(s.storeSliderImages) ? s.storeSliderImages : []);
      }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch("/api/store/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ businessId, ...form, storeSliderImages: sliderImages }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Erreur"); }
      setSaved(true); setTimeout(() => setSaved(false), 4000); fetchSettings();
      // Rafraîchir la config store (staleness M-C5) — au cas où les modules
      // liés à la boutique en ligne ont changé côté serveur.
      try {
        const { useConfigStore } = await import("@/stores/use-config-store");
        await useConfigStore.getState().refreshFromServer(businessId);
      } catch {
        /* non-bloquant */
      }
    } catch (err: any) { setError(err.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const storeUrl = form.storeSlug ? `https://yonukom.qrtags.pro/b/${form.storeSlug}` : "";

  const handleDownloadQr = async () => {
    try {
      const bigQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(storeUrl)}`;
      const res = await fetch(bigQrUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${form.storeSlug || "boutique"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("QR Code téléchargé (500×500)");
    } catch {
      toast.error("Échec du téléchargement du QR Code");
    }
  };

  const handlePrintQr = () => {
    const bigQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(storeUrl)}`;
    const w = window.open("", "_blank", "width=600,height=700");
    if (!w) { toast.error("Veuillez autoriser les pop-ups"); return; }
    w.document.write(`
      <html><head><title>QR Code - ${form.storeSlug || "Boutique"}</title>
      <style>body{font-family:system-ui,sans-serif;text-align:center;padding:2rem;} img{width:400px;height:400px;} h2{margin-bottom:0.5rem;} p{color:#666;font-size:0.9rem;}</style>
      </head><body>
        <h2>${form.storeSlug || "Ma boutique"}</h2>
        <img src="${bigQrUrl}" alt="QR Code" />
        <p>${storeUrl}</p>
        <p>Scannez pour accéder à la boutique en ligne</p>
        <script>window.onload=function(){window.print();}</script>
      </body></html>
    `);
    w.document.close();
  };

  if (loading) return (
    <Card><CardContent className="p-6 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-primary animate-spin" />
      <span className="ml-2 text-sm text-muted-foreground">Chargement...</span>
    </CardContent></Card>
  );

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-base">Boutique en ligne</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {form.isStoreActive ? "🟢 Ouverte" : "🔴 Fermée"}
            </span>
            <Switch checked={form.isStoreActive}
              onCheckedChange={(c) => setForm({ ...form, isStoreActive: c })} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Activez votre boutique pour que vos clients commandent en ligne.
          Partagez le lien sur WhatsApp, Facebook, Instagram.
        </p>
        {error && <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>}
        {saved && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Paramètres enregistrés.</div>}

        {/* Bannière */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Bannière de la boutique</Label>
          <p className="text-[10px] text-muted-foreground">Image large affichée en haut de votre boutique (recommandé: 1200×300px, max 2MB)</p>
          {form.storeBannerUrl ? (
            <div className="relative group">
              <img src={form.storeBannerUrl} alt="Bannière" className="w-full h-24 sm:h-32 object-cover rounded-xl border border-slate-200" />
              <button type="button" onClick={() => setForm({ ...form, storeBannerUrl: "" })}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingBanner(true);
                  const url = await uploadImage(file);
                  setUploadingBanner(false);
                  e.target.value = ""; // permet de re-sélectionner le même fichier
                  if (url) {
                    setForm({ ...form, storeBannerUrl: url });
                    toast.success("Bannière ajoutée");
                  }
                }} />
              {uploadingBanner ? (
                <><Loader2 className="w-4 h-4 animate-spin text-slate-400" /> <span className="text-xs text-slate-500">Upload...</span></>
              ) : (
                <><Plus className="w-4 h-4 text-slate-400" /> <span className="text-xs text-slate-500">Ajouter une bannière</span></>
              )}
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Slug (URL publique)</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">/b/</span>
            <Input value={form.storeSlug} onChange={(e) => setForm({ ...form, storeSlug: e.target.value })}
              placeholder="le-baobab" className="flex-1" />
          </div>
          {storeUrl && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground truncate">{storeUrl}</div>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(storeUrl); toast.success("Lien copié !"); }}><Copy className="w-3.5 h-3.5" /></Button>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="w-3.5 h-3.5" /></Button></a>
            </div>
          )}
        </div>

        {form.storeSlug && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" /> QR Code boutique
            </Label>
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=8&data=${encodeURIComponent(storeUrl)}`}
                alt="QR Code boutique"
                className="w-[200px] h-[200px] rounded-lg bg-white p-2 border border-slate-200"
              />
              <div className="flex-1 text-center sm:text-left space-y-2">
                <p className="text-sm font-medium text-slate-700">Scannez pour ouvrir la boutique</p>
                <p className="text-xs text-muted-foreground break-all">{storeUrl}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Button size="sm" variant="outline" onClick={handleDownloadQr} className="gap-1.5">
                    <Download className="w-3.5 h-3.5" /> Télécharger (PNG 500×500)
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrintQr} className="gap-1.5">
                    <Printer className="w-3.5 h-3.5" /> Imprimer
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400">Imprimez ce QR Code et affichez-le en boutique</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-medium">Couleur principale</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.storePrimaryColor}
              onChange={(e) => setForm({ ...form, storePrimaryColor: e.target.value })}
              className="w-12 h-9 rounded-lg border border-slate-200 cursor-pointer" />
            <Input value={form.storePrimaryColor} onChange={(e) => setForm({ ...form, storePrimaryColor: e.target.value })} className="flex-1" />
            <div className="w-9 h-9 rounded-lg border border-slate-200" style={{ backgroundColor: form.storePrimaryColor }} />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Options de livraison</Label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Package className="w-4 h-4 text-slate-500" /><span className="text-sm">Retrait en boutique</span></div>
            <Switch checked={form.allowPickup} onCheckedChange={(c) => setForm({ ...form, allowPickup: c })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-slate-500" /><span className="text-sm">Livraison à domicile</span></div>
            <Switch checked={form.allowDelivery} onCheckedChange={(c) => setForm({ ...form, allowDelivery: c })} />
          </div>
          {form.allowDelivery && (
            <div className="space-y-1.5 pl-6">
              <Label className="text-xs font-medium">Frais de livraison (FCFA)</Label>
              <Input type="number" min="0" value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: parseInt(e.target.value) || 0 })}
                placeholder="500" className="max-w-[200px]" />
            </div>
          )}
        </div>

        {/* Slider images */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Images du slider (hero)
          </Label>
          <p className="text-[10px] text-muted-foreground">
            Ajoutez jusqu'à 5 images qui défileront en haut de votre boutique.
            Si aucune image n'est ajoutée, un texte animé sera affiché.
          </p>

          {/* Current images */}
          {sliderImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {sliderImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Slide ${i + 1}`} className="w-full aspect-video object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => setSliderImages(sliderImages.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {sliderImages.length < 5 && (
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingSlide(true);
                  const url = await uploadImage(file);
                  setUploadingSlide(false);
                  e.target.value = ""; // permet de re-sélectionner le même fichier
                  if (url) {
                    setSliderImages([...sliderImages, url]);
                    toast.success("Image du slider ajoutée");
                  }
                }}
              />
              {uploadingSlide ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Upload...</>
              ) : (
                <><Plus className="w-4 h-4" /> Ajouter une image</>
              )}
            </label>
          )}
        </div>

        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
            : <><CheckCircle2 className="w-4 h-4" />Enregistrer la boutique</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
