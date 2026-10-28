// ============================================================
// YonuKom — Customer List
// Search, customer rows, quick add
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { CustomerCard, type CustomerCardData } from "./customer-card";
import { CustomerForm, type CustomerFormData } from "./customer-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import { Plus, Search, Users, UserPlus, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CustomerList() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [customers, setCustomers] = useState<CustomerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerCardData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerCardData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    // Pas de businessId valide → liste vide (pas de données démo).
    if (!businessId || businessId === "demo") {
      setCustomers([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/customers?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      // /api/customers retourne un array directement, pas { customers: [] }
      const list = Array.isArray(data) ? data : (data.customers || []);
      setCustomers(list);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers
  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.address ?? "").toLowerCase().includes(q)
    );
  });

  // Handle save — POST (create) on /api/ecom-customers, PUT (update) on /api/customers/[id]
  const handleSave = async (data: CustomerFormData) => {
    try {
      if (data.id) {
        // Update — persist to /api/customers/[id] (PUT)
        const res = await fetch(`/api/customers/${data.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            phone: data.phone,
            address: data.address ?? null,
            paymentMethod: data.paymentMethod,
            isB2B: data.isB2B,
          }),
        });
        if (res.ok) {
          const updated = (await res.json()) as CustomerCardData;
          setCustomers((prev) =>
            prev.map((c) => (c.id === data.id ? { ...c, ...updated } : c))
          );
          toast.success(`Client ${data.name} mis à jour`);
        } else {
          // Fallback: update locally if API fails
          setCustomers((prev) =>
            prev.map((c) =>
              c.id === data.id
                ? {
                    ...c,
                    name: data.name,
                    phone: data.phone,
                    address: data.address ?? null,
                    paymentMethod: data.paymentMethod,
                    isB2B: data.isB2B,
                  }
                : c
            )
          );
        }
      } else {
        // Create — forwards businessId so the API can persist it.
        const res = await fetch("/api/ecom-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, businessId }),
        });
        if (res.ok) {
          const newCustomer = (await res.json()) as CustomerCardData;
          setCustomers((prev) => [...prev, newCustomer]);
        }
      }
    } catch {
      // silently fail
    }
  };

  // Handle edit click
  const handleEdit = (customer: CustomerCardData) => {
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  // Handle quick add
  const handleQuickAdd = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  // --- Delete customer ---
  // Optimistically removes the row, then calls DELETE /api/customers/[id].
  // If the API returns 409 (outstanding orders), we restore the row and
  // show a friendly error. Mock customers (ecom-customers) won't exist in
  // DB → 404 is treated as success since the row is already gone locally.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeletingId(target.id);

    // Optimistic removal
    setCustomers((prev) => prev.filter((c) => c.id !== target.id));

    try {
      const url = businessId
        ? `/api/customers/${target.id}?businessId=${encodeURIComponent(businessId)}`
        : `/api/customers/${target.id}`;
      const res = await fetch(url, { method: "DELETE" });

      if (res.status === 409) {
        // Restore — customer has outstanding orders
        const err = await res.json().catch(() => ({}));
        setCustomers((prev) =>
          prev.some((c) => c.id === target.id) ? prev : [target, ...prev]
        );
        toast.error(
          err.error ||
            "Impossible de supprimer ce client : des commandes en cours y sont rattachées."
        );
        return;
      }

      if (!res.ok && res.status !== 404) {
        const err = await res.json().catch(() => ({}));
        // Restore on unexpected error
        setCustomers((prev) =>
          prev.some((c) => c.id === target.id) ? prev : [target, ...prev]
        );
        throw new Error(err.error || "Échec de la suppression");
      }

      toast.success(`Client ${target.name} supprimé`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Clients
        </h2>
        <Button size="sm" className="gap-1" onClick={handleQuickAdd}>
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Customer list */}
      {filtered.length > 0 ? (
        <div className="space-y-0.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center gap-1"
              >
                <div className="flex-1 min-w-0">
                  <CustomerCard
                    customer={customer}
                    onClick={handleEdit}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={deletingId === customer.id}
                  onClick={() => setDeleteTarget(customer)}
                  title="Supprimer"
                  aria-label={`Supprimer le client ${customer.name}`}
                >
                  {deletingId === customer.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              {customers.length === 0 ? (
                <>
                  <h3 className="font-semibold">Aucun client</h3>
                  <p className="text-sm text-muted-foreground">
                    Ajoutez votre premier client ! Juste un nom et un numéro.
                  </p>
                  <Button className="gap-1" onClick={handleQuickAdd}>
                    <Plus className="w-4 h-4" />
                    Ajouter un client
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold">Aucun résultat</h3>
                  <p className="text-sm text-muted-foreground">
                    Essayez un autre terme de recherche.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Customer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filtered.length} client{filtered.length > 1 ? "s" : ""}
        </p>
      )}

      {/* Customer Form Dialog — key forces remount when customer changes */}
      <CustomerForm
        key={editingCustomer?.id ?? "new"}
        customer={editingCustomer}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer cette commande/client/facture/devis ? Cette action est
              irréversible.
              {deleteTarget && (
                <span className="block mt-1 text-xs font-medium">
                  {deleteTarget.name} — {deleteTarget.phone}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!!deletingId}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deletingId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
