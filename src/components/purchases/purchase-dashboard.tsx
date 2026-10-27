// ============================================================
// YonuKom — Purchase Dashboard (Achats & Fournisseurs)
// Deux sections : Fournisseurs (table + dialog création) et
// Achats (table + dialog multi-étapes + détails + actions).
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package,
  Truck,
  Plus,
  Eye,
  CheckCircle2,
  Banknote,
  Pencil,
  Trash2,
  Loader2,
  ShoppingCart,
} from "lucide-react";
import { formatFCFA } from "@/lib/fcfa";
import { motion } from "framer-motion";

// --- Types ---
interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  outstandingBalance: number;
  notes: string | null;
  isActive: boolean;
}

interface PurchaseItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Purchase {
  id: string;
  reference: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  orderDate: string;
  receivedDate: string | null;
  notes: string | null;
  supplier: { id: string; name: string; phone: string | null } | null;
  items: PurchaseItem[];
}

interface Product {
  id: string;
  name: string;
  salePrice: number;
  unitType: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  ordered: "Commandé",
  received: "Reçu",
  paid: "Payé",
  cancelled: "Annulé",
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ordered: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  received:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  paid: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

// ============================================================
// Main Component
// ============================================================
export function PurchaseDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [detailsPurchaseId, setDetailsPurchaseId] = useState<string | null>(
    null
  );

  const [actioningId, setActioningId] = useState<string | null>(null);

