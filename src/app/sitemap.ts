import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE_BASE = "https://yonukom.qrtags.pro";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Homepage entry — always present
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_BASE}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
  ];

  // Add one entry per active tenant store
  try {
    const tenants = await db.tenant.findMany({
      where: {
        storeSlug: { not: null },
        isStoreActive: true,
      },
      select: {
        storeSlug: true,
        updatedAt: true,
      },
    });

    for (const tenant of tenants) {
      if (!tenant.storeSlug) continue;
      entries.push({
        url: `${SITE_BASE}/b/${tenant.storeSlug}`,
        lastModified: tenant.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    // If the DB call fails, fall back to just the homepage entry
    console.error("[sitemap] Failed to fetch tenants:", error);
    return entries;
  }

  return entries;
}
