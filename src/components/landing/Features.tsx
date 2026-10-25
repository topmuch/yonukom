"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Store,
  Smartphone,
  Package,
  Utensils,
  ShoppingCart,
  BarChart3,
  Bell,
  MessageCircle,
  QrCode,
  CreditCard,
  FileText,
  Truck,
  Users,
  ChefHat,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

interface Profile {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  features: { icon: React.ReactNode; label: string }[];
}

const profiles: Profile[] = [
  {
    icon: <Store className="w-7 h-7" />,
    title: "Je suis Boutiquier",
    description:
      "Gérez votre stock, suivez vos ventes et recevez des alertes avant les ruptures.",
    color: "text-yk-deep",
    bgColor: "bg-yk-deep/10",
    borderColor: "border-yk-deep/20",
    features: [
      { icon: <ShoppingCart className="w-4 h-4" />, label: "Caisse tactile rapide" },
      { icon: <Package className="w-4 h-4" />, label: "Gestion du stock en temps réel" },
      { icon: <Bell className="w-4 h-4" />, label: "Alertes ruptures de stock" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Rapports journaliers & mensuels" },
      { icon: <QrCode className="w-4 h-4" />, label: "Paiement Wave & Orange Money" },
      { icon: <CheckCircle2 className="w-4 h-4" />, label: "Mode hors ligne complet" },
    ],
  },
  {
    icon: <Smartphone className="w-7 h-7" />,
    title: "Je vends sur TikTok / WhatsApp",
    description:
      "Enregistrez les commandes en live, envoyez les liens Wave et suivez les paiements.",
    color: "text-yk-emerald",
    bgColor: "bg-yk-emerald/10",
    borderColor: "border-yk-emerald/20",
    features: [
      { icon: <MessageCircle className="w-4 h-4" />, label: "Messages WhatsApp automatiques" },
      { icon: <ShoppingCart className="w-4 h-4" />, label: "Commandes en direct (live)" },
      { icon: <CreditCard className="w-4 h-4" />, label: "Liens de paiement Wave" },
      { icon: <Users className="w-4 h-4" />, label: "Suivi clients & historique" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Pipeline de commandes" },
      { icon: <Smartphone className="w-4 h-4" />, label: "Interface mobile optimisée" },
    ],
  },
  {
    icon: <Package className="w-7 h-7" />,
    title: "Je suis Grossiste / Distributeur",
    description:
      "Devis, factures, bons de livraison et suivi des acomptes en toute simplicité.",
    color: "text-yk-amber",
    bgColor: "bg-yk-amber/10",
    borderColor: "border-yk-amber/20",
    features: [
      { icon: <FileText className="w-4 h-4" />, label: "Devis & factures professionnelles" },
      { icon: <Truck className="w-4 h-4" />, label: "Bons de livraison" },
      { icon: <CreditCard className="w-4 h-4" />, label: "Suivi des acomptes & crédits" },
      { icon: <Users className="w-4 h-4" />, label: "Gestion clients B2B" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Pipeline commercial Kanban" },
      { icon: <Bell className="w-4 h-4" />, label: "Relances automatiques" },
    ],
  },
  {
    icon: <Utensils className="w-7 h-7" />,
    title: "Je suis Restaurateur",
    description:
      "Gérez vos plats du jour, déclarez les pertes et suivez votre CA en temps réel.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    features: [
      { icon: <ChefHat className="w-4 h-4" />, label: "Plats du jour & menu rotatif" },
      { icon: <AlertTriangle className="w-4 h-4" />, label: "Déclaration des pertes" },
      { icon: <TrendingUp className="w-4 h-4" />, label: "CA en temps réel" },
      { icon: <ShoppingCart className="w-4 h-4" />, label: "Caisse rapide par table" },
      { icon: <Package className="w-4 h-4" />, label: "Gestion des ingrédients" },
      { icon: <BarChart3 className="w-4 h-4" />, label: "Analyse rentabilité par plat" },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function ProfileCard({ profile, index, onSignup }: { profile: Profile; index: number; onSignup?: () => void }) {
  return (
    <Dialog>
      <motion.div variants={cardVariants}>
        <DialogTrigger asChild>
          <Card
            className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-yk-deep/5 hover:-translate-y-1 border ${profile.borderColor} bg-white overflow-hidden`}
          >
            <CardContent className="p-6 sm:p-8 space-y-4">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl ${profile.bgColor} ${profile.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                {profile.icon}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-yk-deep group-hover:text-yk-deep-light transition-colors">
                {profile.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-foreground/60 leading-relaxed">
                {profile.description}
              </p>

              {/* CTA */}
              <div className="flex items-center gap-1.5 text-sm font-medium text-yk-deep group-hover:gap-2.5 transition-all">
                En savoir plus
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-xl font-bold text-yk-deep flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl ${profile.bgColor} ${profile.color} flex items-center justify-center`}>
              {profile.icon}
            </span>
            {profile.title}
          </DialogTitle>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-foreground/60">{profile.description}</p>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-yk-deep">Fonctionnalités incluses :</p>
              <div className="grid gap-2">
                {profile.features.map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-foreground/[0.02]"
                  >
                    <span className={`${profile.color}`}>{feat.icon}</span>
                    <span className="text-sm text-foreground/80">{feat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <Button
              className={`w-full ${profile.bgColor.replace("/10", "")} hover:opacity-90 text-white font-medium gap-2`}
              style={{ backgroundColor: "var(--yk-deep)" }}
              asChild
            >
              <button type="button" onClick={onSignup}>
                Commencer avec ce profil
                <ArrowRight className="w-4 h-4" />
              </button>
            </Button>
          </div>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
}

interface FeaturesProps {
  onSignup?: () => void;
}

export function Features({ onSignup }: FeaturesProps) {
  return (
    <section id="features" className="py-20 sm:py-28 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-yk-deep tracking-tight">
            YonuKom s&apos;adapte à{" "}
            <span className="text-yk-emerald">votre métier</span>
          </h2>
          <p className="mt-4 text-lg text-foreground/60 leading-relaxed">
            Que vous teniez une boutique, vendiez en ligne, soyez grossiste ou restaurateur,
            YonuKom configure automatiquement l&apos;interface dont vous avez besoin.
          </p>
        </motion.div>

        {/* Profile cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {profiles.map((profile, i) => (
            <ProfileCard key={i} profile={profile} index={i} onSignup={onSignup} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
