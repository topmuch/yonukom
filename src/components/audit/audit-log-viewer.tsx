// ============================================================
// YonuKom — Audit Log Viewer
// Immutable audit trail for Patron/Gérant
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Eye,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  DollarSign,
  UserCog,
  LogIn,
  LogOut,
  Package,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: string | null;
  userId: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  businessId: string;
  createdAt: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sale_created: { label: "Vente créée", icon: DollarSign, color: "text-yk-emerald" },
  sale_cancelled: { label: "Vente annulée", icon: Trash2, color: "text-destructive" },
  stock_adjustment: { label: "Ajustement stock", icon: Pencil, color: "text-yk-amber" },
  stock_loss: { label: "Perte stock", icon: AlertTriangle, color: "text-yk-amber" },
  cash_open: { label: "Caisse ouverte", icon: Unlock, color: "text-yk-emerald" },
  cash_close: { label: "Caisse fermée", icon: Lock, color: "text-primary" },
  payment_received: { label: "Paiement reçu", icon: DollarSign, color: "text-yk-emerald" },
  role_change: { label: "Changement rôle", icon: UserCog, color: "text-yk-amber" },
  login: { label: "Connexion", icon: LogIn, color: "text-yk-emerald" },
  login_failed: { label: "Échec connexion", icon: LogOut, color: "text-destructive" },
  price_change: { label: "Modification prix", icon: Pencil, color: "text-yk-amber" },
  product_created: { label: "Produit créé", icon: Package, color: "text-yk-emerald" },
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>("all");

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        businessId: "demo",
        limit: "50",
      });
      if (entityFilter !== "all") {
        params.set("entityType", entityFilter);
      }

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        // Si aucune donnée en DB, utiliser les données mock
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
          setTotal(data.total || 0);
        } else {
          const mockLogs = getMockLogs();
          setLogs(mockLogs);
          setTotal(mockLogs.length);
        }
      } else {
        setLogs(getMockLogs());
        setTotal(getMockLogs().length);
      }
    } catch {
      // Show mock data for demo
      setLogs(getMockLogs());
      setTotal(getMockLogs().length);
    } finally {
      setLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
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
          <Shield className="w-5 h-5 text-primary" />
          Journal d&apos;audit
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {total} entrées
          </Badge>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout</SelectItem>
              <SelectItem value="order">Commandes</SelectItem>
              <SelectItem value="product">Produits</SelectItem>
              <SelectItem value="user">Utilisateurs</SelectItem>
              <SelectItem value="payment">Paiements</SelectItem>
              <SelectItem value="cash_session">Caisse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Log entries */}
      {logs.length > 0 ? (
        <ScrollArea className="max-h-[500px]">
          <div className="space-y-2">
            {logs.map((log, i) => {
              const config = ACTION_CONFIG[log.action] || {
                label: log.action,
                icon: Eye,
                color: "text-muted-foreground",
              };
              const Icon = config.icon;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md bg-muted ${config.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-semibold ${config.color}`}>
                              {config.label}
                            </span>
                            {log.entityType && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0">
                                {log.entityType}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>
                              {new Date(log.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              {new Date(log.createdAt).toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </span>
                            {log.user && (
                              <>
                                <span>•</span>
                                <span className="font-medium">{log.user.name}</span>
                                <Badge variant="outline" className="text-[8px] px-1 py-0">
                                  {log.user.role}
                                </Badge>
                              </>
                            )}
                          </div>
                          {log.details && (
                            <p className="text-[10px] text-muted-foreground mt-1 truncate">
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(log.details));
                                } catch {
                                  return log.details;
                                }
                              })()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Aucune entrée d&apos;audit pour cette période
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mock audit logs for demo
function getMockLogs(): AuditLogEntry[] {
  const now = new Date();
  return [
    {
      id: "al-1",
      action: "cash_open",
      entityType: "cash_session",
      entityId: "cs-1",
      details: null,
      userId: "u-1",
      user: { id: "u-1", name: "Mamadou Diallo", email: "mamadou@yonukom.sn", role: "gerant" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 8).toISOString(),
    },
    {
      id: "al-2",
      action: "sale_created",
      entityType: "order",
      entityId: "o-1",
      details: '{"orderNumber":"YK-2025-0001","amount":15000}',
      userId: "u-2",
      user: { id: "u-2", name: "Fatou Sow", email: "fatou@yonukom.sn", role: "vendeur" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 7.5).toISOString(),
    },
    {
      id: "al-3",
      action: "payment_received",
      entityType: "payment",
      entityId: "p-1",
      details: '{"method":"wave","amount":15000}',
      userId: "u-2",
      user: { id: "u-2", name: "Fatou Sow", email: "fatou@yonukom.sn", role: "vendeur" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 7).toISOString(),
    },
    {
      id: "al-4",
      action: "sale_created",
      entityType: "order",
      entityId: "o-2",
      details: '{"orderNumber":"YK-2025-0002","amount":45000}',
      userId: "u-2",
      user: { id: "u-2", name: "Fatou Sow", email: "fatou@yonukom.sn", role: "vendeur" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 6).toISOString(),
    },
    {
      id: "al-5",
      action: "stock_loss",
      entityType: "product",
      entityId: "pr-1",
      details: '{"product":"Thiébou Rouge","quantity":2,"reason":"Brûlé"}',
      userId: "u-1",
      user: { id: "u-1", name: "Mamadou Diallo", email: "mamadou@yonukom.sn", role: "gerant" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
    },
    {
      id: "al-6",
      action: "sale_cancelled",
      entityType: "order",
      entityId: "o-3",
      details: '{"orderNumber":"YK-2025-0003","reason":"Client absent","amount":25000}',
      userId: "u-2",
      user: { id: "u-2", name: "Fatou Sow", email: "fatou@yonukom.sn", role: "vendeur" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 4).toISOString(),
    },
    {
      id: "al-7",
      action: "price_change",
      entityType: "product",
      entityId: "pr-2",
      details: '{"product":"Riz 25kg","oldPrice":7000,"newPrice":7500}',
      userId: "u-3",
      user: { id: "u-3", name: "Ibrahima Fall", email: "ibrahima@yonukom.sn", role: "patron" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 3).toISOString(),
    },
    {
      id: "al-8",
      action: "login",
      entityType: "user",
      entityId: "u-1",
      details: null,
      userId: "u-1",
      user: { id: "u-1", name: "Mamadou Diallo", email: "mamadou@yonukom.sn", role: "gerant" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
    },
    {
      id: "al-9",
      action: "login_failed",
      entityType: "user",
      entityId: null,
      details: '{"email":"unknown@test.com","reason":"user_not_found"}',
      userId: null,
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 1.5).toISOString(),
    },
    {
      id: "al-10",
      action: "cash_close",
      entityType: "cash_session",
      entityId: "cs-1",
      details: '{"theoreticalTotal":185000,"declaredTotal":183000,"difference":-2000}',
      userId: "u-1",
      user: { id: "u-1", name: "Mamadou Diallo", email: "mamadou@yonukom.sn", role: "gerant" },
      businessId: "demo",
      createdAt: new Date(now.getTime() - 3600000 * 0.5).toISOString(),
    },
  ];
}
