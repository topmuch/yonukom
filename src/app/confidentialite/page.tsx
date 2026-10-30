import { LegalContent } from "@/components/landing/LegalContent";

export const metadata = {
  title: "Politique de confidentialité — YonuKom",
  description:
    "Politique de confidentialité de YonuKom : collecte, traitement, sécurité et droits sur vos données personnelles.",
};

export default function ConfidentialitePage() {
  return (
    <LegalContent
      badge="Confidentialité"
      title="Politique de confidentialité"
      intro="YonuKom s'engage à protéger la vie privée des utilisateurs de son logiciel de caisse et de gestion. La présente politique explique quelles données nous collectons, pourquoi, comment nous les protégeons, et quels sont vos droits conformément à la loi sénégalaise n° 2008-11 du 25 janvier 2008 sur la protection des données à caractère personnel."
      lastUpdated="26 octobre 2026"
      sections={[
        {
          id: "responsable",
          title: "Responsable du traitement",
          paragraphs: [
            "Le responsable du traitement des données personnelles collectées via le site yonukom.qrtags.pro et l'application YonuKom est la société YonuKom, dont le siège social est situé à 2m Sicap Foire, Dakar, Sénégal. Pour toute question relative à vos données personnelles, vous pouvez nous contacter à contact@2mails.com ou au +221 78 382 18 22.",
            "YonuKom a désigné un délégué interne à la protection des données en charge de veiller au respect de la présente politique et des obligations légales applicables. Ce délégué peut être joint via les coordonnées ci-dessus en mentionnant « DPO » dans l'objet du message.",
          ],
        },
        {
          id: "donnees-collectees",
          title: "Données collectées",
          paragraphs: [
            "Nous collectons uniquement les données strictement nécessaires au fonctionnement du service et à la relation commerciale avec nos utilisateurs. Les catégories de données traitées sont les suivantes :",
          ],
          list: [
            "Données d'identification : nom, prénom, raison sociale (pour les commerçants inscrits en tant qu'entreprise), adresse postale, pièce d'identité (uniquement pour la vérification de compte).",
            "Données de contact : adresse email, numéro de téléphone, compte WhatsApp.",
            "Données professionnelles : type de commerce (boutique, restaurant, grossiste), informations de boutique, nom commercial, logo.",
            "Données d'usage : pages visitées, durée de session, actions effectuées dans l'application, journaux d'audit des ventes et opérations de caisse.",
            "Données techniques : adresse IP, type de navigateur, système d'exploitation, version de l'application mobile, identifiant d'appareil (utilisé pour le mode hors-ligne et la sécurité anti-fraude).",
            "Données financières : montants des transactions en FCFA, moyens de paiement utilisés (espèces, mobile money, carte). YonuKom ne stocke jamais les numéros de carte bancaire.",
          ],
        },
        {
          id: "finalites",
          title: "Finalités du traitement",
          paragraphs: [
            "Vos données sont traitées pour des finalités précises, légitimes et proportionnées :",
          ],
          list: [
            "Fourniture du service : créer votre compte commerçant, gérer votre caisse, votre stock, vos clients et vos rapports d'activité.",
            "Sécurité et anti-fraude : journaliser chaque opération de caisse pour prévenir les vols internes, détecter les anomalies, et permettre un audit complet à la demande du patron de la boutique.",
            "Support client : répondre à vos demandes d'assistance, diagnostiquer les problèmes techniques, améliorer la qualité du service.",
            "Facturation et comptabilité : émettre les factures d'abonnement, tenir la comptabilité de YonuKom, et vous fournir les documents fiscaux requis.",
            "Amélioration du produit : analyser l'usage (de façon agrégée et anonymisée) pour identifier les fonctionnalités à améliorer et les bugs à corriger.",
            "Communication : vous informer des nouveautés produit, des mises à jour de sécurité et des évolutions de nos conditions générales, si vous y avez consenti.",
          ],
        },
        {
          id: "base-legale",
          title: "Base légale du traitement",
          paragraphs: [
            "Conformément à la loi sénégalaise n° 2008-11, le traitement de vos données repose sur les bases légales suivantes :",
          ],
          list: [
            "Exécution d'un contrat : les données nécessaires à la fourniture du service YonuKom sont traitées en application du contrat d'abonnement que vous avez souscrit.",
            "Intérêt légitime : la sécurité, l'anti-fraude et l'amélioration du service reposent sur l'intérêt légitime de YonuKom à protéger ses utilisateurs et son produit.",
            "Consentement : les communications marketing et les cookies non essentiels reposent sur votre consentement, que vous pouvez retirer à tout moment.",
            "Obligation légale : certaines données (factures, journaux fiscaux) sont conservées pour satisfaire aux obligations comptables et fiscales sénégalaises.",
          ],
        },
        {
          id: "destinataires",
          title: "Destinataires des données",
          paragraphs: [
            "Vos données personnelles sont destinées aux personnes suivantes, dans la limite de leurs fonctions :",
          ],
          list: [
            "Les équipes internes de YonuKom (support, développement, comptabilité) — accès strictement limité aux données nécessaires à leur mission.",
            "Nos prestataires d'hébergement et de services techniques (fournisseur de serveurs, service d'email transactionnel, service de paiement mobile money) — sous contrat et engagements de confidentialité.",
            "Les autorités administratives et judiciaires sénégalaises, sur requête légale et dans la limite de ce que prévoit la loi.",
            "YonuKom ne vend jamais vos données personnelles à des tiers. Aucune donnée n'est transférée à des fins commerciales à des partenaires marketing.",
          ],
        },
        {
          id: "duree-conservation",
          title: "Durée de conservation",
          paragraphs: [
            "Vos données sont conservées pour la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées :",
          ],
          list: [
            "Données de compte commerçant : conservées pendant toute la durée d'utilisation du service, puis 3 ans après la fermeture du compte pour permettre la clôture comptable et fiscale.",
            "Données de transaction (ventes, paiements, journaux de caisse) : conservées 10 ans conformément aux obligations comptables du Code des obligations du commerçant sénégalais.",
            "Données techniques (logs de connexion, adresses IP) : conservées 13 mois maximum.",
            "Données de support (tickets, emails échangés) : conservées 3 ans après le dernier échange.",
            "Cookies et données d'analyse : 13 mois maximum.",
          ],
        },
        {
          id: "securite",
          title: "Sécurité des données",
          paragraphs: [
            "YonuKom met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre la perte, l'accès non autorisé, la divulgation, l'altération ou la destruction. Ces mesures incluent :",
          ],
          list: [
            "Chiffrement des données sensibles en base de données et lors du transit (TLS 1.3).",
            "Authentification forte des utilisateurs (mot de passe hashé avec bcrypt, option 2FA disponible pour les patrons).",
            "Journalisation complète des opérations de caisse avec horodatage et identité de l'opérateur (anti-fraude).",
            "Mode hors-ligne sécurisé : les données restent chiffrées sur l'appareil et se synchronisent automatiquement quand le réseau revient.",
            "Sauvegardes automatiques quotidiennes avec rétention 30 jours.",
            "Tests de sécurité réguliers et audit annuel par un cabinet indépendant.",
            "Formation des collaborateurs aux bonnes pratiques de protection des données.",
          ],
        },
        {
          id: "droits",
          title: "Vos droits",
          paragraphs: [
            "Conformément à la loi sénégalaise n° 2008-11, vous disposez des droits suivants sur vos données personnelles :",
          ],
          subsections: [
            {
              title: "Droit d'accès",
              paragraphs: [
                "Vous pouvez demander à YonuKom une copie de toutes les données personnelles que nous détenons à votre sujet. Cette demande sera traitée dans un délai maximum de 30 jours, gratuit, sauf si la demande est manifestement abusive ou infondée.",
              ],
            },
            {
              title: "Droit de rectification",
              paragraphs: [
                "Vous pouvez demander la correction de toute donnée inexacte ou incomplète vous concernant. Vous pouvez également modifier directement la plupart de vos informations depuis votre espace commerçant dans l'application YonuKom.",
              ],
            },
            {
              title: "Droit à l'effacement",
              paragraphs: [
                "Vous pouvez demander la suppression de vos données personnelles, sauf si cette suppression est incompatible avec nos obligations légales de conservation (notamment fiscales et comptables). Les données obligatoires seront alors anonymisées.",
              ],
            },
            {
              title: "Droit à la portabilité",
              paragraphs: [
                "Vous pouvez recevoir vos données personnelles dans un format structuré, lisible par machine, et les transmettre à un autre prestataire si vous le souhaitez.",
              ],
            },
            {
              title: "Droit d'opposition",
              paragraphs: [
                "Vous pouvez vous opposer au traitement de vos données pour des raisons légitimes, ou au traitement de vos données à des fins de marketing. Pour le marketing, votre opposition sera effective immédiatement.",
              ],
            },
          ],
        },
        {
          id: "exercice-droits",
          title: "Exercice de vos droits",
          paragraphs: [
            "Pour exercer vos droits, vous pouvez nous contacter à contact@2mails.com en indiquant « Droits RGPD / Données personnelles » dans l'objet du message, ou par courrier postal à l'adresse 2m Sicap Foire, Dakar, Sénégal. Vous devrez justifier de votre identité pour que nous puissions traiter votre demande en toute sécurité.",
            "En cas de désaccord avec la réponse de YonuKom, vous pouvez introduire une réclamation auprès de la Commission de protection des données personnelles (CDP) du Sénégal, dont les coordonnées sont disponibles sur le site officiel de la CDP.",
          ],
        },
        {
          id: "cookies",
          title: "Cookies et traceurs",
          paragraphs: [
            "Le site YonuKom utilise des cookies pour assurer son bon fonctionnement (session, préférences de langue, mode sombre/clair) et pour mesurer son audience de façon agrégée et anonymisée. Les cookies essentiels au fonctionnement sont déposés sans nécessité de consentement. Les cookies non essentiels (mesure d'audience, partage social) ne sont déposés qu'après votre consentement, recueilli via le bandeau dédié en bas de page.",
            "Vous pouvez à tout moment refuser ou retirer votre consentement en cliquant sur « Refuser » du bandeau cookies, ou en effaçant les cookies depuis les paramètres de votre navigateur. Le retrait du consentement n'affecte pas la licéité des traitements antérieurs.",
          ],
        },
      ]}
    />
  );
}
