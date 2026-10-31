import type { Metadata } from "next";
import { db } from "@/lib/db";

const SITE_BASE = "https://yonukom.qrtags.pro";

/**
 * Dynamic SEO metadata for a tenant's public store at /b/[slug].
 *
 * Note: In Next.js 16 App Router, `params` is a Promise and must be awaited.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let tenant: {
    name: string;
    storePrimaryColor: string;
    storeLogoUrl: string | null;
    isStoreActive: boolean;
  } | null = null;

  try {
    tenant = await db.tenant.findUnique({
      where: { storeSlug: slug },
      select: {
        name: true,
        storePrimaryColor: true,
        storeLogoUrl: true,
        isStoreActive: true,
      },
    });
  } catch (error) {
    console.error("[store layout] Failed to fetch tenant metadata:", error);
  }

  if (!tenant) {
    return {
      title: "Boutique introuvable | YonuKom",
      metadataBase: new URL(SITE_BASE),
    };
  }

  const title = `${tenant.name} | Boutique en ligne`;
  const description = `Découvrez les produits de ${tenant.name}. Commandez en ligne avec livraison et retrait. Paiement à la livraison ou Wave/Orange Money.`;

  return {
    title,
    description,
    keywords: [
      tenant.name,
      "boutique en ligne",
      "commande en ligne",
      "Dakar",
      "Sénégal",
      "livraison",
      "Wave",
      "YonuKom",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      images: tenant.storeLogoUrl
        ? [{ url: tenant.storeLogoUrl }]
        : ["/og-image.png"],
      siteName: tenant.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    metadataBase: new URL(SITE_BASE),
  };
}

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
