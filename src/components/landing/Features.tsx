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
  features: { icon: React.ReactNode; label: string }[];
}

const profiles: Profile[] = [
  {
    icon: <Store className="w-6 h-6" />,
    title: "Boutiquier",
    description:
      "Gérez votre stock, suivez vos ventes et recevez des alertes avant les ruptures.",
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
    icon: <Smartphone className="w-6 h-6" />,
    title: "Vendeur TikTok / WhatsApp",
    description:
      "Enregistrez les commandes en live, envoyez les liens Wave et suivez les paiements.",
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
    icon: <Package className="w-6 h-6" />,
    title: "Grossiste / Distributeur",
    description:
      "Devis, factures, bons de livraison et suivi des acomptes en toute simplicité.",
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
    icon: <Utensils className="w-6 h-6" />,
    title: "Restaurateur",
    description:
      "Gérez vos plats du jour, déclarez les pertes et suivez votre CA en temps réel.",
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
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

function ProfileCard({
  profile,
  onSignup,
}: {
  profile: Profile;
  onSignup?: () => void;
}) {
  return (
    <Dialog>
      <motion.div variants={cardVariants} className="h-full">
        <DialogTrigger asChild>
          <Card
            className="group h-full cursor-pointer transition-all duration-300 hover:shadow-[0_20px_40px_-12px_rgba(51,139,226,0.18)] hover:-translate-y-1.5 border border-slate-200/60 bg-white/70 backdrop-blur-sm overflow-hidden relative"
          >
            {/* Gradient hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#338BE2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <CardContent className="p-6 sm:p-7 space-y-4 relative">
              {/* Icon tile with blue gradient */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center text-white shadow-md shadow-[#338BE2]/25 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                {profile.icon}
              </div>

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#338BE2] transition-colors">
                {profile.title}
              </h3>

              <p className="text-sm text-slate-500 leading-relaxed">
                {profile.description}
              </p>

              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#338BE2] group-hover:gap-2.5 transition-all">
                En savoir plus
                <ArrowRight className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="sm:max-w-lg">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#338BE2] to-[#2074C6] flex items-center justify-center text-white shadow-md shadow-[#338BE2]/25">
              {profile.icon}
            </span>
            {profile.title}
          </DialogTitle>
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-500">{profile.description}</p>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">
                Fonctionnalités incluses :
              </p>
              <div className="grid gap-2">
                {profile.features.map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-50"
                  >
                    <span className="text-[#338BE2]">{feat.icon}</span>
                    <span className="text-sm text-slate-700">{feat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <Button
              className="w-full bg-[#338BE2] hover:bg-[#2074C6] text-white font-medium gap-2 shadow-md shadow-[#338BE2]/25"
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
    <section id="features" className="py-20 sm:py-28 lg:py-32 bg-[#F6F9FE] relative">
      {/* Decorative blobs */}
      <div
        className="absolute top-1/3 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(183,190,218,0.5) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#338BE2]/10 border border-[#338BE2]/20 mb-4">
            <BarChart3 className="w-3.5 h-3.5 text-[#338BE2]" />
            <span className="text-xs font-semibold text-[#338BE2] uppercase tracking-wider">
              Fonctionnalités
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Une plateforme pour{" "}
            <span className="bg-gradient-to-r from-[#338BE2] to-[#5BA5EA] bg-clip-text text-transparent">
              chaque métier
            </span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 leading-relaxed">
            Que vous teniez une boutique, vendiez en ligne, soyez grossiste ou
            restaurateur, YonuKom configure automatiquement l&apos;interface dont
            vous avez besoin.
          </p>
        </motion.div>

        {/* Profile cards grid — 3 columns on lg, glassmorphism on hover */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {profiles.map((profile, i) => (
            <ProfileCard key={i} profile={profile} onSignup={onSignup} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
