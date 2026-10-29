// ============================================================
// YonuKom — Notifications Settings (WhatsApp métier)
// Carte de paramètres + historique des notifications envoyées.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Bell,
  ExternalLink,
  Save,
  Loader2,
  MessageCircle,
  Clock,
  AlertTriangle,
  Receipt,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";

// --- Types ---
interface NotificationSettings {
  id: string;
  businessId: string;
  enableSaleReceipt: boolean;
  enableDebtReminders: boolean;
  debtReminderDays: number;
  enableStockAlerts: boolean;
  stockAlertThreshold: number;
  enableDailySummary: boolean;
  dailySummaryTime: string;
  ownerPhone: string | null;
}

interface NotificationLog {
  id: string;
  recipient: string;
  type: string;
  message: string;
  channel: string;
  status: string;
  waMeUrl: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  sale_receipt: "Reçu de vente",
  debt_reminder: "Relance dette",
  stock_alert: "Alerte stock",
  daily_summary: "Récap quotidien",
  custom: "Message libre",
};

const TYPE_STYLES: Record<string, string> = {
  sale_receipt:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  debt_reminder:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  stock_alert:
    "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  daily_summary:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  custom: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const STATUS_STYLES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  clicked: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

function formatDateTime(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function truncate(str: string, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ============================================================
// Main Component
// ============================================================
export function NotificationsSettings() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (local copy)
  const [form, setForm] = useState<NotificationSettings | null>(null);

  // --- Fetch settings ---
  const fetchSettings = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/notifications/settings?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as NotificationSettings;
      setSettings(data);
      setForm(data);
    } catch {
      setSettings(null);
      setForm(null);
    }
  }, [businessId]);

  // --- Fetch logs ---
  const fetchLogs = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/notifications/logs?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) {
        setLogs([]);
        return;
      }
      const data = (await res.json()) as NotificationLog[];
      setLogs(data);
    } catch {
      setLogs([]);
    }
  }, [businessId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchLogs()]);
      setLoading(false);
    })();
  }, [fetchSettings, fetchLogs]);

  // --- Save settings ---
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notifications/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, businessId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de l'enregistrement");
      }
      const updated = (await res.json()) as NotificationSettings;
      setSettings(updated);
      setForm(updated);
      toast.success("Paramètres enregistrés");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  // --- Update form field ---
  const updateForm = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // --- Open WhatsApp link ---
  const handleOpenWhatsApp = (url: string | null) => {
    if (!url) {
      toast.error("Lien WhatsApp indisponible");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
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
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Notifications WhatsApp métier</h2>
      </motion.div>

      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour configurer vos notifications.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* === SETTINGS CARD === */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                Paramètres des notifications
              </CardTitle>
              <CardDescription>
                Configurez les messages WhatsApp envoyés automatiquement à vos
                clients et au patron.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {form ? (
                <>
                  {/* Sale Receipt */}
                  <div className="flex items-start justify-between gap-4 p-3 rounded-md border">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/50">
                        <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <Label className="font-medium cursor-pointer">
                          Reçu de vente
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Envoyer un reçu WhatsApp à chaque vente terminée.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={form.enableSaleReceipt}
                      onCheckedChange={(v) => updateForm("enableSaleReceipt", v)}
                    />
                  </div>

                  {/* Debt Reminders */}
                  <div className="space-y-3 p-3 rounded-md border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-md bg-amber-50 dark:bg-amber-950/50">
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <Label className="font-medium cursor-pointer">
                            Rappels de dette
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Relancer automatiquement les clients en retard de
                            paiement.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={form.enableDebtReminders}
                        onCheckedChange={(v) =>
                          updateForm("enableDebtReminders", v)
                        }
                      />
                    </div>
                    {form.enableDebtReminders && (
                      <div className="ml-11 flex items-center gap-2 text-sm">
                        <Label
                          htmlFor="debt-days"
                          className="text-xs text-muted-foreground whitespace-nowrap"
                        >
                          Après
                        </Label>
                        <Input
                          id="debt-days"
                          type="number"
                          min="1"
                          max="90"
                          value={form.debtReminderDays}
                          onChange={(e) =>
                            updateForm(
                              "debtReminderDays",
                              Number(e.target.value) || 7
                            )
                          }
                          className="w-20 h-8"
                        />
                        <span className="text-xs text-muted-foreground">
                          jours d'impayé
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock Alerts */}
                  <div className="space-y-3 p-3 rounded-md border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-md bg-rose-50 dark:bg-rose-950/50">
                          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <Label className="font-medium cursor-pointer">
                            Alertes de rupture de stock
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Recevoir une alerte WhatsApp quand un produit passe
                            sous le seuil.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={form.enableStockAlerts}
                        onCheckedChange={(v) =>
                          updateForm("enableStockAlerts", v)
                        }
                      />
                    </div>
                    {form.enableStockAlerts && (
                      <div className="ml-11 flex items-center gap-2 text-sm">
                        <Label
                          htmlFor="stock-thresh"
                          className="text-xs text-muted-foreground whitespace-nowrap"
                        >
                          Seuil global
                        </Label>
                        <Input
                          id="stock-thresh"
                          type="number"
                          min="0"
                          value={form.stockAlertThreshold}
                          onChange={(e) =>
                            updateForm(
                              "stockAlertThreshold",
                              Number(e.target.value) || 5
                            )
                          }
                          className="w-20 h-8"
                        />
                        <span className="text-xs text-muted-foreground">
                          unités
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Daily Summary */}
                  <div className="space-y-3 p-3 rounded-md border">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50">
                          <BarChart3 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                        </div>
                        <div>
                          <Label className="font-medium cursor-pointer">
                            Récap quotidien
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Recevoir un récapitulatif journalier des ventes sur
                            WhatsApp.
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={form.enableDailySummary}
                        onCheckedChange={(v) =>
                          updateForm("enableDailySummary", v)
                        }
                      />
                    </div>
                    {form.enableDailySummary && (
                      <div className="ml-11 flex items-center gap-2 text-sm">
                        <Label
                          htmlFor="summary-time"
                          className="text-xs text-muted-foreground whitespace-nowrap"
                        >
                          Heure d'envoi
                        </Label>
                        <Input
                          id="summary-time"
                          type="time"
                          value={form.dailySummaryTime}
                          onChange={(e) =>
                            updateForm("dailySummaryTime", e.target.value)
                          }
                          className="w-28 h-8"
                        />
                      </div>
                    )}
                  </div>

                  {/* Owner Phone */}
                  <div className="p-3 rounded-md border bg-muted/30">
                    <Label htmlFor="owner-phone" className="font-medium">
                      Numéro WhatsApp du patron
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Recevra les alertes (stock, récap quotidien).
                    </p>
                    <Input
                      id="owner-phone"
                      type="tel"
                      value={form.ownerPhone || ""}
                      onChange={(e) =>
                        updateForm("ownerPhone", e.target.value)
                      }
                      placeholder="77 123 45 67"
                      className="max-w-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Enregistrer
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Impossible de charger les paramètres.
                </p>
              )}
            </CardContent>
          </Card>

          {/* === HISTORY CARD === */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base">
                Historique des notifications
              </CardTitle>
              <CardDescription>
                Les 50 dernières notifications WhatsApp générées.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <div className="text-4xl">📭</div>
                  <h3 className="font-semibold">Aucune notification envoyée</h3>
                  <p className="text-sm text-muted-foreground">
                    Les notifications générées apparaîtront ici.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Destinataire
                      </TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead className="text-center">Statut</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${TYPE_STYLES[log.type] || ""}`}
                          >
                            {TYPE_LABELS[log.type] || log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs font-mono">
                          {log.recipient}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs">
                          {truncate(log.message, 60)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${STATUS_STYLES[log.status] || ""}`}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenWhatsApp(log.waMeUrl)}
                            title="Ouvrir WhatsApp"
                            disabled={!log.waMeUrl}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
