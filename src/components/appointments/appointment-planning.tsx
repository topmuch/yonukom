"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Plus,
  Phone,
  Check,
  X,
  Loader2,
  CalendarPlus,
  User,
  Scissors,
} from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";
import { ConnectivityBanner } from "@/components/layout/connectivity-banner";
import { formatFCFA } from "@/lib/fcfa";
import { toast } from "sonner";

// ============================================================
// YonuKom — Planning / Rendez-vous (salons, instituts)
// Onglet "RDV" du dashboard — visible si config.appointments
// ============================================================

interface ServiceItem {
  id: string;
  name: string;
  salePrice: number;
  duration: number | null;
  imageUrl?: string | null;
}

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string | null;
  serviceName: string;
  serviceId: string | null;
  durationMin: number;
  startTime: string;
  status: string;
  notes: string | null;
  service?: { id: string; name: string; salePrice: number; duration: number | null; imageUrl: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-300" },
  confirmed: { label: "Confirmé", className: "bg-pink-100 text-pink-700 border-pink-300" },
  completed: { label: "Terminé", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  cancelled: { label: "Annulé", className: "bg-rose-100 text-rose-700 border-rose-300" },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

function isToday(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}
function isTomorrow(iso: string) {
  const d = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

export function AppointmentPlanning() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form state
  const [formService, setFormService] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAppointments = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      // Récupère les RDV à partir d'aujourd'hui + 30 jours
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const to = new Date(now.getTime() + 30 * 86400000).toISOString();
      const res = await fetch(
        `/api/appointments?businessId=${encodeURIComponent(businessId)}&from=${from}&to=${to}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const fetchServices = useCallback(async () => {
    if (!businessId) return;
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/products?businessId=${encodeURIComponent(businessId)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Filtrer uniquement les services (itemType=SERVICE)
        const allProducts = data.products || [];
        setServices(allProducts.filter((p: any) => p.itemType === "SERVICE"));
      }
    } catch {
      /* ignore */
    }
  }, [businessId]);

  useEffect(() => {
    fetchAppointments();
    fetchServices();
  }, [fetchAppointments, fetchServices]);

  const openDialog = () => {
    setFormService("");
    setFormName("");
    setFormPhone("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormTime("10:00");
    setFormNotes("");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !formName.trim() || !formDate || !formTime) {
      toast.error("Nom, date et heure sont requis");
      return;
    }
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const startTime = new Date(`${formDate}T${formTime}:00`).toISOString();
      const selectedService = services.find((s) => s.id === formService);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          customerName: formName.trim(),
          customerPhone: formPhone.trim() || undefined,
          serviceId: formService || undefined,
          serviceName: selectedService?.name,
          durationMin: selectedService?.duration || 30,
          startTime,
          notes: formNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Échec");
      }
      toast.success("Rendez-vous créé");
      setDialogOpen(false);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    if (!businessId) return;
    setActionLoading(id + status);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ businessId, status }),
      });
      if (!res.ok) throw new Error("Échec");
      toast.success(
        status === "confirmed" ? "RDV confirmé" :
        status === "completed" ? "RDV terminé" :
        status === "cancelled" ? "RDV annulé" : "Statut mis à jour"
      );
      fetchAppointments();
    } catch {
      toast.error("Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const selectedService = services.find((s) => s.id === formService);

  // Grouper par jour
  const grouped = appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
    const day = new Date(appt.startTime).toDateString();
    (acc[day] = acc[day] || []).push(appt);
    return acc;
  }, {});
  const dayKeys = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="px-4 py-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Chargement du planning…</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <ConnectivityBanner />

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Planning & Rendez-vous
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Gérez les RDV clients pour vos services (coiffure, soins…).
          </p>
        </div>
        <Button onClick={openDialog} className="gap-1.5 shrink-0">
          <CalendarPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Nouveau RDV</span>
          <span className="sm:hidden">RDV</span>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-sm mb-1">Aucun rendez-vous</p>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
              Planifiez votre première prestation. Sélectionnez un service, un client et un créneau.
            </p>
            <Button onClick={openDialog} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Créer un rendez-vous
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {dayKeys.map((dayKey) => {
            const dayAppts = grouped[dayKey];
            const d = new Date(dayKey);
            const label = isToday(dayAppts[0].startTime)
              ? "Aujourd'hui"
              : isTomorrow(dayAppts[0].startTime)
              ? "Demain"
              : d.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
            return (
              <div key={dayKey}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {label}
                  <span className="text-[10px] normal-case">({dayAppts.length})</span>
                </h3>
                <div className="space-y-2">
                  {dayAppts.map((appt, idx) => {
                    const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
                    const { time } = formatDateTime(appt.startTime);
                    const endTime = new Date(new Date(appt.startTime).getTime() + appt.durationMin * 60000);
                    return (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <Card className={appt.status === "cancelled" ? "opacity-60" : ""}>
                          <CardContent className="p-3 flex items-center gap-3">
                            {/* Heure */}
                            <div className="flex flex-col items-center justify-center shrink-0 w-14">
                              <span className="text-sm font-bold text-primary">{time}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm truncate">{appt.customerName}</p>
                                <Badge variant="outline" className={`text-[9px] ${sc.className}`}>
                                  {sc.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Scissors className="w-3 h-3" />
                                  {appt.serviceName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {appt.durationMin} min
                                </span>
                                {appt.customerPhone && (
                                  <a href={`tel:${appt.customerPhone}`} className="flex items-center gap-1 hover:text-primary">
                                    <Phone className="w-3 h-3" />
                                    {appt.customerPhone}
                                  </a>
                                )}
                              </div>
                              {appt.notes && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 italic truncate">
                                  « {appt.notes} »
                                </p>
                              )}
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {appt.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs gap-1"
                                  onClick={() => handleStatusChange(appt.id, "confirmed")}
                                  disabled={actionLoading === appt.id + "confirmed"}
                                >
                                  {actionLoading === appt.id + "confirmed" ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  Confirmer
                                </Button>
                              )}
                              {(appt.status === "pending" || appt.status === "confirmed") && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                    onClick={() => handleStatusChange(appt.id, "completed")}
                                    disabled={actionLoading === appt.id + "completed"}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs gap-1 text-rose-600 border-rose-300 hover:bg-rose-50"
                                    onClick={() => handleStatusChange(appt.id, "cancelled")}
                                    disabled={actionLoading === appt.id + "cancelled"}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog Nouveau RDV */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-4 h-4 text-primary" />
              Nouveau rendez-vous
            </DialogTitle>
            <DialogDescription>Planifiez une prestation pour un client.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Service</Label>
              {services.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Aucun service créé. Créez-en un dans l&apos;onglet Produits (toggle Service).
                </p>
              ) : (
                <select
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">— Sélectionner un service —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatFCFA(s.salePrice)}{s.duration ? ` · ${s.duration} min` : ""}
                    </option>
                  ))}
                </select>
              )}
              {selectedService && (
                <p className="text-[10px] text-muted-foreground">
                  Durée auto : {selectedService.duration || 30} min · Prix : {formatFCFA(selectedService.salePrice)}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rdv-name">Nom du client *</Label>
                <Input id="rdv-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Awa Diop" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rdv-phone">Téléphone</Label>
                <Input id="rdv-phone" type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="78 382 18 22" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rdv-date">Date *</Label>
                <Input id="rdv-date" type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rdv-time">Heure *</Label>
                <Input id="rdv-time" type="time" value={formTime} onChange={(e) => setFormTime(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rdv-notes">Notes</Label>
              <Textarea id="rdv-notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Préférences, indications…" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
              <Button type="submit" disabled={saving || !formName.trim() || !formDate || !formTime}>
                {saving ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Création…</> : <><CalendarPlus className="w-4 h-4 mr-1" />Planifier</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
