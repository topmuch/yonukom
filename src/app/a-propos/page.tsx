"use client";

import {
  Target,
  Heart,
  Shield,
  Zap,
  Users,
  Globe2,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const values = [
  {
    icon: Target,
    title: "Simplicité avant tout",
    description:
      "Nous pensons qu'un bon outil doit disparaître au profit de votre métier. Chaque fonctionnalité YonuKom est conçue pour être comprise en moins de 30 secondes, même sans formation informatique. La caisse, le stock, les clients : tout est à portée d'un geste, sur mobile comme sur ordinateur.",
    color: "#E91E63",
  },
  {
    icon: Shield,
    title: "Confiance & sécurité",
    description:
      "Vos données sont les vôtres. YonuKom chiffre toutes les transactions, journalise chaque opération et vous donne un audit trail complet. Notre mode hors-ligne garantit que votre activité continue même quand Internet coupe, et que rien ne se perd quand le réseau revient.",
    color: "#10B981",
  },
  {
    icon: Zap,
    title: "Performance locale",
    description:
      "Conçue à Dakar, pensée pour l'Afrique de l'Ouest. YonuKom fonctionne sur les réseaux 3G/4G les plus lents, supporte les coupures électriques, et s'adapte aux réalités du terrain : paiements mobile money, factures en FCFA, gestion multi-boutiques, et assistance en wolof sur demande.",
    color: "#F59E0B",
  },
  {
    icon: Heart,
    title: "Proximité terrain",
    description:
      "Nous ne sommes pas une boîte américaine qui découvre l'Afrique. Notre équipe vit à Dakar, teste le produit chez les commerçants de Sandaga, Médina et la Sicap, et répond au téléphone en français, wolof ou pulaar. Chaque retour terrain nourrit la feuille de route du produit.",
    color: "#EF4444",
  },
];

const stats = [
  { value: "2024", label: "Année de création" },
  { value: "100%", label: "Conçu à Dakar" },
  { value: "3+", label: "Métiers couverts" },
  { value: "24h", label: "Support sous 24h" },
];

const timeline = [
  {
    year: "2024",
    title: "L'idée naît à Sicap Foire",
    description:
      "Fondateur commerçant, nous observons que les outils de caisse occidentaux ne correspondent pas aux réalités africaines : pas de mode hors-ligne, pas de mobile money, pas de FCFA, pas de français adapté. Nous décidons de construire le nôtre.",
  },
  {
    year: "2025",
    title: "Premiers clients sénégalais",
    description:
      "Après 12 mois de R&D à Dakar, nous déployons YonuKom chez 10 commerçants pilotes (boutiques, restaurants, grossistes). Le retour terrain confirme : le mode offline, l'anti-fraude et la simplicité mobile-first sont les piliers du produit.",
  },
  {
    year: "2026",
    title: "Ouverture à l'Afrique de l'Ouest",
    description:
      "YonuKom étend son support multi-devises (FCFA, devises UEMOA), multi-langues et multi-métiers. L'objectif : devenir le logiciel de gestion de référence pour 1 million de commerçants ouest-africains d'ici 2030.",
  },
];

export default function AboutPage() {
  return (
    <LegalPageLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#FFF1F5] via-white to-[#FCE4EC] pt-20 pb-16 sm:pt-24 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E91E63]/10 text-[#E91E63] text-xs font-semibold uppercase tracking-wide mb-5">
            À propos de YonuKom
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-5 tracking-tight">
            La gestion de votre commerce,
            <br className="hidden sm:block" />
            <span className="text-[#E91E63]"> enfin yomb.</span>
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            YonuKom est un logiciel de caisse et de gestion conçu à Dakar pour
            les commerçants d'Afrique de l'Ouest. Notre mission : transformer
            la gestion quotidienne d'un commerce en expérience simple, rapide
            et fiable, même quand le réseau faiblit.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#E91E63] mb-1">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 sm:py-24 bg-[#FFF1F5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Notre mission
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              Permettre à chaque commerçant africain — du petit boutiquier de
              quartier au grossiste structuré — de piloter son activité avec un
              outil professionnel, abordable et pensé pour ses réalités. Nous
              croyons que la digitalisation ne doit pas être un luxe réservé
              aux grandes entreprises, mais un droit accessible à tous.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#E91E63]/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-[#E91E63]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Pour les commerçants
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Une caisse rapide, un stock fiable, des clients fidélisés et
                des rapports clairs pour décider. Le tout en français, en
                FCFA, et qui fonctionne même sans connexion Internet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-[#10B981]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Pour les équipes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Des rôles clairs (patron, gérant, vendeur), un contrôle
                anti-fraude, et la possibilité de gérer plusieurs boutiques
                depuis un seul tableau de bord. Chacun voit ce qu'il doit voir,
                ni plus, ni moins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E91E63]/10 text-[#E91E63] text-xs font-semibold uppercase tracking-wide mb-4">
              Nos valeurs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Ce qui nous guide chaque jour
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Quatre principes ancrent chacune de nos décisions produit et
              chaque ligne de code que nous écrivons.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-[#E91E63]/40 hover:shadow-md transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${value.color}10` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: value.color }}
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 sm:py-24 bg-[#FFF1F5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Notre histoire
            </h2>
            <p className="text-slate-600">
              De l'idée née à Sicap Foire à l'ambition ouest-africaine.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-[#E91E63]/20 -translate-x-1/2 sm:-translate-x-1/2" />

            {timeline.map((item, idx) => (
              <div
                key={item.year}
                className={`relative flex items-start mb-10 last:mb-0 ${
                  idx % 2 === 0 ? "sm:flex-row-reverse" : ""
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#E91E63] ring-4 ring-white mt-2" />

                {/* Content */}
                <div
                  className={`pl-12 sm:pl-0 sm:w-1/2 ${
                    idx % 2 === 0
                      ? "sm:pr-12 sm:text-right"
                      : "sm:pl-12"
                  }`}
                >
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#E91E63]/10 text-[#E91E63] text-xs font-semibold mb-2">
                    {item.year}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 sm:py-24 bg-slate-950 text-white relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(51,139,226,0.4) 0%, transparent 70%)",
          }}
        />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E91E63]/20 mb-6">
            <Globe2 className="w-7 h-7 text-[#E91E63]" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-5 tracking-tight">
            Notre vision à 10 ans
          </h2>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-8">
            Devenir la plateforme de référence pour la gestion commerciale en
            Afrique de l'Ouest, en accompagnant un million de commerçants vers
            la formalisation, la croissance et la réussite. Pas en copiant
            l'Occident — mais en construisant un outil qui parle notre langue,
            comprend nos contraintes, et célèbre nos succès.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              "Mobile-first",
              "Offline-first",
              "Anti-fraude",
              "FCFA natif",
              "Multi-boutique",
              "Mobile money",
            ].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E91E63]" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </LegalPageLayout>
  );
}
