// ============================================================
// YonuKom — Team Dashboard (Gestion d'équipe avancée)
// Trois onglets : Présences, Commissions, Paie.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/use-auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Users,
  Clock,
  LogIn,
  LogOut,
  Plus,
  Banknote,
  Loader2,
  CheckCircle2,
  CalendarDays,
  Coins,
} from "lucide-react";
import { formatFCFA } from "@/lib/fcfa";
import { motion } from "framer-motion";

// --- Types ---
interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
}

interface Attendance {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  workedMinutes: number;
  notes: string | null;
  user: { id: string; name: string; role: string };
}

interface Commission {
  id: string;
  type: string; // "percentage" | "fixed"
  value: number;
  amount: number;
  status: string; // "due" | "paid"
  paidAt: string | null;
  createdAt: string;
  orderId: string | null;
  user: { id: string; name: string; role: string };
  order: { id: string; orderNumber: string; totalAmount: number } | null;
}

interface PayrollEntry {
  id: string;
  type: string; // "advance" | "deduction" | "salary" | "bonus"
  amount: number;
  period: string;
  notes: string | null;
  paidAt: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

const ROLE_LABELS: Record<string, string> = {
  patron: "Patron",
  gerant: "Gérant",
  vendeur: "Vendeur",
  superadmin: "Super Admin",
};

const COMMISSION_TYPE_LABELS: Record<string, string> = {
  percentage: "Pourcentage",
  fixed: "Montant fixe",
};

const COMMISSION_STATUS_LABELS: Record<string, string> = {
  due: "Dûe",
  paid: "Payée",
};

const COMMISSION_STATUS_STYLES: Record<string, string> = {
  due: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const PAYROLL_TYPE_LABELS: Record<string, string> = {
  advance: "Avance",
  deduction: "Retenue",
  salary: "Salaire",
  bonus: "Prime",
};

const PAYROLL_TYPE_STYLES: Record<string, string> = {
  advance: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  deduction: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  salary:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  bonus: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

function formatDateTime(d: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatDate(d: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatTime(d: string | null): string {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${String(m).padStart(2, "0")}`;
}

// ============================================================
// Main Component
// ============================================================
export function TeamDashboard() {
  const user = useAuthStore((s) => s.user);
  const businessId = user?.businessId || "";
  const currentUserId = user?.id || "";

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [actioningId, setActioningId] = useState<string | null>(null);

  // Dialog states
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [payrollDialogOpen, setPayrollDialogOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // --- Fetchers ---
  const fetchMembers = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(`/api/team?businessId=${encodeURIComponent(businessId)}`);
      if (!res.ok) return;
      const data = (await res.json()) as TeamMember[];
      setMembers(data);
    } catch {
      setMembers([]);
    }
  }, [businessId]);

  const fetchAttendances = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/team/attendance?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as Attendance[];
      setAttendances(data);
    } catch {
      setAttendances([]);
    }
  }, [businessId]);

  const fetchCommissions = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/team/commissions?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as Commission[];
      setCommissions(data);
    } catch {
      setCommissions([]);
    }
  }, [businessId]);

  const fetchPayroll = useCallback(async () => {
    if (!businessId) return;
    try {
      const res = await fetch(
        `/api/team/payroll?businessId=${encodeURIComponent(businessId)}`
      );
      if (!res.ok) return;
      const data = (await res.json()) as PayrollEntry[];
      setPayrollEntries(data);
    } catch {
      setPayrollEntries([]);
    }
  }, [businessId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchMembers(),
        fetchAttendances(),
        fetchCommissions(),
        fetchPayroll(),
      ]);
      setLoading(false);
    })();
  }, [fetchMembers, fetchAttendances, fetchCommissions, fetchPayroll]);

  // --- Check-in / Check-out ---
  const handleCheckIn = async () => {
    if (!currentUserId) return;
    setActioningId("checkin");
    try {
      const res = await fetch(`/api/team/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          userId: currentUserId,
          date: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec du pointage");
      }
      toast.success("Arrivée pointée avec succès");
      await fetchAttendances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActioningId(null);
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    setActioningId(attendanceId);
    try {
      const res = await fetch(`/api/team/attendance/${attendanceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec du pointage de départ");
      }
      toast.success("Départ pointé");
      await fetchAttendances();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActioningId(null);
    }
  };

  // --- Commission actions ---
  const handleCreateCommission = async (form: {
    userId: string;
    type: "percentage" | "fixed";
    value: number;
    orderId?: string;
  }) => {
    const res = await fetch(`/api/team/commissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        userId: form.userId,
        type: form.type,
        value: form.value,
        orderId: form.orderId || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Échec de la création");
    }
    await fetchCommissions();
  };

  const handleMarkCommissionPaid = async (commissionId: string) => {
    setActioningId(commissionId);
    try {
      const res = await fetch(`/api/team/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, status: "paid" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Échec de la mise à jour");
      }
      toast.success("Commission marquée comme payée");
      await fetchCommissions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setActioningId(null);
    }
  };

  // --- Payroll actions ---
  const handleCreatePayroll = async (form: {
    userId: string;
    type: "advance" | "deduction" | "salary" | "bonus";
    amount: number;
    period: string;
    notes?: string;
  }) => {
    const res = await fetch(`/api/team/payroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        userId: form.userId,
        type: form.type,
        amount: form.amount,
        period: form.period,
        notes: form.notes,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Échec de la création");
    }
    await fetchPayroll();
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  // Trouver l'attendance ouverte aujourd'hui pour l'utilisateur courant
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const myOpenAttendance = attendances.find(
    (a) =>
      a.user.id === currentUserId &&
      new Date(a.date) >= todayStart &&
      new Date(a.date) <= todayEnd &&
      a.checkInTime &&
      !a.checkOutTime
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Gestion d'équipe</h2>
        </div>
        {businessId && (
          <Button onClick={() => setAddMemberOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ajouter un membre</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        )}
      </motion.div>

      {!businessId ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Connectez-vous pour gérer votre équipe.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="attendance" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Présences</span>
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-1.5 text-xs sm:text-sm">
              <Coins className="w-4 h-4" />
              <span className="hidden sm:inline">Commissions</span>
            </TabsTrigger>
            <TabsTrigger value="payroll" className="gap-1.5 text-xs sm:text-sm">
              <Banknote className="w-4 h-4" />
              <span className="hidden sm:inline">Paie</span>
            </TabsTrigger>
          </TabsList>

          {/* === ATTENDANCE TAB === */}
          <TabsContent value="attendance" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Mon pointage du jour</div>
                  <p className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("fr-FR", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }).format(new Date())}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCheckIn}
                    disabled={actioningId === "checkin" || !!myOpenAttendance}
                    variant="default"
                  >
                    {actioningId === "checkin" ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Pointer arrivée
                  </Button>
                  <Button
                    onClick={() =>
                      myOpenAttendance && handleCheckOut(myOpenAttendance.id)
                    }
                    disabled={!myOpenAttendance || actioningId === myOpenAttendance?.id}
                    variant="outline"
                  >
                    {actioningId === myOpenAttendance?.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogOut className="w-4 h-4 mr-2" />
                    )}
                    Pointer départ
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {attendances.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="text-4xl">🕐</div>
                    <h3 className="font-semibold">Aucun pointage enregistré</h3>
                    <p className="text-sm text-muted-foreground">
                      Cliquez sur « Pointer arrivée » pour commencer la journée.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employé</TableHead>
                        <TableHead className="text-center">Arrivée</TableHead>
                        <TableHead className="text-center">Départ</TableHead>
                        <TableHead className="text-right">Durée</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendances.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(a.date)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-medium">
                                  {a.user.name}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {ROLE_LABELS[a.user.role] || a.user.role}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">
                            {formatTime(a.checkInTime)}
                          </TableCell>
                          <TableCell className="text-center text-xs font-mono">
                            {formatTime(a.checkOutTime)}
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">
                            {a.checkOutTime ? (
                              formatDuration(a.workedMinutes)
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              >
                                En cours
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === COMMISSIONS TAB === */}
          <TabsContent value="commissions" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setCommissionDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle commission
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {commissions.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="text-4xl">💰</div>
                    <h3 className="font-semibold">Aucune commission</h3>
                    <p className="text-sm text-muted-foreground">
                      Créez des commissions pour récompenser vos vendeurs.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employé</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Type
                        </TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-center">Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(c.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {c.user.name}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex flex-col">
                              <Badge
                                variant="secondary"
                                className="text-[10px] w-fit"
                              >
                                {COMMISSION_TYPE_LABELS[c.type] || c.type}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                {c.type === "percentage"
                                  ? `${c.value}%`
                                  : formatFCFA(c.value)}
                                {c.order
                                  ? ` · ${c.order.orderNumber}`
                                  : ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold">
                            {formatFCFA(c.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${COMMISSION_STATUS_STYLES[c.status] || ""}`}
                            >
                              {COMMISSION_STATUS_LABELS[c.status] || c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {c.status === "due" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkCommissionPaid(c.id)}
                                disabled={actioningId === c.id}
                                title="Marquer comme payée"
                              >
                                {actioningId === c.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PAYROLL TAB === */}
          <TabsContent value="payroll" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button onClick={() => setPayrollDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle entrée
              </Button>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {payrollEntries.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <div className="text-4xl">🧾</div>
                    <h3 className="font-semibold">Aucune entrée de paie</h3>
                    <p className="text-sm text-muted-foreground">
                      Enregistrez les avances, salaires, primes et retenues de
                      votre équipe.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employé</TableHead>
                        <TableHead className="text-center">Type</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-center hidden md:table-cell">
                          Période
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Notes
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payrollEntries.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(p.createdAt)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {p.user.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${PAYROLL_TYPE_STYLES[p.type] || ""}`}
                            >
                              {PAYROLL_TYPE_LABELS[p.type] || p.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-bold">
                            {formatFCFA(p.amount)}
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell text-xs font-mono">
                            {p.period}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px] truncate">
                            {p.notes || "—"}
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

      {/* === Commission Dialog === */}
      <CommissionDialog
        open={commissionDialogOpen}
        onOpenChange={setCommissionDialogOpen}
        members={members}
        onSave={async (form) => {
          try {
            await handleCreateCommission(form);
            toast.success("Commission créée avec succès");
            setCommissionDialogOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      />

      {/* === Payroll Dialog === */}
      <PayrollDialog
        open={payrollDialogOpen}
        onOpenChange={setPayrollDialogOpen}
        members={members}
        onSave={async (form) => {
          try {
            await handleCreatePayroll(form);
            toast.success("Entrée de paie créée");
            setPayrollDialogOpen(false);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erreur");
          }
        }}
      />

      {/* === Add Member Dialog === */}
      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        businessId={businessId}
        onCreated={() => {
          fetchMembers();
        }}
      />
    </div>
  );
}

// ============================================================
// Commission Dialog
// ============================================================
function CommissionDialog({
  open,
  onOpenChange,
  members,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: TeamMember[];
  onSave: (form: {
    userId: string;
    type: "percentage" | "fixed";
    value: number;
    orderId?: string;
  }) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [orderId, setOrderId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setUserId("");
      setType("percentage");
      setValue("");
      setOrderId("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Sélectionnez un employé");
      return;
    }
    const numValue = Number(value);
    if (!Number.isFinite(numValue) || numValue <= 0) {
      toast.error("Veuillez saisir une valeur positive");
      return;
    }
    if (type === "percentage" && !orderId) {
      toast.error("Une commande est requise pour une commission en pourcentage");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        userId,
        type,
        value: numValue,
        orderId: orderId || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle commission</DialogTitle>
          <DialogDescription>
            Récompensez un employé suite à une vente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="c-user">Employé</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="c-user">
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({ROLE_LABELS[m.role] || m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="c-type">Type de commission</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "percentage" | "fixed")}
            >
              <SelectTrigger id="c-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">
                  Pourcentage (sur vente)
                </SelectItem>
                <SelectItem value="fixed">Montant fixe (FCFA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="c-value">
              {type === "percentage"
                ? "Pourcentage (%)"
                : "Montant (FCFA)"}
            </Label>
            <Input
              id="c-value"
              type="number"
              min="0"
              step={type === "percentage" ? "0.5" : "100"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === "percentage" ? "Ex: 5" : "Ex: 5000"}
            />
          </div>
          {type === "percentage" && (
            <div>
              <Label htmlFor="c-order">Commande associée</Label>
              <Input
                id="c-order"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="ID de la commande (YK-YYYY-NNNN)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Saisissez l'identifiant de la commande pour calculer le montant
                automatiquement.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer la commission
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Payroll Dialog
// ============================================================
function PayrollDialog({
  open,
  onOpenChange,
  members,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  members: TeamMember[];
  onSave: (form: {
    userId: string;
    type: "advance" | "deduction" | "salary" | "bonus";
    amount: number;
    period: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");
  const [type, setType] = useState<"advance" | "deduction" | "salary" | "bonus">(
    "advance"
  );
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setUserId("");
      setType("advance");
      setAmount("");
      setPeriod(new Date().toISOString().slice(0, 7));
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Sélectionnez un employé");
      return;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        userId,
        type,
        amount: numAmount,
        period,
        notes: notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Nouvelle entrée de paie
          </DialogTitle>
          <DialogDescription>
            Avance, retenue, salaire ou prime pour un employé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="p-user">Employé</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="p-user">
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({ROLE_LABELS[m.role] || m.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="p-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) =>
                setType(v as "advance" | "deduction" | "salary" | "bonus")
              }
            >
              <SelectTrigger id="p-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advance">Avance</SelectItem>
                <SelectItem value="deduction">Retenue</SelectItem>
                <SelectItem value="salary">Salaire</SelectItem>
                <SelectItem value="bonus">Prime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p-amount">Montant (FCFA)</Label>
              <Input
                id="p-amount"
                type="number"
                min="0"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 25000"
              />
            </div>
            <div>
              <Label htmlFor="p-period">Période</Label>
              <Input
                id="p-period"
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="p-notes">Notes (optionnel)</Label>
            <Textarea
              id="p-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Motif, modalités..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Créer l'entrée
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Add Member Dialog — Ajouter un membre à l'équipe (vendeur/gérant)
// ============================================================
interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  onCreated: () => void;
}

function AddMemberDialog({ open, onOpenChange, businessId, onCreated }: AddMemberDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"vendeur" | "gerant">("vendeur");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset form quand on ferme
  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setPhone("");
      setRole("vendeur");
      setPassword("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !name.trim() || !email.trim() || !password) return;
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("yonukom_token") : null;
      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          businessId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
          password,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de la création");
      }
      toast.success(`${role === "gerant" ? "Gérant" : "Vendeur"} ajouté à l'équipe`);
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un membre à l&apos;équipe</DialogTitle>
          <DialogDescription>
            Créez un compte vendeur ou gérant. Il pourra se connecter avec cet
            email et ce mot de passe.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Nom complet *</Label>
            <Input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Awa Diop"
              required
              autoFocus
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-email">Email *</Label>
            <Input
              id="m-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="awa.diop@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-phone">Téléphone (WhatsApp)</Label>
            <Input
              id="m-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="78 382 18 22"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-role">Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "vendeur" | "gerant")}>
              <SelectTrigger id="m-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vendeur">Vendeur (vente uniquement)</SelectItem>
                <SelectItem value="gerant">Gérant (stock + caisse)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Le gérant peut gérer le stock et la caisse. Le vendeur ne fait que
              des ventes.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-pass">Mot de passe temporaire *</Label>
            <Input
              id="m-pass"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 caractères"
              required
              minLength={6}
            />
            <p className="text-[10px] text-muted-foreground">
              Le membre pourra le changer après sa première connexion.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !name.trim() || !email.trim() || !password}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le compte"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
