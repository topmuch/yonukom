// ============================================================
// YonuKom — Login Screen
// Simple login form with email + password
// Demo mode: quick role selection for testing
// ============================================================

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Landmark, Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/use-auth-store";
import { useConfigStore } from "@/stores/use-config-store";
import type { UserRole } from "@/types";
import { ROLE_LABELS } from "@/types";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  successMessage?: string | null;
}

export function LoginScreen({ onLoginSuccess, successMessage }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(successMessage ?? null);
  const [mode, setMode] = useState<"login" | "demo">("login");

  const login = useAuthStore((s) => s.login);
  const loadConfig = useConfigStore((s) => s.loadConfig);

  // Demo login (quick role selection)
  const handleDemoLogin = async (role: UserRole) => {
    const roleUsers: Record<UserRole, { name: string; email: string; password: string }> = {
      superadmin: { name: "Admin YonuKom", email: "admin@yonukom.sn", password: "yonukom123" },
      patron: { name: "Ibrahima Fall", email: "ibrahima@yonukom.sn", password: "yonukom123" },
      gerant: { name: "Mamadou Diallo", email: "mamadou@yonukom.sn", password: "yonukom123" },
      vendeur: { name: "Fatou Sow", email: "fatou@yonukom.sn", password: "yonukom123" },
    };

    // Try to login via the real API (so the JWT cookie is set)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: roleUsers[role].email,
          password: roleUsers[role].password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);

        if (typeof data.onboardingConfig === "string" && data.onboardingConfig) {
          loadConfig(data.onboardingConfig);
        } else {
          useConfigStore.setState({ isOnboarded: false, isLoaded: true });
        }
        onLoginSuccess();
        return;
      }
    } catch {
      // Fallback: create a demo session in memory (no real auth)
    }

    // Fallback: create demo session without real API login
    login({
      id: `demo-${role}`,
      email: roleUsers[role].email,
      name: roleUsers[role].name,
      role,
      businessId: role === "superadmin" ? "" : "demo",
      businessName: role === "superadmin" ? "YonuKom Platform" : "YonuKom Demo",
    });

    // Pour les comptes démo, on charge une config démo minimale
    if (role !== "superadmin") {
      try {
        loadConfig(
          JSON.stringify({
            businessType: "mixte",
            paymentMethods: ["cash", "wave", "orange_money"],
            primaryPaymentMethod: "cash",
            trackStock: true,
            lowStockAlert: true,
            alertThreshold: 5,
            teamRoles: ["patron", "vendeur"],
            needCashRegister: true,
            language: "fr",
            useReceiptPrinter: false,
            useBarcodeScanner: false,
            manageReservations: false,
          })
        );
      } catch {
        useConfigStore.setState({ isOnboarded: false, isLoaded: true });
      }
    } else {
      useConfigStore.setState({ isOnboarded: true, isLoaded: true });
    }

    onLoginSuccess();
  };

  // Real login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        login(data.user, data.token);

        // Charger la config d'onboarding si elle existe côté serveur.
        // Si pas de config → isOnboarded reste false → onboarding wizard s'affiche.
        // Si config présente → isOnboarded=true → app shell directement.
        if (typeof data.onboardingConfig === "string" && data.onboardingConfig) {
          loadConfig(data.onboardingConfig);
        } else {
          // Pas encore onboarded → on marque comme chargé mais isOnboarded=false
          // pour que le wizard s'affiche
          useConfigStore.setState({ isOnboarded: false, isLoaded: true });
        }

        onLoginSuccess();
      } else {
        setError(data.error || "Erreur de connexion");
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <span className="text-primary-foreground font-bold text-2xl">YK</span>
          </motion.div>
          <h1 className="text-2xl font-bold">YonuKom</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Le logiciel qui s&apos;adapte au commerçant
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "demo" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setMode("demo")}
          >
            Démo rapide
          </Button>
          <Button
            variant={mode === "login" ? "default" : "outline"}
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setMode("login")}
          >
            Connexion
          </Button>
        </div>

        {mode === "demo" ? (
          /* Demo mode — quick role selection */
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Connexion démo
              </CardTitle>
              <CardDescription className="text-xs">
                Choisissez un rôle pour explorer YonuKom
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Role descriptions */}
              {(["superadmin", "patron", "gerant", "vendeur"] as UserRole[]).map((role) => {
                const descriptions: Record<UserRole, string> = {
                  superadmin: "Dashboard plateforme • Gérer tous les tenants",
                  patron: "Accès complet • Voir tout, gérer tout",
                  gerant: "Stock & caisse • Pas de gestion équipe",
                  vendeur: "Vente uniquement • Anti-fraude activé",
                };
                const colors: Record<UserRole, string> = {
                  superadmin: "border-yk-deep-light/30 bg-yk-deep-light/5 hover:bg-yk-deep-light/10",
                  patron: "border-yk-emerald/30 bg-yk-emerald/5 hover:bg-yk-emerald/10",
                  gerant: "border-primary/20 bg-primary/5 hover:bg-primary/10",
                  vendeur: "border-yk-amber/30 bg-yk-amber/5 hover:bg-yk-amber/10",
                };

                return (
                  <motion.button
                    key={role}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDemoLogin(role)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${colors[role]}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{ROLE_LABELS[role]}</p>
                        <p className="text-[10px] text-muted-foreground">{descriptions[role]}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[8px] ${
                          role === "superadmin"
                            ? "border-yk-deep-light/50 text-yk-deep-light"
                            : role === "patron"
                            ? "border-yk-emerald/50 text-yk-emerald"
                            : role === "gerant"
                            ? "border-primary/50 text-primary"
                            : "border-yk-amber/50 text-yk-amber"
                        }`}
                      >
                        {role}
                      </Badge>
                    </div>
                  </motion.button>
                );
              })}

              <Separator className="my-2" />

              <p className="text-[9px] text-muted-foreground text-center">
                En mode démo, les données sont simulées.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Real login form */
          <Card>
            <CardContent className="p-5">
              <form onSubmit={handleLogin} className="space-y-4">
                {info && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 shrink-0" />
                    <span>{info}</span>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.sn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-destructive bg-destructive/10 p-2 rounded-md"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Landmark className="w-4 h-4" />
                  )}
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