  // --- Fetch suppliers ---
  const fetchSuppliers = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/suppliers?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Supplier[];
      setSuppliers(data);
    } catch {
      setSuppliers([]);
    }
  }, [businessId]);

  // --- Fetch purchases ---
  const fetchPurchases = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/purchases?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as Purchase[];
      setPurchases(data);
    } catch {
      setPurchases([]);
    }
  }, [businessId]);

  // --- Fetch products (for select in purchase dialog) ---
  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/products?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) {
        setProducts([]);
        return;
      }
      const data = (await res.json()) as Product[] | Product[];
      // L'API products retourne soit un array, soit { products: [...] }
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
    } catch {
      setProducts([]);
    }
  }, [businessId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchSuppliers(), fetchPurchases(), fetchProducts()]);
      setLoading(false);
    })();
  }, [fetchSuppliers, fetchPurchases, fetchProducts]);

  // --- Supplier actions ---
  const handleSaveSupplier = async (form: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }) => {
    if (editingSupplier) {
      const res = await fetch(`/api/suppliers/${editingSupplier.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la mise à jour");
      }
    } else {
      const res = await fetch(`/api/suppliers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, ...form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la création");
      }
    }
    await fetchSuppliers();
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (
      !confirm(
        `Supprimer le fournisseur "${supplier.name}" ? Cette action est irréversible.`
      )
    )
      return;
    try {
      const res = await fetch(
        `/api/suppliers/${supplier.id}?businessId=${encodeURIComponent(businessId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la suppression");
      }
      const data = await res.json();
      toast.success(data.message || "Fournisseur supprimé");
      await fetchSuppliers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  // --- Purchase creation ---
  const handleCreatePurchase = async (form: {
    supplierId: string;
    notes: string;
    orderDate: string;
    items: Array<{
      productId?: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) => {
    const res = await fetch(`/api/purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        supplierId: form.supplierId || undefined,
        notes: form.notes,
        orderDate: form.orderDate || undefined,
        items: form.items,
        status: "ordered",
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Échec de la création de l'achat");
    }
    await fetchPurchases();
  };

  // --- Update purchase status ---
  const handleUpdateStatus = async (
    purchase: Purchase,
    newStatus: "received" | "paid"
  ) => {
    setActioningId(purchase.id);
    try {
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la mise à jour");
      }
      toast.success(
        newStatus === "received"
          ? "Achat marqué comme reçu — stock mis à jour"
          : "Achat marqué comme payé"
      );
      await fetchPurchases();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActioningId(null);
    }
  };

  // --- Loading skeleton ---
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <Package className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Achats & Fournisseurs</h2>
      </motion.div>

      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour gérer vos achats et fournisseurs.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="purchases" className="gap-2">
              <ShoppingCart className="w-4 h-4" />
              Achats
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Truck className="w-4 h-4" />
              Fournisseurs
            </TabsTrigger>
          </TabsList>

          {/* === PURCHASES TAB === */}
          <TabsContent value="purchases" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                onClick={() => setPurchaseDialogOpen(true)}
                disabled={suppliers.length === 0 && products.length === 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvel achat
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {purchases.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="text-4xl">📦</div>
                    <h3 className="font-semibold">Aucun achat enregistré</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur « Nouvel achat » pour créer votre première
                      commande d'achat.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Fournisseur
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Date
                        </TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right hidden sm:table-cell">
                          Payé
                        </TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-medium">
                            {p.reference}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">
                            {p.supplier?.name || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                            {formatDate(p.orderDate)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {formatFCFA(p.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right hidden sm:table-cell text-xs">
                            {formatFCFA(p.paidAmount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${STATUS_STYLES[p.status] || ""}`}
                            >
                              {STATUS_LABELS[p.status] || p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDetailsPurchaseId(p.id)}
                                title="Voir détails"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              {p.status === "ordered" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleUpdateStatus(p, "received")
                                  }
                                  disabled={actioningId === p.id}
                                  title="Marquer reçu (restock)"
                                >
                                  {actioningId === p.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                              </Button>
                              )}
                              {p.status === "received" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(p, "paid")}
                                  disabled={actioningId === p.id}
                                  title="Marquer payé"
                                >
                                  {actioningId === p.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Banknote className="w-3.5 h-3.5" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === SUPPLIERS TAB === */}
          <TabsContent value="suppliers" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierDialogOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau fournisseur
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {suppliers.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="text-4xl">🚚</div>
                    <h3 className="font-semibold">Aucun fournisseur</h3>
                    <p className="text-sm text-muted-foreground">
                      Ajoutez vos fournisseurs pour suivre vos achats et soldes
                      dus.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Téléphone
                        </TableHead>
                        <TableHead className="text-right">Solde dû</TableHead>
                        <TableHead className="text-center hidden md:table-cell">
                          Statut
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((s) => (
                        <TableRow key={s.id} className={!s.isActive ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                            {s.phone || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                s.outstandingBalance > 0
                                  ? "text-sm font-semibold text-rose-600 dark:text-rose-400"
                                  : "text-sm text-muted-foreground"
                              }
                            >
                              {formatFCFA(s.outstandingBalance)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <Badge
                              variant={s.isActive ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {s.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingSupplier(s);
                                  setSupplierDialogOpen(true);
                                }}
                                title="Modifier"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSupplier(s)}
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* === Supplier Dialog === */}
      <SupplierDialog
        open={supplierDialogOpen}
        onOpenChange={(open) => {
          setSupplierDialogOpen(open);
          if (!open) setEditingSupplier(null);
        }}
        supplier={editingSupplier}
        onSave={async (form) => {
          try {
            await handleSaveSupplier(form);
            toast.success(
              editingSupplier
                ? "Fournisseur mis à jour"
                : "Fournisseur créé avec succès"
            );
            setSupplierDialogOpen(false);
            setEditingSupplier(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      />

      {/* === Purchase Dialog (multi-step) === */}
      <PurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        suppliers={suppliers}
        products={products}
        onSave={async (form) => {
          try {
            await handleCreatePurchase(form);
            toast.success("Achat créé avec succès");
            setPurchaseDialogOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      />

      {/* === Purchase Details Dialog === */}
      <PurchaseDetailsDialog
        purchaseId={detailsPurchaseId}
        businessId={businessId}
        onClose={() => setDetailsPurchaseId(null)}
      />
    </div>
  );
}

// ============================================================
// Supplier Dialog — Create / Edit
// ============================================================
function SupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
  onSave: (form: {
    name: string;
    phone: string;
    email: string;
    address: string;
    notes: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(supplier?.name || "");
      setPhone(supplier?.phone || "");
      setEmail(supplier?.email || "");
      setAddress(supplier?.address || "");
      setNotes(supplier?.notes || "");
    }
  }, [open, supplier]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    try {
      await onSave({ name, phone, email, address, notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </DialogTitle>
          <DialogDescription>
            Renseignez les coordonnées de votre fournisseur.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="sup-name">Nom *</Label>
            <Input
              id="sup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: SARL Distribution Dakar"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sup-phone">Téléphone</Label>
              <Input
                id="sup-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77 123 45 67"
              />
            </div>
            <div>
              <Label htmlFor="sup-email">Email</Label>
              <Input
                id="sup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@fournisseur.sn"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sup-address">Adresse</Label>
            <Input
              id="sup-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Dakar, Plateau"
            />
          </div>
          <div>
            <Label htmlFor="sup-notes">Notes internes</Label>
            <Textarea
              id="sup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Délais de paiement, conditions..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Purchase Dialog — Multi-step creation
// ============================================================
interface DraftItem {
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

function PurchaseDialog({
  open,
  onOpenChange,
  suppliers,
  products,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  suppliers: Supplier[];
  products: Product[];
  onSave: (form: {
    supplierId: string;
    notes: string;
    orderDate: string;
    items: DraftItem[];
  }) => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [items, setItems] = useState<DraftItem[]>([
    { productName: "", quantity: 1, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(1);
      setSupplierId("");
      setNotes("");
      setOrderDate("");
      setItems([{ productName: "", quantity: 1, unitPrice: 0 }]);
    }
  }, [open]);

  const total = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
    0
  );

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { productName: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (
    idx: number,
    field: keyof DraftItem,
    value: string
  ) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[idx] };
      if (field === "quantity" || field === "unitPrice") {
        (item as Record<string, unknown>)[field] = Number(value) || 0;
      } else {
        (item as Record<string, unknown>)[field] = value;
      }
      next[idx] = item;
      return next;
    });
  };

  const handleSelectProduct = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          productId: product.id,
          productName: product.name,
          unitPrice: product.salePrice,
        };
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    // Valider
    const validItems = items.filter(
      (it) => it.productName.trim() !== "" && it.quantity > 0
    );
    if (validItems.length === 0) {
      toast.error("Ajoutez au moins un article valide");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        supplierId,
        notes,
        orderDate,
        items: validItems.map((it) => ({
          productId: it.productId,
          productName: it.productName.trim(),
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvel achat — Étape {step}/2</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Sélectionnez le fournisseur et les informations générales."
              : "Ajoutez les articles de l'achat."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="p-supplier">Fournisseur</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger id="p-supplier">
                  <SelectValue placeholder="Sélectionner un fournisseur (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="p-date">Date de commande</Label>
              <Input
                id="p-date"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="p-notes">Notes</Label>
              <Textarea
                id="p-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Conditions de paiement, livraison..."
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-end p-2 rounded-md border bg-muted/30"
              >
                <div className="col-span-12 sm:col-span-5">
                  <Label className="text-xs">Produit</Label>
                  <Input
                    value={it.productName}
                    onChange={(e) =>
                      handleItemChange(idx, "productName", e.target.value)
                    }
                    placeholder="Nom du produit"
                    list="products-list"
                  />
                  <datalist id="products-list">
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </datalist>
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Label className="text-xs">Qté</Label>
                  <Input
                    type="number"
                    min="1"
                    value={it.quantity}
                    onChange={(e) =>
                      handleItemChange(idx, "quantity", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <Label className="text-xs">Prix unitaire</Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={it.unitPrice}
                    onChange={(e) =>
                      handleItemChange(idx, "unitPrice", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-2 sm:col-span-2 text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-sm font-semibold">
                    {formatFCFA(
                      (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                    )}
                  </div>
                </div>
                <div className="col-span-12 flex justify-end">
                  {items.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(idx)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    </Button>
                  )}
                </div>
                {/* Quick product picker */}
                {products.length > 0 && (
                  <div className="col-span-12">
                    <Select
                      value={it.productId || ""}
                      onValueChange={(val) => handleSelectProduct(idx, val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Sélection rapide produit existant" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {formatFCFA(p.salePrice)} / {p.unitType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un article
            </Button>

            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-sm font-medium">Total de l'achat</span>
              <span className="text-lg font-bold text-primary">
                {formatFCFA(total)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          {step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)}>
              Retour
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)}>Suivant</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Créer l'achat
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Purchase Details Dialog
// ============================================================
function PurchaseDetailsDialog({
  purchaseId,
  businessId,
  onClose,
}: {
  purchaseId: string | null;
  businessId: string;
  onClose: () => void;
}) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);

  // Loading is derived: true when we have a new purchaseId not yet loaded
  const loading =
    !!purchaseId && lastLoadedId !== purchaseId;

  useEffect(() => {
    if (!purchaseId) {
      return;
    }
    if (lastLoadedId === purchaseId) {
      return;
    }
    let cancelled = false;
    fetch(
      `/api/purchases/${purchaseId}?businessId=${encodeURIComponent(businessId)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setPurchase(d as Purchase | null);
        setLastLoadedId(purchaseId);
      })
      .catch(() => {
        if (cancelled) return;
        setPurchase(null);
        setLastLoadedId(purchaseId);
      });
    return () => {
      cancelled = true;
    };
  }, [purchaseId, businessId, lastLoadedId]);

  // Clear stale data when dialog is closed (synchronously with parent state)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPurchase(null);
      setLastLoadedId(null);
      onClose();
    }
  };

  return (
    <Dialog open={!!purchaseId} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchase ? `Détails — ${purchase.reference}` : "Chargement..."}
          </DialogTitle>
          <DialogDescription>
            {purchase?.supplier
              ? `Fournisseur : ${purchase.supplier.name}`
              : "Aucun fournisseur associé"}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : purchase ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Date</div>
                <div className="font-medium">{formatDate(purchase.orderDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Statut</div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] ${STATUS_STYLES[purchase.status] || ""}`}
                >
                  {STATUS_LABELS[purchase.status] || purchase.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Reçu le</div>
                <div className="font-medium">
                  {purchase.receivedDate
                    ? formatDate(purchase.receivedDate)
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="font-bold text-primary">
                  {formatFCFA(purchase.totalAmount)}
                </div>
              </div>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-right">Qté</TableHead>
                    <TableHead className="text-right">Prix unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.items.map((it) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-sm">{it.productName}</TableCell>
                      <TableCell className="text-right text-sm">
                        {it.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatFCFA(it.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatFCFA(it.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {purchase.notes && (
              <div className="text-sm bg-muted/30 p-3 rounded-md">
                <div className="text-xs text-muted-foreground mb-1">Notes</div>
                {purchase.notes}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Achat introuvable.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
