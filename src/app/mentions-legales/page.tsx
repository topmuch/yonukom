import { LegalContent } from "@/components/landing/LegalContent";

export const metadata = {
  title: "Mentions légales — YonuKom",
  description:
    "Mentions légales de YonuKom : éditeur, hébergeur, propriété intellectuelle et responsabilité.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalContent
      badge="Mentions légales"
      title="Mentions légales"
      intro="Conformément aux dispositions de la loi n° 2008-11 du 25 janvier 2008 sur la protection des données à caractère personnel au Sénégal et au Code des obligations du commerçant, les présentes mentions légales définissent l'éditeur et les conditions d'utilisation du site YonuKom."
      lastUpdated="26 octobre 2026"
      sections={[
        {
          id: "editeur",
          title: "Éditeur du site",
          paragraphs: [
            "Le site yonukom.qrtags.pro est édité par YonuKom, société commerciale en cours d'immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM) de Dakar, dont le siège social est situé à 2m Sicap Foire, Dakar, Sénégal.",
            "Directeur de la publication : le représentant légal de la société YonuKom. Pour toute correspondance, vous pouvez écrire à l'adresse postale ci-dessus ou contacter l'équipe via les coordonnées indiquées à l'article 6 des présentes.",
          ],
        },
        {
          id: "hebergeur",
          title: "Hébergement",
          paragraphs: [
            "Le site est hébergé par un prestataire d'hébergement professionnel assurant la disponibilité et la sécurité des serveurs. L'infrastructure d'hébergement est située dans des datacenters conformes aux standards internationaux en matière de sécurité informatique (ISO 27001) et de continuité de service.",
            "Les coordonnées de l'hébergeur peuvent être obtenues sur simple demande adressée à contact@2mails.com. YonuKom s'engage à communiquer ces informations dans un délai maximum de 5 jours ouvrés à compter de la réception de la demande.",
          ],
        },
        {
          id: "propriete-intellectuelle",
          title: "Propriété intellectuelle",
          paragraphs: [
            "L'ensemble des éléments figurant sur le site YonuKom — textes, logos, graphismes, icônes, sons, logiciels, noms de domaine, charte graphique, code source et structure des pages — est la propriété exclusive de YonuKom ou de ses partenaires, sauf mention contraire explicite. Ces éléments sont protégés par les lois nationales et internationales relatives à la propriété intellectuelle, notamment par le Code de la propriété intellectuelle sénégalais.",
            "Toute reproduction, représentation, modification, publication, adaptation, totale ou partielle des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de YonuKom à l'adresse contact@2mails.com.",
            "L'utilisateur s'engage à ne pas extraire, réutiliser, copier ou diffuser tout ou partie du contenu du site à des fins commerciales. Toute utilisation à des fins personnelles, éducatives ou de recherche est autorisée à condition de mentionner explicitement la source « YonuKom » et l'URL d'origine.",
          ],
        },
        {
          id: "responsabilite",
          title: "Responsabilité",
          paragraphs: [
            "YonuKom met tout en œuvre pour assurer l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois, YonuKom ne saurait être tenu responsable des erreurs, d'une absence de disponibilité des fonctionnalités, ou de la présence de virus sur son site. Les informations fournies sur ce site le sont à titre indicatif et ne sauraient dispenser l'utilisateur d'une analyse complémentaire et personnalisée.",
            "YonuKom ne pourrait être tenu responsable des dommages directs ou indirects résultant de l'accès au site, de son utilisation ou de l'impossibilité d'y accéder, notamment en cas d'interruption pour maintenance, de panne de réseau, de défaillance du matériel ou du navigateur de l'utilisateur.",
            "Les liens hypertextes présents sur le site renvoyant vers d'autres sites internet ne sauraient engager la responsabilité de YonuKom quant au contenu de ces sites ni à leurs pratiques en matière de protection des données personnelles.",
          ],
        },
        {
          id: "donnees-personnelles",
          title: "Données personnelles",
          paragraphs: [
            "Le site YonuKom est susceptible de traiter des données à caractère personnel concernant l'utilisateur. Le traitement de ces données fait l'objet d'une Politique de confidentialité dédiée, accessible à la page /confidentialite, que l'utilisateur est invité à consulter pour connaître ses droits et la manière dont ses données sont collectées, utilisées et protégées.",
          ],
        },
        {
          id: "contact",
          title: "Contact",
          paragraphs: [
            "Pour toute question relative aux présentes mentions légales ou à l'utilisation du site YonuKom, vous pouvez nous contacter aux coordonnées suivantes :",
          ],
          list: [
            "Adresse postale : 2m Sicap Foire, Dakar, Sénégal",
            "Téléphone : +221 78 382 18 22",
            "Email : contact@2mails.com",
            "WhatsApp : +221 78 382 18 22 (disponible aux horaires d'ouverture)",
          ],
        },
        {
          id: "droit-applicable",
          title: "Droit applicable et juridiction compétente",
          paragraphs: [
            "Les présentes mentions légales sont régies par le droit sénégalais. En cas de litige relatif à leur interprétation ou à leur exécution, et à défaut de résolution amiable, les tribunaux sénégalais de Dakar seront seuls compétents pour en connaître, sous réserve des dispositions d'ordre public applicables en matière de protection des consommateurs.",
          ],
        },
      ]}
    />
  );
}
