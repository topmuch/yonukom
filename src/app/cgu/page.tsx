import { LegalContent } from "@/components/landing/LegalContent";

export const metadata = {
  title: "Conditions générales d'utilisation — YonuKom",
  description:
    "CGU de YonuKom : conditions d'accès et d'utilisation du logiciel de caisse et de gestion pour commerçants.",
};

export default function CGUPage() {
  return (
    <LegalContent
      badge="CGU"
      title="Conditions générales d'utilisation"
      intro="Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du logiciel de caisse et de gestion YonuKom, ainsi que du site yonukom.qrtags.pro. En utilisant le service, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve les présentes CGU."
      lastUpdated="26 octobre 2026"
      sections={[
        {
          id: "definitions",
          title: "Définitions",
          paragraphs: [
            "Dans les présentes CGU, les termes suivants désignent :",
          ],
          list: [
            "« YonuKom » ou « l'Éditeur » : la société YonuKom, éditrice du logiciel, dont le siège est à 2m Sicap Foire, Dakar, Sénégal.",
            "« l'Utilisateur » ou « le Commerçant » : toute personne physique ou morale qui crée un compte et utilise le logiciel YonuKom, pour son activité commerciale.",
            "« le Service » : l'ensemble des fonctionnalités offertes par YonuKom, incluant la caisse, le stock, la gestion clients, les rapports, le mode hors-ligne, l'anti-fraude et le tableau de bord multi-boutiques.",
            "« le Compte » : l'espace personnel créé par l'Utilisateur avec un identifiant et un mot de passe, donnant accès au Service.",
            "« les Données » : l'ensemble des informations saisies par l'Utilisateur dans le Service (clients, produits, ventes, stock, etc.).",
            "« l'Abonnement » : le contrat payant souscrit par l'Utilisateur pour accéder au Service pour une durée déterminée (mensuelle ou annuelle).",
          ],
        },
        {
          id: "objet",
          title: "Objet",
          paragraphs: [
            "Les présentes CGU ont pour objet de définir les conditions d'accès et d'utilisation du Service YonuKom par l'Utilisateur, ainsi que les droits et obligations de chacune des parties. Elles s'appliquent à tout Utilisateur du Service, sans restriction d'âge dès lors que l'Utilisateur dispose de la capacité juridique pour contracter.",
            "YonuKom se réserve le droit de modifier les présentes CGU à tout moment. Les CGU applicables sont celles en vigueur au moment de l'utilisation du Service. L'Utilisateur est invité à consulter régulièrement la présente page pour prendre connaissance des éventuelles modifications. En cas de modification substantielle, YonuKom en informera les Utilisateurs par email au moins 30 jours avant l'entrée en vigueur.",
          ],
        },
        {
          id: "acces-compte",
          title: "Accès et création de compte",
          paragraphs: [
            "La création d'un Compte YonuKom est gratuite et se fait via le formulaire d'inscription accessible depuis la page d'accueil. L'Utilisateur doit fournir des informations exactes, complètes et à jour : nom, prénom, email, numéro de téléphone, type de commerce et nom de la boutique. Toute fausse déclaration engage la responsabilité de l'Utilisateur.",
            "L'Utilisateur choisit un identifiant (email) et un mot de passe personnel. Le mot de passe doit comporter au minimum 8 caractères, dont une lettre et un chiffre. L'Utilisateur est seul responsable de la confidentialité de son mot de passe et de toute utilisation de son Compte, frauduleuse ou non. YonuKom recommande l'activation de l'authentification à deux facteurs (2FA) pour les comptes patrons.",
            "La création d'un Compte est réservée aux commerçants exerçant une activité commerciale légale au Sénégal ou dans tout autre pays d'Afrique de l'Ouest. YonuKom se réserve le droit de refuser ou de suspendre un Compte en cas de présomption d'activité illégale ou de violation des présentes CGU.",
          ],
        },
        {
          id: "utilisation-service",
          title: "Utilisation du Service",
          paragraphs: [
            "L'Utilisateur s'engage à utiliser le Service dans le cadre de son activité commerciale légitime et à respecter les lois et règlements en vigueur au Sénégal et dans son pays d'exercice. Sont notamment interdits :",
          ],
          list: [
            "L'utilisation du Service à des fins de blanchiment de capitaux, de financement du terrorisme ou de toute activité illégale.",
            "La saisie de transactions fictives destinées à tromper l'administration fiscale ou les partenaires commerciaux de l'Utilisateur.",
            "L'utilisation du Service pour héberger, transmettre ou diffuser des contenus contrefaisants, diffamatoires ou contraires à l'ordre public.",
            "La tentative d'accéder au Compte d'un autre Utilisateur, de perturber le Service, ou de tenter d'en détourner les sécurités.",
            "La revente, la sous-licence ou la mise à disposition du Service à des tiers sans autorisation écrite préalable de YonuKom.",
            "L'utilisation de robots, scrapeurs ou automates pour extraire des données du Service au-delà de ce que permet l'API officielle.",
          ],
          subsections: [
            {
              title: "Mode hors-ligne",
              paragraphs: [
                "Le Service YonuKom fonctionne en mode hors-ligne. Les transactions effectuées sans connexion Internet sont stockées localement sur l'appareil de l'Utilisateur (chiffrées) et synchronisées automatiquement avec le serveur YonuKom dès que la connexion est rétablie. L'Utilisateur est responsable de la sécurité de son appareil (verrouillage par code ou biométrie) afin d'éviter toute utilisation frauduleuse en mode hors-ligne.",
              ],
            },
            {
              title: "Anti-fraude",
              paragraphs: [
                "YonuKom journalise chaque opération de caisse avec l'identité de l'opérateur (patron, gérant ou vendeur) et un horodatage précis. Ces journaux ne sont pas modifiables par l'Utilisateur et servent d'audit trail en cas de litige interne. L'Utilisateur accepte que ces journaux soient conservés pour la durée prévue par la politique de confidentialité.",
              ],
            },
          ],
        },
        {
          id: "abonnement",
          title: "Abonnement et tarifs",
          paragraphs: [
            "Le Service YonuKom est accessible via un abonnement mensuel ou annuel dont les tarifs sont publiés sur la page Tarifs du site. Les tarifs sont indiqués en Francs CFA (FCFA), toutes taxes comprises. Une période d'essai gratuite de 14 jours peut être offerte aux nouveaux Utilisateurs, sans obligation de fournir un moyen de paiement.",
            "Le paiement de l'abonnement s'effectue par mobile money (Orange Money, Wave, Free Money) ou par virement bancaire. Le paiement est exigible en début de période. En l'absence de paiement à la date d'échéance, l'accès au Service sera suspendu après un délai de grâce de 7 jours, puis le Compte sera désactivé après 30 jours supplémentaires sans régularisation.",
            "YonuKom se réserve le droit de modifier ses tarifs à tout moment. Les modifications prendront effet à la prochaine échéance de l'abonnement, avec un préavis d'au moins 30 jours notifié par email. L'Utilisateur peut alors choisir de résilier son abonnement sans pénalité avant l'entrée en vigueur des nouveaux tarifs.",
          ],
        },
        {
          id: "donnees-utilisateur",
          title: "Données de l'Utilisateur",
          paragraphs: [
            "L'Utilisateur reste seul propriétaire des Données qu'il saisit dans le Service (clients, produits, ventes, stock). YonuKom n'a aucun droit de propriété sur ces Données et s'engage à ne les utiliser que pour la fourniture du Service et l'amélioration du produit de façon agrégée et anonymisée.",
            "Conformément à la Politique de confidentialité, l'Utilisateur peut à tout moment exporter ses Données au format CSV ou JSON depuis son espace Commerçant. En cas de résiliation de l'abonnement, l'Utilisateur dispose d'un délai de 60 jours pour exporter ses Données, au-delà duquel elles seront supprimées (ou anonymisées pour les obligations comptables).",
            "YonuKom s'engage à ne jamais transférer, vendre ou céder les Données de l'Utilisateur à un tiers à des fins commerciales. En cas de fusion, acquisition ou faillite de YonuKom, l'Utilisateur sera informé au préalable et aura la possibilité d'exporter et de supprimer ses Données avant tout transfert éventuel.",
          ],
        },
        {
          id: "responsabilite",
          title: "Responsabilité et garantie",
          paragraphs: [
            "YonuKom s'engage à fournir le Service avec diligence et professionnalisme, conformément aux usages de la profession. Toutefois, le Service est fourni « tel quel » et YonuKom ne peut garantir qu'il sera exempt de tout bug, interruption ou erreur. L'Utilisateur reconnaît utiliser le Service à ses risques et qu'il est responsable de la sauvegarde de ses Données.",
            "YonuKom ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du Service, notamment : perte de chiffre d'affaires, perte de Données, panne de matériel, erreur de saisie, ou défaut de connexion Internet. La responsabilité de YonuKom est plafonnée au montant total des abonnements versés par l'Utilisateur au cours des 12 derniers mois précédant le fait générateur.",
            "L'Utilisateur est seul responsable de la conformité fiscale de son activité, de la déclaration de ses revenus et du respect des obligations comptables sénégalaises. YonuKom est un outil d'aide à la gestion et ne se substitue pas à un expert-comptable ou à un conseiller fiscal.",
          ],
        },
        {
          id: "propriete-intellectuelle",
          title: "Propriété intellectuelle",
          paragraphs: [
            "Le Service YonuKom, son code source, son design, son nom commercial, son logo et l'ensemble de ses composants sont la propriété exclusive de YonuKom. L'Utilisateur dispose d'un droit d'usage non exclusif, non transférable, limité à la durée de son abonnement et à son propre usage commercial.",
            "L'Utilisateur s'interdit de copier, décompiler, modifier ou distribuer tout ou partie du Service sans autorisation écrite préalable de YonuKom. Toute violation de cette clause pourra entraîner des poursuites judiciaires conformément au Code de la propriété intellectuelle sénégalais.",
          ],
        },
        {
          id: "resiliation",
          title: "Résiliation",
          paragraphs: [
            "L'Utilisateur peut résilier son abonnement à tout moment depuis son espace Commerçant ou par demande adressée à contact@2mails.com. La résiliation prend effet à la fin de la période d'abonnement en cours et n'ouvre pas droit à remboursement de la période restante, sauf cas de force majeure.",
            "YonuKom se réserve le droit de résilier ou suspendre immédiatement le Compte de l'Utilisateur en cas de violation des présentes CGU, d'utilisation frauduleuse, ou de non-paiement de l'abonnement après les délais de grâce prévus à l'article 5.",
            "En cas de résiliation, l'Utilisateur dispose d'un délai de 60 jours pour exporter ses Données. Passé ce délai, les Données seront supprimées, à l'exception de celles dont la conservation est imposée par les lois fiscales et comptables (10 ans pour les transactions commerciales).",
          ],
        },
        {
          id: "droit-applicable",
          title: "Droit applicable et litiges",
          paragraphs: [
            "Les présentes CGU sont régies par le droit sénégalais. En cas de litige relatif à l'interprétation, l'exécution ou la résiliation des présentes, les parties s'engagent à rechercher préalablement une solution amiable. À défaut d'accord dans un délai de 60 jours, le litige sera soumis aux tribunaux de commerce de Dakar, sous réserve des dispositions d'ordre public applicables en matière de protection des consommateurs.",
            "Conformément à la loi sénégalaise sur la médiation, l'Utilisateur peut recourir à un médiateur de la consommation pour tenter de résoudre un litige relatif à l'exécution du Service. Les coordonnées du médiateur compétent peuvent être obtenues sur demande adressée à contact@2mails.com.",
          ],
        },
        {
          id: "contact",
          title: "Contact",
          paragraphs: [
            "Pour toute question relative aux présentes CGU, vous pouvez contacter YonuKom aux coordonnées suivantes :",
          ],
          list: [
            "Adresse postale : 2m Sicap Foire, Dakar, Sénégal",
            "Téléphone : +221 78 382 18 22",
            "Email : contact@2mails.com",
            "WhatsApp : +221 78 382 18 22",
          ],
        },
      ]}
    />
  );
}
