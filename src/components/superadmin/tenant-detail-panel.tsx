"use client";

import { motion } from "framer-motion";
import { LogIn, ArrowLeft, Mail, Phone, Building2, Settings, CreditCard, Users } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import {
  TENANT_TYPE_LABELS,
  SUBSCRIPTION_PLAN_LABELS,
} from "@/types";
import type { TenantInfo, SubscriptionStatus } from "@/types";
import { formatFCFA } from "@/lib/fcfa";

interface TenantDetailPanelProps {
  tenant: TenantInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImpersonate: (tenantId: string, tenantName: string) => void;
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

function formatConfig(configStr?: string): string {
  if (!configStr) return "Aucune configuration";
  try {
    const parsed = JSON.parse(configStr);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return configStr;
  }
}

export function TenantDetailPanel({
  tenant,
  open,
  onOpenChange,
  onImpersonate,
}: TenantDetailPanelProps) {
  if (!tenant) return null;

  const typeLabel =
    TENANT_TYPE_LABELS[tenant.businessType] ?? tenant.businessType;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{tenant.name}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6">
          {/* Owner Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-emerald-600" />
              Propriétaire
            </div>
            <div className="ml-6 space-y-1.5">
              <p className="text-sm font-medium">{tenant.ownerName}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>{tenant.ownerEmail}</span>
              </div>
              {tenant.ownerPhone && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{tenant.ownerPhone}</span>
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
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Type de commerce
            </div>
            <div className="ml-6">
              <Badge variant="secondary">{typeLabel}</Badge>
            </div>
          </motion.div>

          <Separator />

          {/* Configuration */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Settings className="h-4 w-4 text-emerald-600" />
              Configuration
            </div>
            <div className="ml-6">
              <pre className="bg-muted rounded-md p-3 text-xs overflow-x-auto max-h-40 overflow-y-auto whitespace-pre-wrap break-all">
                {formatConfig(tenant.config)}
              </pre>
            </div>
          </motion.div>

          <Separator />

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Abonnement
            </div>
            {tenant.subscription ? (
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">
                    {SUBSCRIPTION_PLAN_LABELS[tenant.subscription.plan]}
                  </Badge>
                  <SubscriptionStatusBadge
                    status={tenant.subscription.status as SubscriptionStatus}
                  />
                </div>
                <p className="text-sm font-medium">
                  {formatFCFA(tenant.subscription.amount)}
                </p>
                <p className="text-muted-foreground text-xs">
                  Période se termine le{" "}
                  {formatDate(tenant.subscription.currentPeriodEnd)}
                </p>
              </div>
            ) : (
              <p className="ml-6 text-muted-foreground text-sm">
                Aucun abonnement actif
              </p>
            )}
          </motion.div>

          <Separator />

          {/* Inscrit le */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="space-y-1"
          >
            <p className="text-muted-foreground text-xs">
              Inscrit le {formatDate(tenant.createdAt)}
            </p>
          </motion.div>

          <Separator />

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
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
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
