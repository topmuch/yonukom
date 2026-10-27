"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Phone, Mail, MapPin, Loader2, CheckCircle2, Upload, X, Waves } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  logoUrl: string | null;
  wavePaymentLink: string | null;
}

export function BusinessProfileEditor() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "SN",
    logoUrl: "",
    wavePaymentLink: "",
  });

  const fetchProfile = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          address: data.address ?? "",
          city: data.city ?? "",
          country: data.country ?? "SN",
          logoUrl: data.logoUrl ?? "",
          wavePaymentLink: data.wavePaymentLink ?? "",
        });
      } else {
        setError("Impossible de charger le profil du commerce");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/business/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la sauvegarde");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setError(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("Le logo ne doit pas dépasser 1 Mo. Compressez-le avant upload.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Le fichier doit être une image (PNG, JPG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setForm((f) => ({ ...f, logoUrl: result }));
      setError(null);
    };
    reader.onerror = () => setError("Lecture du fichier impossible");
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setForm((f) => ({ ...f, logoUrl: "" }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement du profil...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base">Profil du commerce</h3>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Ces informations apparaîtront sur vos reçus, factures et dans l&apos;app.
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Profil mis à jour avec succès.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <Label htmlFor="logo" className="text-xs font-medium">Logo du commerce</Label>
            <div className="mt-2 flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                {form.logoUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.logoUrl}
                      alt="Logo du commerce"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md"
                      aria-label="Supprimer le logo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Building2 className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium cursor-pointer text-slate-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {form.logoUrl ? "Changer le logo" : "Téléverser un logo"}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  PNG, JPG ou WEBP. Max 1 Mo. Recommandé : 256×256px.
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="biz-name" className="text-xs font-medium">Nom du commerce</Label>
            <Input
              id="biz-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Boutique Fatou"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="biz-phone" className="text-xs font-medium flex items-center gap-1">
                <Phone className="w-3 h-3" /> Téléphone
              </Label>
              <Input
                id="biz-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+221 78 123 45 67"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="biz-email" className="text-xs font-medium flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </Label>
              <Input
                id="biz-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@boutique.sn"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="biz-address" className="text-xs font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Adresse
            </Label>
            <Textarea
              id="biz-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ex: 2m Sicap Foire, Dakar"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="biz-city" className="text-xs font-medium">Ville</Label>
              <Input
                id="biz-city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Dakar"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="biz-country" className="text-xs font-medium">Pays</Label>
              <select
                id="biz-country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="SN">Sénégal</option>
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="ML">Mali</option>
                <option value="BF">Burkina Faso</option>
                <option value="GN">Guinée</option>
                <option value="TG">Togo</option>
                <option value="BJ">Bénin</option>
                <option value="NE">Niger</option>
                <option value="MR">Mauritanie</option>
                <option value="Other">Autre</option>
              </select>
            </div>
          </div>

          {/* Lien de paiement Wave */}
          <div className="mt-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2">
            <Label htmlFor="biz-wave-link" className="text-xs font-medium flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <Waves className="w-3.5 h-3.5" />
              Lien de paiement Wave
            </Label>
            <Input
              id="biz-wave-link"
              type="url"
              value={form.wavePaymentLink}
              onChange={(e) => setForm({ ...form, wavePaymentLink: e.target.value })}
              placeholder="https://pay.wave.com/m/..."
              className="bg-white dark:bg-slate-900"
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Collez ici votre lien de paiement Wave Business (généré depuis votre compte Wave).
              Il sera envoyé par WhatsApp aux clients qui choisissent Wave comme moyen de paiement.
            </p>
            {form.wavePaymentLink && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Lien configuré — les paiements Wave sont activés
              </p>
            )}
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Enregistrer le profil
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Zone dangereuse : réinitialiser les données */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-bold text-rose-600 mb-1">Zone dangereuse</h4>
          <p className="text-xs text-muted-foreground mb-3">
            Réinitialisez toutes les données de votre commerce : produits,
            clients, ventes, sessions de caisse. Cette action est irréversible.
            Le compte lui-même (login + mot de passe) est conservé.
          </p>
          <Button
            type="button"
            variant="outline"
            className="border-rose-300 text-rose-600 hover:bg-rose-50 gap-2 text-xs"
            onClick={async () => {
              if (!businessId) return;
              if (
                !confirm(
                  "ATTENTION : Cette action va supprimer DÉFINITIVEMENT tous vos produits, clients, ventes et historique. Êtes-vous absolument sûr ?"
                )
              ) {
                return;
              }
              if (
                !confirm(
                  "Dernière confirmation : cette action est IRRÉVERSIBLE. Tapez OK pour continuer."
                )
              ) {
                return;
              }
              try {
                const res = await fetch("/api/business/reset", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ businessId }),
                });
                if (!res.ok) {
                  const data = await res.json().catch(() => ({}));
                  throw new Error(data.error || "Erreur");
                }
                setError(null);
                setSaved(true);
                setTimeout(() => setSaved(false), 5000);
                // Re-fetch le profil pour rafraîchir l'affichage
                fetchProfile();
              } catch (err: any) {
                setError(err.message || "Erreur lors de la réinitialisation");
              }
            }}
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser toutes mes données
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
