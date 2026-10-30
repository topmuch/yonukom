"use client";

import { Eye, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriptionStatusBadge } from "@/components/superadmin/subscription-status-badge";
import { TENANT_TYPE_LABELS, SUBSCRIPTION_PLAN_LABELS } from "@/types";
import type { SubscriptionStatus } from "@/types";
import { formatFCFA } from "@/lib/fcfa";
import { useIsMobile } from "@/hooks/use-mobile";

interface TenantTableProps {
  tenants: Array<{
    id: string;
    name: string;
    ownerName: string;
    ownerEmail: string;
    businessType: string;
    createdAt: string;
    subscription?: { plan: string; status: string; amount: number };
  }>;
  onViewTenant: (id: string) => void;
  onImpersonate: (tenantId: string, tenantName: string) => void;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function TenantTable({
  tenants,
  onViewTenant,
  onImpersonate,
}: TenantTableProps) {
  const isMobile = useIsMobile();

  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Aucun commerce trouvé
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {tenants.map((tenant) => {
          const typeLabel =
            TENANT_TYPE_LABELS[tenant.businessType as keyof typeof TENANT_TYPE_LABELS] ??
            tenant.businessType;

          return (
            <Card key={tenant.id}>
              <CardContent className="p-4 space-y-3">
                {/* Header: name + type */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{tenant.name}</p>
                    <p className="text-muted-foreground text-xs">{typeLabel}</p>
                  </div>
                  {tenant.subscription && (
                    <SubscriptionStatusBadge
                      status={tenant.subscription.status as SubscriptionStatus}
                    />
                  )}
                </div>

                {/* Owner info */}
                <div className="text-sm">
                  <p className="truncate">{tenant.ownerName}</p>
                  <p className="text-muted-foreground text-xs truncate">
                    {tenant.ownerEmail}
                  </p>
                </div>

                {/* Subscription plan + amount */}
                {tenant.subscription && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {SUBSCRIPTION_PLAN_LABELS[
                        tenant.subscription.plan as keyof typeof SUBSCRIPTION_PLAN_LABELS
                      ] ?? tenant.subscription.plan}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {formatFCFA(tenant.subscription.amount)}
                    </span>
                  </div>
                )}

                {/* Date */}
                <p className="text-muted-foreground text-xs">
                  Inscrit le {formatDate(tenant.createdAt)}
                </p>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewTenant(tenant.id)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onImpersonate(tenant.id, tenant.name)}
                  >
                    <LogIn className="h-3.5 w-3.5 mr-1" />
                    Se connecter
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Desktop table
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Propriétaire</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Abonnement</TableHead>
            <TableHead>Date inscription</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => {
            const typeLabel =
              TENANT_TYPE_LABELS[tenant.businessType as keyof typeof TENANT_TYPE_LABELS] ??
              tenant.businessType;

            return (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell>
                  <div>
                    <p className="truncate">{tenant.ownerName}</p>
                    <p className="text-muted-foreground text-xs truncate">
                      {tenant.ownerEmail}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{typeLabel}</span>
                </TableCell>
                <TableCell>
                  {tenant.subscription ? (
                    <div className="flex flex-col gap-1">
                      <SubscriptionStatusBadge
                        status={tenant.subscription.status as SubscriptionStatus}
                      />
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-xs">
                          {SUBSCRIPTION_PLAN_LABELS[
                            tenant.subscription.plan as keyof typeof SUBSCRIPTION_PLAN_LABELS
                          ] ?? tenant.subscription.plan}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {formatFCFA(tenant.subscription.amount)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Aucun
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(tenant.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewTenant(tenant.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onImpersonate(tenant.id, tenant.name)}
                    >
                      <LogIn className="h-4 w-4 mr-1" />
                      Se connecter
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
