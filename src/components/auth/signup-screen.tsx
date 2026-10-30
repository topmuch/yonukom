// ============================================================
// YonuKom — Signup Screen (Professional split-screen, 2-step wizard)
// Create a boutique account: boutique info (step 1) + security (step 2)
// ============================================================

"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Store,
  User,
  Mail,
  Phone,
  Lock,
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  Globe,
  Rocket,
} from "lucide-react";

interface SignupScreenProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
  onGotoLogin: (successMessage: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Password strength estimator                                       */
/* ------------------------------------------------------------------ */

function getPasswordStrength(pwd: string): {
  score: number; // 0-4
  label: string;
  color: string;
  barColor: string;
} {
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) score++;

  const levels = [
    { label: "Très faible", color: "text-red-500", barColor: "bg-red-400" },
    { label: "Faible", color: "text-orange-500", barColor: "bg-orange-400" },
    { label: "Moyen", color: "text-amber-500", barColor: "bg-amber-400" },
    { label: "Bon", color: "text-emerald-500", barColor: "bg-emerald-400" },
    { label: "Excellent", color: "text-emerald-600", barColor: "bg-emerald-500" },
  ];
  return { score, ...levels[score] };
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function SignupScreen({ onBackToHome, onGotoLogin }: SignupScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Step 2 fields
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmitStep1 = Boolean(name && email && businessName);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmitStep2 = password.length >= 6 && passwordsMatch;

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStep1) return;
    setError(null);
    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitStep2) {
      if (password.length > 0 && password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
      } else if (password.length > 0 && password.length < 6) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError("Veuillez remplir tous les champs.");
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, businessName, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        onGotoLogin("Compte créé ! Connectez-vous.");
      } else {
        setError(data.error ?? "Échec de la création du compte");
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setError(null);
    } else {
      onBackToHome();
    }
  };

  /* ----------------------- Render ----------------------- */

  return (
    <div className="min-h-screen flex bg-white">
      {/* ============ Left brand panel (desktop) ============ */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative overflow-hidden bg-gradient-to-br from-[#E91E63] via-[#D81B60] to-[#AD1457]">
        {/* Decorative shapes */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#FF6B6B]/30 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "26px 26px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo-white.png"
              alt="YonuKom"
              className="h-10 w-auto object-contain rounded-md"
            />
          </div>

          {/* Middle */}
          <div className="space-y-8">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Essai gratuit 14 jours — sans carte bancaire
              </span>
              <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
                Lancez votre boutique
                <br />
                <span className="text-white/90">en 2 minutes.</span>
              </h2>
              <p className="mt-4 text-white/80 text-base leading-relaxed max-w-md">
                Rejoignez les commerçants qui pilotent leur caisse, leur stock
                et leur site internet avec YonuKom.
              </p>
            </div>

            <ul className="space-y-3.5 max-w-md">
              {[
                { icon: Rocket, text: "Configuration guidée en 3 étapes" },
                { icon: Zap, text: "Caisse & encaissement Wave immédiats" },
                { icon: Globe, text: "Site internet boutique offert" },
                { icon: ShieldCheck, text: "Données sécurisées & sauvegardées" },
              ].map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                    <f.icon className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-sm text-white/90 font-medium">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer testimonial */}
          <div className="bg-white/10 backdrop-blur rounded-2xl p-5 border border-white/15 max-w-md">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-3 h-3 text-white fill-white" />
              ))}
              <span className="text-xs text-white/80 ml-1">4,9/5</span>
            </div>
            <p className="text-sm text-white/90 italic leading-relaxed">
              « En 10 minutes, ma caisse tournait et mon site était en ligne.
              Mes clients commandent même sur WhatsApp maintenant. »
            </p>
            <p className="text-xs text-white/70 mt-2">— Fatou S., Boutique Mode Dakar</p>
          </div>
        </div>
      </div>

      {/* ============ Right form panel ============ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-6 text-center">
          <img
            src="/brand/logo.png"
            alt="YonuKom"
            className="h-10 w-auto object-contain mx-auto rounded-md"
          />
        </div>

        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 2 ? "Retour à l'étape 1" : "Retour au site"}
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] flex items-center justify-center shrink-0 shadow-lg shadow-[#E91E63]/30">
              <Store className="w-[22px] h-[22px] text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {step === 1 ? "Créer votre compte" : "Sécuriser votre compte"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {step === 1
                  ? "Informations de votre boutique"
                  : "Choisissez un mot de passe sécurisé"}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-1.5 rounded-full bg-[#E91E63]" />
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                step === 2 ? "bg-[#E91E63]" : "bg-slate-200"
              }`}
            />
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              Étape {step}/2
            </span>
          </div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* ---------- STEP 1: Boutique info ---------- */
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleStep1Submit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-semibold text-slate-700">
                      Nom complet
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Ibrahima Fall"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700">
                      Adresse email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="vous@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone" className="text-xs font-semibold text-slate-700">
                      Téléphone <span className="text-muted-foreground font-normal">(optionnel)</span>
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+221 77 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10 h-11"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-biz" className="text-xs font-semibold text-slate-700">
                      Nom du commerce
                    </Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-biz"
                        type="text"
                        placeholder="Boutique YonuKom"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canSubmitStep1}
                    className="w-full h-11 font-semibold gap-2 bg-[#E91E63] hover:bg-[#AD1457] shadow-lg shadow-[#E91E63]/25"
                  >
                    Continuer
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              /* ---------- STEP 2: Security ---------- */
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                <form onSubmit={handleStep2Submit} className="space-y-4">
                  {/* Summary of step 1 */}
                  <div className="p-3 rounded-lg bg-[#FFF1F5] border border-[#E91E63]/15 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#E91E63]/10 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-[#E91E63]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {businessName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {name} · {email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-700">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11"
                        required
                        autoComplete="new-password"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Masquer" : "Afficher"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {password.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 flex gap-1">
                          {[0, 1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= strength.score - 1 ? strength.barColor : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-[10px] font-semibold ${strength.color} shrink-0`}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm" className="text-xs font-semibold text-slate-700">
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pl-10 pr-10 h-11 ${
                          confirmPassword && !passwordsMatch
                            ? "border-red-400 focus-visible:ring-red-400"
                            : confirmPassword && passwordsMatch
                            ? "border-emerald-400 focus-visible:ring-emerald-400"
                            : ""
                        }`}
                        required
                        autoComplete="new-password"
                      />
                      {confirmPassword && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {passwordsMatch ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <X className="w-4 h-4 text-red-400" />
                          )}
                        </span>
                      )}
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-[10px] text-red-500">
                        Les mots de passe ne correspondent pas.
                      </p>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium text-destructive bg-destructive/8 border border-destructive/20 p-3 rounded-lg flex items-start gap-2"
                    >
                      <X className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !canSubmitStep2}
                    className="w-full h-11 font-semibold gap-2 bg-[#E91E63] hover:bg-[#AD1457] shadow-lg shadow-[#E91E63]/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Création du compte...
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  {/* Trust line */}
                  <p className="text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" />
                    14 jours d&apos;essai · aucune carte requise · résiliable à tout moment
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Switch to login */}
          <p className="text-center text-xs text-muted-foreground mt-6 pt-5 border-t border-slate-100">
            Déjà un compte ?{" "}
            <button
              type="button"
              className="font-semibold text-[#E91E63] hover:underline"
              onClick={() => onGotoLogin("")}
            >
              Se connecter
            </button>
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} YonuKom — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
