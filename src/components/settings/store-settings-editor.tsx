"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Store, Loader2, CheckCircle2, Truck, Package, ExternalLink, Copy } from "lucide-react";
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
  });

  const fetchSettings = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/store/settings?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = await res.json();
        const s = data.store;
        setForm({
          storeSlug: s.storeSlug || "", isStoreActive: s.isStoreActive || false,
          storePrimaryColor: s.storePrimaryColor || "#1E40AF",
          allowPickup: s.allowPickup ?? true, allowDelivery: s.allowDelivery ?? true,
          deliveryFee: s.deliveryFee || 0,
        });
      }
    } catch { setError("Erreur réseau"); }
    finally { setLoading(false); }
  }, [businessId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await fetch("/api/store/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Erreur"); }
      setSaved(true); setTimeout(() => setSaved(false), 4000); fetchSettings();
    } catch (err: any) { setError(err.message || "Erreur"); }
    finally { setSaving(false); }
  };

  const storeUrl = form.storeSlug ? `https://yonukom.qrtags.pro/b/${form.storeSlug}` : "";

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
