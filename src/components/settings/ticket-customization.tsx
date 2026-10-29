// ============================================================
// YonuKom — Personnalisation du ticket
// 3 sections :
//   1. QR Code URL (vers laquelle le QR sur les tickets pointe)
//   2. Message en bas du ticket
//   3. Promo du jour (créer / désactiver)
// Bouton "Enregistrer" → PUT /api/business/profile avec qrCodeUrl + ticketFooterMessage
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  QrCode,
  MessageSquare,
  Tag,
  Loader2,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Power,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/use-auth-store";
import { Skeleton } from "@/components/ui/skeleton";

interface PromoData {
  id: string;
  name: string;
  type: string; // "global" | "product" | "amount"
  percentage: number;
  productId: string | null;
  minAmount: number | null;
  ticketMessage: string | null;
  isActive: boolean;
}

interface ProductOption {
  id: string;
  name: string;
}

const DEFAULT_QR_URL = "https://yonukom.qrtags.pro/";
const PROMO_TYPE_LABELS: Record<string, string> = {
  global: "Global (% sur tout)",
  product: "Par produit (% sur 1 produit)",
  amount: "Par montant (% si total ≥ seuil)",
};

export function TicketCustomization() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Section 1+2 : QR + message bas de ticket
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(DEFAULT_QR_URL);
  const [ticketFooterMessage, setTicketFooterMessage] = useState<string>("");

  // Section 3 : promo active
  const [activePromo, setActivePromo] = useState<PromoData | null>(null);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [creatingPromo, setCreatingPromo] = useState(false);

  // Formulaire création promo
  const [promoName, setPromoName] = useState("");
  const [promoType, setPromoType] = useState<"global" | "product" | "amount">("global");
  const [promoPercentage, setPromoPercentage] = useState<string>("10");
  const [promoProductId, setPromoProductId] = useState<string>("");
  const [promoMinAmount, setPromoMinAmount] = useState<string>("10000");
  const [promoTicketMessage, setPromoTicketMessage] = useState("");

  const fetchAll = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [profileRes, promoRes, productsRes] = await Promise.all([
        fetch(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`),
        fetch(`/api/promos?businessId=${encodeURIComponent(businessId)}&active=true`),
        fetch(`/api/products?businessId=${encodeURIComponent(businessId)}`),
      ]);

      if (profileRes.ok) {
        const profile = await profileRes.json();
        setQrCodeUrl(profile.qrCodeUrl ?? DEFAULT_QR_URL);
        setTicketFooterMessage(profile.ticketFooterMessage ?? "");
      }
      if (promoRes.ok) {
        const p = await promoRes.json();
        setActivePromo(p.promo ?? null);
      }
      if (productsRes.ok) {
        const pdata = await productsRes.json();
        const list: ProductOption[] = (pdata.products ?? pdata ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
        }));
        setProducts(list);
      }
    } catch (err) {
      console.error("TicketCustomization fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Enregistrer QR URL + footer message
  const handleSaveTicket = async () => {
    if (!businessId) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/business/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          qrCodeUrl: qrCodeUrl.trim() || DEFAULT_QR_URL,
          ticketFooterMessage,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erreur lors de l'enregistrement");
      }
      setSaved(true);
      toast.success("Personnalisation du ticket enregistrée");
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur d'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // Créer une nouvelle promo active
  const handleCreatePromo = async () => {
    if (!businessId) return;
    if (!promoName.trim()) {
      toast.error("Veuillez saisir un nom pour la promo");
      return;
    }
    const pct = Number(promoPercentage);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("Le pourcentage doit être entre 0 et 100");
      return;
    }
    if (promoType === "product" && !promoProductId) {
      toast.error("Veuillez sélectionner un produit pour la promo");
      return;
    }
    if (promoType === "amount") {
      const min = Number(promoMinAmount);
      if (isNaN(min) || min <= 0) {
        toast.error("Veuillez saisir un montant minimum valide");
        return;
      }
    }

    setCreatingPromo(true);
    try {
      const res = await fetch(`/api/promos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: promoName.trim(),
          type: promoType,
          percentage: pct,
          productId: promoType === "product" ? promoProductId : null,
          minAmount: promoType === "amount" ? Number(promoMinAmount) : null,
          ticketMessage: promoTicketMessage.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erreur de création de la promo");
      }
      const created = (await res.json()) as PromoData;
      setActivePromo(created);
      setShowPromoForm(false);
      // Reset form
      setPromoName("");
      setPromoType("global");
      setPromoPercentage("10");
      setPromoProductId("");
      setPromoMinAmount("10000");
      setPromoTicketMessage("");
      toast.success("Promo créée et activée avec succès");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur de création");
    } finally {
      setCreatingPromo(false);
    }
  };

  // Désactiver la promo active
  const handleDeactivatePromo = async () => {
    if (!businessId || !activePromo) return;
    try {
      const res = await fetch(`/api/promos/${activePromo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, isActive: false }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erreur de désactivation");
      }
      setActivePromo(null);
      toast.success("Promo désactivée");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  // Supprimer la promo active
  const handleDeletePromo = async () => {
    if (!businessId || !activePromo) return;
    if (!confirm(`Supprimer définitivement la promo "${activePromo.name}" ?`)) return;
    try {
      const res = await fetch(
        `/api/promos/${activePromo.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Erreur de suppression");
      }
      setActivePromo(null);
      toast.success("Promo supprimée");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur");
    }
  };

  // URL preview du QR code
  const qrPreviewUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrCodeUrl || DEFAULT_QR_URL)}`;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section 1 : QR Code URL */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            QR Code sur le ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="qr-url" className="text-xs font-medium">
              URL pointée par le QR code
            </Label>
            <Input
              id="qr-url"
              type="url"
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
              placeholder={DEFAULT_QR_URL}
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Collez ici l&apos;URL vers laquelle le QR code sur vos tickets doit pointer
              (votre site, page Facebook, Instagram...).
            </p>
          </div>
          <div className="flex items-center gap-4 p-3 bg-muted/40 rounded-lg">
            <img
              src={qrPreviewUrl}
              alt="Aperçu QR code"
              className="w-24 h-24 rounded-lg bg-white p-1 border"
            />
            <div className="text-xs space-y-1">
              <p className="font-medium">Aperçu du QR code</p>
              <p className="text-muted-foreground break-all line-clamp-2">
                {qrCodeUrl || DEFAULT_QR_URL}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 : Message bas de ticket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Message en bas du ticket
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="footer-msg" className="text-xs font-medium">
              Texte affiché en bas des tickets
            </Label>
            <Textarea
              id="footer-msg"
              value={ticketFooterMessage}
              onChange={(e) => setTicketFooterMessage(e.target.value.slice(0, 200))}
              placeholder="Ex: Suivez-nous sur Facebook @baobab — Livraison à domicile : 77 123 45 67"
              className="text-sm min-h-[80px]"
              maxLength={200}
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Ce message apparaîtra en bas de tous vos tickets de caisse.
              </span>
              <span>{ticketFooterMessage.length}/200</span>
            </div>
          </div>
          <Button
            onClick={handleSaveTicket}
            disabled={saving}
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving
              ? "Enregistrement..."
              : saved
              ? "Enregistré ✓"
              : "Enregistrer la personnalisation"}
          </Button>
        </CardContent>
      </Card>

      {/* Section 3 : Promo du jour */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" />
            Promo du jour
            {activePromo && (
              <Badge className="ml-2 bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                <Sparkles className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePromo ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">{activePromo.name}</p>
                  <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                    -{activePromo.percentage}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Type : {PROMO_TYPE_LABELS[activePromo.type] ?? activePromo.type}</p>
                  {activePromo.type === "product" && (
                    <p>
                      Produit :{" "}
                      {products.find((p) => p.id === activePromo.productId)?.name ?? "—"}
                    </p>
                  )}
                  {activePromo.type === "amount" && activePromo.minAmount !== null && (
                    <p>Seuil minimum : {activePromo.minAmount.toLocaleString("fr-FR")} FCFA</p>
                  )}
                  {activePromo.ticketMessage && (
                    <p className="italic mt-1">&laquo; {activePromo.ticketMessage} &raquo;</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs"
                  onClick={handleDeactivatePromo}
                >
                  <Power className="w-3.5 h-3.5" />
                  Désactiver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive gap-1.5 text-xs"
                  onClick={handleDeletePromo}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </Button>
              </div>
            </motion.div>
          ) : showPromoForm ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <Label htmlFor="promo-name" className="text-xs font-medium">
                  Nom de la promo
                </Label>
                <Input
                  id="promo-name"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  placeholder="Ex: Promo du jour -20%"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="promo-type" className="text-xs font-medium">
                  Type de réduction
                </Label>
                <Select
                  value={promoType}
                  onValueChange={(v) => setPromoType(v as typeof promoType)}
                >
                  <SelectTrigger id="promo-type" className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (% sur tout)</SelectItem>
                    <SelectItem value="product">Par produit (% sur 1 produit)</SelectItem>
                    <SelectItem value="amount">Par montant (% si total ≥ seuil)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="promo-pct" className="text-xs font-medium">
                    Pourcentage (%)
                  </Label>
                  <Input
                    id="promo-pct"
                    type="number"
                    min={0}
                    max={100}
                    value={promoPercentage}
                    onChange={(e) => setPromoPercentage(e.target.value)}
                    className="text-sm"
                  />
                </div>
                {promoType === "amount" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="promo-min" className="text-xs font-medium">
                      Montant mini (FCFA)
                    </Label>
                    <Input
                      id="promo-min"
                      type="number"
                      min={0}
                      value={promoMinAmount}
                      onChange={(e) => setPromoMinAmount(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
              {promoType === "product" && (
                <div className="space-y-1.5">
                  <Label htmlFor="promo-prod" className="text-xs font-medium">
                    Produit concerné
                  </Label>
                  <Select
                    value={promoProductId}
                    onValueChange={setPromoProductId}
                  >
                    <SelectTrigger id="promo-prod" className="text-sm">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          Aucun produit — créez-en d&apos;abord
                        </SelectItem>
                      ) : (
                        products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="promo-msg" className="text-xs font-medium">
                  Message affiché sur le ticket (optionnel)
                </Label>
                <Input
                  id="promo-msg"
                  value={promoTicketMessage}
                  onChange={(e) => setPromoTicketMessage(e.target.value.slice(0, 200))}
                  placeholder="Ex: Profitez de -20% sur tout aujourd'hui !"
                  className="text-sm"
                  maxLength={200}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePromo}
                  disabled={creatingPromo}
                  className="flex-1 gap-1.5 text-xs"
                  size="sm"
                >
                  {creatingPromo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {creatingPromo ? "Création..." : "Créer et activer"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setShowPromoForm(false)}
                >
                  Annuler
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Aucune promo active pour le moment.
              </p>
              <p className="text-xs text-muted-foreground">
                Une seule promo peut être active à la fois. La créer ici l&apos;activera
                immédiatement et désactivera toute promo précédente.
              </p>
              <Button
                onClick={() => setShowPromoForm(true)}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Créer une promo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
