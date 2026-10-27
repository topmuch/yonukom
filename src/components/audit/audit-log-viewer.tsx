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
import { useAuthStore } from "@/stores/use-auth-store";

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
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const fetchLogs = useCallback(async () => {
    // Pas de businessId valide → liste vide (pas de données démo).
    if (!businessId || businessId === "demo") {
      setLogs([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    try {
      const params = new URLSearchParams({
        businessId,
        limit: "50",
      });
      if (entityFilter !== "all") {
        params.set("entityType", entityFilter);
      }

      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      } else {
        setLogs([]);
        setTotal(0);
      }
    } catch {
      // Erreur réseau — on reste en état vide.
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [businessId, entityFilter]);

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
          <CardContent className="p-6 text-center space-y-2">
            <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">
              Aucun log d&apos;audit
            </p>
            <p className="text-xs text-muted-foreground">
              Les actions sensibles (caisse, ventes, modifications) seront journalisées ici.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
