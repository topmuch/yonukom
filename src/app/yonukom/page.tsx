"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ScrollToTop } from "@/components/landing/ScrollToTop";
import {
  Smartphone,
  Store,
  Utensils,
  Package,
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  WifiOff,
  TrendingUp,
  Users,
  BarChart3,
  Boxes,
  Bell,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function YonuKomPage() {
  const router = useRouter();
  const goSignup = () => router.push("/?view=signup");
  const goLogin = () => router.push("/?view=login");
  const goHome = () => router.push("/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar onLogin={goLogin} onSignup={goSignup} onBackToHome={goHome} variant="app" />

      <main className="flex-1 pt-14">
        {/* Hero de la page YonuKom */}
        <section className="relative bg-gradient-to-br from-[#F6F9FE] via-white to-[#EAF1FC] py-20 sm:py-28 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #338BE2 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Qu'est-ce que YonuKom ?
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
              Le logiciel de gestion commerciale
              <br className="hidden sm:block" />
              <span className="text-[#338BE2]"> pensé pour l'Afrique de l'Ouest</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              YonuKom est une plateforme tout-en-un qui permet aux commerçants de
              gérer leur caisse, leur stock, leurs clients et leurs ventes depuis
              un smartphone ou un ordinateur. Conçue à Dakar pour les réalités du
              terrain sénégalais, elle fonctionne même sans connexion Internet.
            </p>
          </div>
        </section>

        {/* Le concept */}
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
                Le concept
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Un seul outil pour piloter tout votre commerce
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                La plupart des commerçants africains jonglent aujourd'hui entre
                un cahier pour les ventes, un autre pour le stock, Excel pour
                les rapports, et plusieurs applications mobile money. YonuKom
                centralise tout dans une seule application, accessible depuis
                n'importe quel appareil, même hors-ligne.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-[#F6F9FE] to-white p-6 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-[#338BE2]/10 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-[#338BE2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Mobile-first, pas mobile-also
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  YonuKom n'est pas un logiciel desktop adapté au mobile. C'est
                  un logiciel pensé d'abord pour le smartphone — celui que le
                  commerçant a déjà dans sa poche. Tout est tactile, gros boutons,
                  navigation au pouce, et l'application s'installe comme une PWA
                  (Progressive Web App) sans passer par le Play Store.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#F6F9FE] to-white p-6 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
                  <WifiOff className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Offline-first, par défaut
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Au Sénégal, la 3G/4G peut être lente ou instable, et les
                  coupures électriques sont fréquentes. YonuKom fonctionne 100%
                  hors-ligne : vos ventes, votre stock et vos clients sont
                  enregistrés localement sur l'appareil, puis synchronisés
                  automatiquement dès que le réseau revient. Rien ne se perd.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#F6F9FE] to-white p-6 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Anti-fraude intégré
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Chaque vente, chaque modification de stock et chaque opération
                  de caisse est journalisée avec l'identité de l'opérateur
                  (patron, gérant ou vendeur) et un horodatage précis. Le patron
                  peut voir exactement qui a fait quoi, quand, et détecter
                  rapidement les anomalies ou les vols internes.
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#F6F9FE] to-white p-6 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  FCFA et mobile money natifs
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Pas de conversion USD/EUR, pas de décimales. YonuKom parle
                  FCFA, le franc CFA de l'UEMOA. Les paiements Wave, Orange
                  Money et Free Money sont intégrés comme moyens de paiement
                  natifs. Vous enregistrez une vente encaissée via Wave en un
                  seul tap.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-20 sm:py-24 bg-[#F6F9FE]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
                Comment ça marche
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Démarrez en moins de 5 minutes
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Quatre étapes suffisent pour transformer la gestion de votre
                commerce, sans formation informatique et sans installation
                compliquée.
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  num: "01",
                  icon: Users,
                  title: "Créez votre compte commerçant",
                  description:
                    "Inscrivez-vous gratuitement en 30 secondes avec votre email et numéro de téléphone. Choisissez votre type de commerce (boutique, restaurant, grossiste, e-commerce) et le nom de votre boutique. Aucun document n'est requis pour démarrer l'essai gratuit de 14 jours.",
                },
                {
                  num: "02",
                  icon: Package,
                  title: "Ajoutez vos produits et votre stock",
                  description:
                    "Saisissez vos produits manuellement ou importez-les en CSV. Pour chaque produit, indiquez le prix d'achat, le prix de vente, la quantité en stock et une catégorie. Vous pouvez aussi prendre une photo du produit directement depuis votre smartphone. Le stock est mis à jour automatiquement à chaque vente.",
                },
                {
                  num: "03",
                  icon: CreditCard,
                  title: "Encaissez vos premières ventes",
                  description:
                    "Ouvrez l'écran de caisse, sélectionnez les produits achetés par le client, choisissez le mode de paiement (espèces, Wave, Orange Money, Free Money, carte) et validez. Un reçu peut être imprimé ou envoyé par WhatsApp. La vente est enregistrée, le stock décrémenté, et le chiffre d'affaires mis à jour en temps réel.",
                },
                {
                  num: "04",
                  icon: BarChart3,
                  title: "Pilotez votre commerce avec les rapports",
                  description:
                    "Consultez à tout moment votre chiffre d'affaires du jour, de la semaine ou du mois. Identifiez vos produits les plus vendus, vos heures de pointe, vos meilleurs clients. Exportez vos rapports en PDF ou CSV pour votre comptable. Tout est calculé automatiquement, sans saisie manuelle.",
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="flex gap-6 items-start">
                    <div className="shrink-0 w-14 h-14 rounded-2xl bg-[#338BE2] text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-[#338BE2]/25">
                      {step.num}
                    </div>
                    <div className="flex-1 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-lg bg-[#338BE2]/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#338BE2]" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* À qui s'adresse YonuKom */}
        <section className="py-20 sm:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
                À qui s'adresse YonuKom
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Tous les commerçants d'Afrique de l'Ouest
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                YonuKom s'adapte à votre métier, pas l'inverse. Que vous teniez
                une petite boutique de quartier ou un grossiste structuré, le
                logiciel se configure selon vos besoins.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Store,
                  title: "Boutiques et retail",
                  description:
                    "Tièdopes, boutiques de quartier, supérettes, boutiques de mode, parapharmacies, boutiques cosmétiques. Gérez votre stock par catégorie, vos prix d'achat et de vente, vos clients fidèles, et vos ventes journalières.",
                  color: "#338BE2",
                },
                {
                  icon: Utensils,
                  title: "Restaurants et maquis",
                  description:
                    "Restaurants, fast-foods, maquis, cafés, boulangeries, tentes de thé. Encaissez les commandes à table ou à emporter, gérez les menus du jour, les additions partagées, les serveurs, et les recettes par service.",
                  color: "#10B981",
                },
                {
                  icon: Package,
                  title: "Grossistes et importateurs",
                  description:
                    "Grossistes en alimentation, distributeurs, importateurs de textile ou d'électronique. Gérez vos stocks par lot, vos prix dégressifs par quantité, vos clients professionnels (B2B), et vos bons de livraison.",
                  color: "#F59E0B",
                },
                {
                  icon: ShoppingBag,
                  title: "E-commerce et live-shopping",
                  description:
                    "Vendeurs TikTok Live, Instagram, Facebook Marketplace. Synchronisez vos commandes en ligne, gérez les livraisons, les retours, et les paiements à la livraison. Idéal pour les vendeuses de vêtements en live.",
                  color: "#EC4899",
                },
                {
                  icon: Smartphone,
                  title: "Vendeurs mobiles et ambulants",
                  description:
                    "Vendeurs de rue, commerçants ambulants, livreurs, prestataires de services. Encaissez où que vous soyez depuis votre smartphone, même sans connexion Internet. Synchronisez quand vous rentrez chez vous.",
                  color: "#8B5CF6",
                },
                {
                  icon: Users,
                  title: "Multi-boutiques et franchises",
                  description:
                    "Patrons avec plusieurs boutiques, gérants de franchises. Gérez toutes vos boutiques depuis un seul tableau de bord, comparez les performances, et donnez un accès limité à chaque gérant.",
                  color: "#0EA5E9",
                },
              ].map((target) => {
                const Icon = target.icon;
                return (
                  <div
                    key={target.title}
                    className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#338BE2]/30 hover:shadow-md transition-all"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${target.color}15` }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: target.color }}
                      />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">
                      {target.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {target.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Les avantages */}
        <section className="py-20 sm:py-24 bg-[#F6F9FE]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#338BE2]/10 text-[#338BE2] text-xs font-semibold uppercase tracking-wide mb-4">
                Les avantages
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Ce que YonuKom vous apporte au quotidien
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Concret, mesurable, immédiat. Voici ce que les commerçants
                gagnent en passant à YonuKom.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Zap,
                  title: "Gain de temps quotidien",
                  description:
                    "Plus besoin de compter la caisse à la main pendant 30 minutes chaque soir. YonuKom clôture automatiquement la journée, calcule le chiffre d'affaires, les recettes par mode de paiement, et l'écart de caisse éventuel. Vous gagnez 1 à 2 heures par jour.",
                },
                {
                  icon: TrendingUp,
                  title: "Croissance du chiffre d'affaires",
                  description:
                    "En voyant vos meilleurs produits, vos heures de pointe et vos clients les plus fidèles, vous pouvez ajuster votre offre. Les commerçants YonuKom rapportent en moyenne +15 à 25% de CA dans les 3 premiers mois grâce à de meilleures décisions.",
                },
                {
                  icon: ShieldCheck,
                  title: "Réduction de la fraude interne",
                  description:
                    "Avec l'audit trail complet, chaque vente est attribuée à un opérateur. Les vols internes et les anomalies de caisse baissent drastiquement. Le patron peut voir en un coup d'œil si un vendeur a un écart de caisse récurrent.",
                },
                {
                  icon: Boxes,
                  title: "Stock toujours à jour",
                  description:
                    "Fini les ruptures de stock surprises. YonuKom vous alerte quand un produit passe sous un seuil minimum, et vous permet de passer commande à votre fournisseur en un clic. Vous ne perdez plus de ventes par rupture, et vous évitez le surstock.",
                },
                {
                  icon: Users,
                  title: "Fidélisation de vos clients",
                  description:
                    "Enregistrez chaque client avec son numéro de téléphone et son historique d'achats. Envoyez-lui un message WhatsApp pour son anniversaire, pour un nouveau produit, ou pour une promo. Vos clients se sentent connus et reviennent plus souvent.",
                },
                {
                  icon: Bell,
                  title: "Alertes en temps réel",
                  description:
                    "Recevez une notification WhatsApp à chaque vente importante, à chaque rupture de stock, à chaque nouveau client enregistré. Même quand vous n'êtes pas dans la boutique, vous savez exactement ce qui s'y passe.",
                },
                {
                  icon: BarChart3,
                  title: "Rapports pour le comptable",
                  description:
                    "Exportez en un clic vos ventes mensuelles en PDF ou CSV pour votre expert-comptable. Format compatible avec les obligations fiscales sénégalaises. Vous gagnez des frais comptables en lui livrant des données déjà structurées.",
                },
                {
                  icon: WifiOff,
                  title: "Continuité de service",
                  description:
                    "Coupure de courant, coupure Internet, panne de SENELEC ? YonuKom continue de fonctionner. Vos ventes sont enregistrées localement et synchronisées dès le retour du réseau. Vous ne perdez jamais une vente à cause d'une panne.",
                },
              ].map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="bg-white rounded-2xl p-6 border border-slate-200 flex items-start gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#338BE2]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#338BE2]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                        {benefit.title}
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-20 sm:py-24 bg-slate-950 text-white relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse, rgba(51,139,226,0.4) 0%, transparent 70%)",
            }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 tracking-tight">
              Prêt à digitaliser votre commerce ?
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8">
              Essayez YonuKom gratuitement pendant 14 jours, sans carte
              bancaire. Notre équipe à Dakar vous accompagne dans la prise en
              main, en français, wolof ou pulaar.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={goSignup}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#338BE2] hover:bg-[#2074C6] text-white font-semibold shadow-lg shadow-[#338BE2]/30 transition-colors"
              >
                Commencer gratuitement
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-colors"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}
