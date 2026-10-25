"use client";

import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImpersonationBannerProps {
  tenantName: string;
  onEndImpersonation: () => void;
}

export function ImpersonationBanner({
  tenantName,
  onEndImpersonation,
}: ImpersonationBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-red-600 px-4 py-2 text-white shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          ⚠️ Vous êtes connecté en tant que <strong>{tenantName}</strong>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        onClick={onEndImpersonation}
      >
        Retour au Superadmin
      </Button>
    </div>
  );
}
