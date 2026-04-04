import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { normalizeListing, displayPrice, resolveUrl, type ListingData } from "../types/listing";
import type { CompositionProps } from "../types/composition-props";

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/1080/1920?random=61",
  "https://picsum.photos/1080/1920?random=62",
  "https://picsum.photos/1080/1920?random=63",
  "https://picsum.photos/1080/1920?random=64",
];

const FRAMES_PER_MEDIA = 90;
const FADE_FRAMES = 18;
const ZOOM_END = 1.08;

export const OP6_DEFAULT_DURATION_FRAMES = 900;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function resolveBrandColors(listing: ListingData): { primary: string; secondary: string } {
  const cfg = (listing.design_config ?? {}) as Record<string, unknown>;

  const candidatesPrimary = [
    cfg.primaryColor,
    cfg.primary,
    cfg.corPrincipal,
    cfg.primary_color,
    (cfg.colors as any)?.primary,
    (cfg.brand as any)?.primary,
  ];
  const candidatesSecondary = [
    cfg.secondaryColor,
    cfg.secondary,
    cfg.corSecundaria,
    cfg.secondary_color,
    (cfg.colors as any)?.secondary,
    (cfg.brand as any)?.secondary,
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

function pickInfoValue(listing: ListingData, icon: string, labelRegex: RegExp): string {
  const cards = listing.infoCards ?? [];
  const byLabel = cards.find((c) => labelRegex.test(c.label));
  if (byLabel?.value) return byLabel.value;
  const byIcon = cards.find((c) => c.icon === icon);
  return byIcon?.value ?? "—";
}

function pickQuartos(listing: ListingData): string {
  return pickInfoValue(listing, "bed", /quarto/i);
}

function pickBanheiros(listing: ListingData): string {
  return pickInfoValue(listing, "bathtub", /banh|banheiro/i);
}

function pickVagas(listing: ListingData): string {
  return pickInfoValue(listing, "directions_car", /vaga/i);
}

function pickArea(listing: ListingData): string {
  return pickInfoValue(listing, "square_foot", /área|area/i);
}

function normalizeInstagram(v: string | undefined): string {
  const s = v?.trim() ?? "";
  if (!s) return "";
  return s.startsWith("@") ? s : `@${s}`;
}

function googleSearchUrl(website: string | undefined): string {
  const raw = website?.trim() ?? "";
  if (!raw) return "";
  const withoutProtocol = raw.replace(/^https?:\/\//i, "");
  return `https://www.google.com/search?q=${encodeURIComponent(withoutProtocol)}`;
}

function splitPrice(price: string): { main: string; cents?: string } {
  // Tenta formatar algo como "R$ 1.700.000,00"
  const cleaned = price.replace(/\s/g, "");
  const parts = cleaned.split(",");
  if (parts.length >= 2) return { main: parts[0], cents: parts.slice(1).join(",") };
  return { main: cleaned };
}

export type Option6Props = CompositionProps;

export const Option6: React.FC<Option6Props> = ({ input, subtitlesSrt }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const listing: ListingData = normalizeListing(input);
  const baseUrl = input?.baseUrl;

  const { primary, secondary } = resolveBrandColors(listing);

  const client = listing.client ?? {};
  const logoUrl = resolveUrl(client.logo_url, baseUrl) || undefined;
  const phone = typeof client.phone === "string" ? client.phone.trim() : "";
  const website = typeof client.website === "string" ? client.website.trim() : "";
  const instagram = normalizeInstagram(typeof client.instagram === "string" ? client.instagram : undefined);

  const imageUrls =
    listing.carousel_images?.length
      ? listing.carousel_images.map((u) => resolveUrl(u, baseUrl))
      : listing.selected_images?.length
        ? listing.selected_images.map((u) => resolveUrl(u, baseUrl))
        : DEFAULT_IMAGE_URLS;
  const media = imageUrls.length > 0 ? imageUrls : DEFAULT_IMAGE_URLS;

  const index = Math.floor(frame / FRAMES_PER_MEDIA) % media.length;
  const nextIndex = (index + 1) % media.length;
  const frameInMedia = frame % FRAMES_PER_MEDIA;
  const progress = frameInMedia / FRAMES_PER_MEDIA;

  const fadeStart = FRAMES_PER_MEDIA - FADE_FRAMES;
  const currentOpacity = frameInMedia < fadeStart ? 1 : 1 - (frameInMedia - fadeStart) / FADE_FRAMES;
  const nextOpacity = frameInMedia < fadeStart ? 0 : (frameInMedia - fadeStart) / FADE_FRAMES;
  const zoom = 1 + (ZOOM_END - 1) * progress;

  const cardP = clamp01(frame / 30);
  const cardTranslateY = (1 - cardP) * 40;

  const title = (() => {
    const cfg = (listing.design_config ?? {}) as Record<string, unknown>;
    const v =
      (cfg.title as any) ??
      (cfg.headline as any) ??
      (cfg.titulo as any) ??
      (cfg.propertyTitle as any) ??
      (cfg.nomeTipo as any);
    return typeof v === "string" && v.trim() ? v.trim() : "CASA ESTILO SOBRADO";
  })();

  const code = listing.propertyCodes ?? "—";

  const quartos = pickQuartos(listing);
  const banheiros = pickBanheiros(listing);
  const vagas = pickVagas(listing);
  const areaTotal = pickArea(listing);

  const price = displayPrice(listing);
  const priceParts = splitPrice(price);

  const topBandOpacity = clamp01((frame - 0) / 12) * 1;
  const middleBandOpacity = clamp01((frame - 8) / 14) * 1;
  const bottomBandOpacity = clamp01((frame - 18) / 16) * 1;

  // Ajuste para alinhar o container com o preview (970px -> 980px).
  const containerWidth = Math.min(980, width - 62);

  const priceMain = priceParts.main.replace(/^R\$/i, "").trim();
  const priceCents = priceParts.cents ? priceParts.cents : undefined;
  const googleSearch = googleSearchUrl(website);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "'Public Sans', sans-serif" }}>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <img
          src={media[index]!}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
            opacity: currentOpacity,
          }}
        />
        {nextOpacity > 0 ? (
          <img
            src={media[nextIndex]!}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: nextOpacity,
              transform: "scale(1)",
            }}
          />
        ) : null}
      </div>

      {/* Card principal (parecido com a imagem enviada) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 82,
          transform: `translate(-50%, ${cardTranslateY}px)`,
          width: containerWidth,
          maxWidth: "95%",
          opacity: cardP,
          pointerEvents: "none",
        }}
      >
        <div style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.25)" }}>
          {/* Faixa Superior */}
          <div
            style={{
              height: 86,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 18px",
              opacity: topBandOpacity,
              gap: 10,
              marginTop: 10,
              marginBottom: 10,
              marginLeft: 0,
              marginRight: 10,
              borderRadius: 10,
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              borderBottomLeftRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: "#111827",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                lineHeight: 1.1,
                wordBreak: "break-word",
              }}
            >
              {title} | COD {String(code)}
            </div>
          </div>

          {/* Faixa Central */}
          <div style={{ display: "flex", height: "auto", opacity: middleBandOpacity }}>
            {/* Preço */}
            <div
              style={{
                flex: 0.46,
                background: primary,
                padding: "22px 18px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                fontSize: 25,
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "0.06em" }}>VENDA</div>
              <div style={{ color: "#fff", fontWeight: 900, fontSize: 35, lineHeight: 1 }}>
                <span>{priceMain}</span>
                {priceCents ? <span style={{ fontSize: 22, fontWeight: 900, marginLeft: 6 }}>{`,` + priceCents}</span> : null}
              </div>
            </div>

            {/* Características */}
            <div
              style={{
                flex: 0.54,
                background: secondary,
                padding: "16px 18px",
                boxSizing: "border-box",
                color: "#fff",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, opacity: 0.98 }}>Apto com</div>
                  <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 0.95 }}>{areaTotal}</div>
                </div>
              </div>

              <div style={{ height: 1, background: "rgba(255,255,255,0.85)", margin: "8px 0 10px 0" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                {[
                  { icon: "bed", value: quartos },
                  { icon: "directions_car", value: vagas },
                  { icon: "bathtub", value: banheiros },
                ].map((it) => (
                  <div key={it.icon} style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: 50,
                        color: "#fff",
                        height: 50,
                        width: 50,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {it.icon}
                    </span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", whiteSpace: "nowrap" }}>
                      {it.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Faixa Inferior (contatos) */}
          <div
            style={{
              height: 84,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px",
              opacity: bottomBandOpacity,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 34, color: primary }}>
                phone
              </span>
              <span style={{ fontSize: 26, fontWeight: 900, color: primary }}>{phone || "—"}</span>
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 500,
                color: primary,
                textAlign: "right",
                maxWidth: 550,
                lineHeight: 1,
              }}
            >
              {instagram || "—"} | {googleSearch || " "}
            </div>
          </div>
        </div>
      </div>

      {/* `subtitlesSrt` influencia apenas a duração (calculado no Root), sem overlay no layout. */}
    </AbsoluteFill>
  );
};

