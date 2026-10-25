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
import { Plus, Search, Users, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function CustomerList() {
  const [customers, setCustomers] = useState<CustomerCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerCardData | null>(null);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/ecom-customers");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers
  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  // Handle save
  const handleSave = async (data: CustomerFormData) => {
    try {
      if (data.id) {
        // Update locally (mock)
        setCustomers((prev) =>
          prev.map((c) =>
            c.id === data.id
              ? { ...c, name: data.name, phone: data.phone, paymentMethod: data.paymentMethod, isB2B: data.isB2B }
              : c
          )
        );
      } else {
        // Create
        const res = await fetch("/api/ecom-customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const newCustomer = await res.json();
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
              <CustomerCard
                key={customer.id}
                customer={customer}
                onClick={handleEdit}
              />
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
    </div>
  );
}
