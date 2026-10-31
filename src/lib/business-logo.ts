"use client";
import { useState, useEffect } from "react";

/**
 * Récupère le logo (data URL base64) d'un commerce via /api/business/profile.
 * Retourne null pendant le chargement ou si aucun logo n'est défini.
 *
 * @param businessId L'identifiant du commerce (user.businessId)
 */
export function useBusinessLogo(businessId?: string) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!businessId || businessId === "demo") {
      setLogoUrl(null);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch(`/api/business/profile?businessId=${encodeURIComponent(businessId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (d?.logoUrl && typeof d.logoUrl === "string" && d.logoUrl.length > 0) {
          setLogoUrl(d.logoUrl);
        } else {
          setLogoUrl(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLogoUrl(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return { logoUrl, loading };
}
