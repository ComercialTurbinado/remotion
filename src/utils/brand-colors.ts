import type { ListingData } from "../types/listing";

/**
 * Lê `listing.design_config` (e aliases) — alinhado à documentação de integração / op6.
 */
export function resolveBrandColors(listing: ListingData): { primary: string; secondary: string } {
  const cfg = (listing.design_config ?? {}) as Record<string, unknown>;

  const candidatesPrimary = [
    cfg.primaryColor,
    cfg.primary,
    cfg.corPrincipal,
    cfg.primary_color,
    (cfg.colors as { primary?: string } | undefined)?.primary,
    (cfg.brand as { primary?: string } | undefined)?.primary,
  ];
  const candidatesSecondary = [
    cfg.secondaryColor,
    cfg.secondary,
    cfg.corSecundaria,
    cfg.secondary_color,
    (cfg.colors as { secondary?: string } | undefined)?.secondary,
    (cfg.brand as { secondary?: string } | undefined)?.secondary,
  ];

  const pick = (arr: unknown[]) => {
    for (const v of arr) {
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return undefined;
  };

  return {
    primary: pick(candidatesPrimary) ?? "#ff7a00",
    secondary: pick(candidatesSecondary) ?? "#0b0b0b",
  };
}

export function resolveBrandPrimaryColor(listing: ListingData): string {
  return resolveBrandColors(listing).primary;
}
