"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LogIn,
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Settings,
  CreditCard,
  Users,
  Pause,
  Play,
  Trash2,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import {
  TENANT_TYPE_LABELS,
  SUBSCRIPTION_PLAN_LABELS,
  SUBSCRIPTION_BILLING_PERIOD_LABELS,
} from "@/types";
import type { TenantInfo, SubscriptionStatus, SubscriptionBillingPeriod } from "@/types";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "sonner";

interface TenantDetailPanelProps {
  tenant: TenantInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImpersonate: (tenantId: string, tenantName: string) => void;
  onRefresh?: () => void;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  patron: "Patron",
  gerant: "Gérant",
  vendeur: "Vendeur",
  employee: "Employé",
};

export function TenantDetailPanel({
  tenant,
  open,
  onOpenChange,
  onImpersonate,
  onRefresh,
}: TenantDetailPanelProps) {
  const [actionLoading, setActionLoading] = useState<"suspend" | "activate" | "delete" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Clear loading state when tenant changes
  useEffect(() => {
    setActionLoading(null);
    setDeleteOpen(false);
  }, [tenant?.id]);

  if (!tenant) return null;

  const typeLabel =
    TENANT_TYPE_LABELS[tenant.businessType] ?? tenant.businessType;

  const sub = tenant.subscription;
  const businesses = tenant.businesses ?? [];
  const users = tenant.users ?? [];

  const handleUpdateStatus = async (status: "active" | "suspended") => {
    if (!sub) {
      toast.error("Ce tenant n'a pas d'abonnement");
      return;
    }
    setActionLoading(status === "suspended" ? "suspend" : "activate");
    try {
      const res = await fetch(`/api/superadmin/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success(status === "suspended" ? "Abonnement suspendu" : "Abonnement activé");
      onRefresh?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    setActionLoading("delete");
    try {
      // If subscription exists, delete via subscription (cascade). Otherwise delete tenant directly.
      const endpoint = sub
        ? `/api/superadmin/subscriptions/${sub.id}`
        : `/api/superadmin/tenants/${tenant.id}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Échec");
      }
      toast.success("Tenant supprimé avec succès");
      setDeleteOpen(false);
      onRefresh?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#338BE2]" />
            {tenant.name}
          </SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Owner Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-[#338BE2]" />
              Propriétaire
            </div>
            <div className="ml-6 space-y-1.5">
              <p className="text-sm font-medium text-foreground">{tenant.ownerName}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Mail className="h-3.5 w-3.5" />
                <a href={`mailto:${tenant.ownerEmail}`} className="hover:text-[#338BE2] hover:underline">
                  {tenant.ownerEmail}
                </a>
              </div>
              {tenant.ownerPhone && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${tenant.ownerPhone}`} className="hover:text-[#338BE2]">
                    {tenant.ownerPhone}
                  </a>
                </div>
              )}
            </div>
          </motion.div>

          <Separator />

          {/* Business Type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="h-4 w-4 text-[#338BE2]" />
              Type de commerce
            </div>
            <div className="ml-6">
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>
          </motion.div>

          {/* Businesses list */}
          {businesses.length > 0 && (
            <>
              <Separator />
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.08 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Commerces ({businesses.length})
                </div>
                <div className="ml-6 space-y-2">
                  {businesses.map((b) => (
                    <div key={b.id} className="rounded-lg border border-border p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{b.name}</p>
                        <Badge variant="outline" className="text-[9px]">
                          {TENANT_TYPE_LABELS[b.type as keyof typeof TENANT_TYPE_LABELS] ?? b.type}
                        </Badge>
                      </div>
                      {b.address && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {b.address}{b.city ? `, ${b.city}` : ""}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {b.phone && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {b.phone}
                          </span>
                        )}
                        {b.email && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {b.email}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          <Separator />

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CreditCard className="h-4 w-4 text-[#338BE2]" />
              Abonnement
            </div>
            {sub ? (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {SUBSCRIPTION_PLAN_LABELS[sub.plan]}
                  </Badge>
                  <SubscriptionStatusBadge
                    status={sub.status as SubscriptionStatus}
                  />
                  {sub.billingPeriod && (
                    <Badge variant="outline" className="text-[10px]">
                      {SUBSCRIPTION_BILLING_PERIOD_LABELS[sub.billingPeriod as SubscriptionBillingPeriod] ?? sub.billingPeriod}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatFCFA(sub.amount)}
                </p>
                <div className="text-muted-foreground text-xs space-y-0.5">
                  <p>Période se termine le {formatDate(sub.currentPeriodEnd)}</p>
                  <p>Prochaine facturation : {formatDateTime(sub.nextBillingDate)}</p>
                  {sub.paymentMethod && (
                    <p>Méthode : {sub.paymentMethod}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="ml-6 text-muted-foreground text-sm">
                Aucun abonnement actif
              </p>
            )}
          </motion.div>

          <Separator />

          {/* Users list */}
          {users.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Utilisateurs ({users.length})
                </div>
                <div className="ml-6 space-y-1.5">
                  {users.map((u) => (
                    <div key={u.id} className="rounded-lg border border-border p-2.5 text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{u.name}</p>
                        <p className="text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant="outline" className="text-[9px]">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                        <Badge
                          className={`text-[9px] ${
                            u.isActive
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-rose-100 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {u.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <Separator />
            </>
          )}

          {/* Configuration */}
          {tenant.config && (
            <>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  Configuration
                </div>
                <div className="ml-6">
                  <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                    {(() => {
                      try {
                        return JSON.stringify(JSON.parse(tenant.config), null, 2);
                      } catch {
                        return tenant.config;
                      }
                    })()}
                  </pre>
                </div>
              </motion.div>

              <Separator />
            </>
          )}

          {/* Inscrit le */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-1"
          >
            <p className="text-muted-foreground text-xs">
              Inscrit le {formatDate(tenant.createdAt)}
            </p>
          </motion.div>

          <Separator />

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="flex flex-col gap-2"
          >
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                onImpersonate(tenant.id, tenant.name);
                onOpenChange(false);
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Se connecter en tant que {tenant.name}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {sub?.status !== "suspended" ? (
                <Button
                  variant="outline"
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                  disabled={actionLoading !== null}
                  onClick={() => handleUpdateStatus("suspended")}
                >
                  {actionLoading === "suspend" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Suspendre
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  disabled={actionLoading !== null}
                  onClick={() => handleUpdateStatus("active")}
                >
                  {actionLoading === "activate" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Activer
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                disabled={actionLoading !== null}
                onClick={() => setDeleteOpen(true)}
              >
                {actionLoading === "delete" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={actionLoading !== null}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Retour
              </Button>
            </div>
          </motion.div>
        </div>
      </SheetContent>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tenant « {tenant.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le tenant, son abonnement, ses commerces et tous ses utilisateurs.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading === "delete"}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={actionLoading === "delete"}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {actionLoading === "delete" ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
