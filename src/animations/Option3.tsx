import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SrtOverlay } from "../components/SrtOverlay";
import {
  normalizeListing,
  displayPrice,
  resolveUrl,
  type ListingData,
} from "../types/listing";
import type { CompositionProps } from "../types/composition-props";

type Option3Props = CompositionProps;

const FRAMES_PER_MEDIA = 90;
const FADE_FRAMES = 18;
const ZOOM_END = 1.08;

/** Duração da entrada do box de infos (baixo → posição final) */
const INFO_ENTRANCE_FRAMES = 78;
/** 80% do tempo: percorre a maior parte do trajeto; 20%: amortecimento até estacionar */
const INFO_PHASE_FAST = 0.8;
/** Deslocamento inicial (px abaixo da posição final) */
const INFO_SLIDE_FROM = 320;

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/1080/1920?random=21",
  "https://picsum.photos/1080/1920?random=22",
  "https://picsum.photos/1080/1920?random=23",
  "https://picsum.photos/1080/1920?random=24",
];

const pickInfoValue = (listing: ListingData, key: "quartos" | "area"): string => {
  const cards = listing.infoCards ?? [];
  if (key === "quartos") {
    const byLabel = cards.find((c) => /quarto/i.test(c.label));
    if (byLabel?.value) return byLabel.value;
    const byIcon = cards.find((c) => c.icon === "bed");
    return byIcon?.value ?? "—";
  }
  const byLabel = cards.find((c) => /área|area/i.test(c.label));
  if (byLabel?.value) return byLabel.value;
  const byIcon = cards.find((c) => c.icon === "square_foot");
  return byIcon?.value ?? "—";
};

const pickShortDescription = (listing: ListingData): string => {
  const maybeShort = typeof listing.description === "string" ? listing.description : "";
  if (maybeShort.trim()) return maybeShort.trim();
  const addressParts = [listing.address, listing.city, listing.state].filter(Boolean);
  return addressParts.join(", ") || "Imovel em destaque";
};

/**
 * Progresso 0→1: fase rápida (80% do tempo) cobre ~90% do deslocamento;
 * fase lenta (20%) completa com amortecimento suave (leve “bounce” visual).
 */
function infoEntranceProgress(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < INFO_PHASE_FAST) {
    const u = t / INFO_PHASE_FAST;
    return 0.9 * (1 - Math.pow(1 - u, 2.2));
  }
  const u = (t - INFO_PHASE_FAST) / (1 - INFO_PHASE_FAST);
  const cubic = 1 - Math.pow(1 - u, 3);
  const damp = Math.sin(u * Math.PI) * 0.018 * (1 - u);
  return 0.9 + 0.1 * cubic + damp;
}

const glassPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.42)",
  backgroundColor: "rgba(255,255,255,0.14)",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  boxShadow:
    "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
};

export const Option3: React.FC<Option3Props> = ({ input, subtitlesSrt }) => {
  const frame = useCurrentFrame();
  const listing = normalizeListing(input);
  const baseUrl = input?.baseUrl;
  const client = listing.client ?? {};
  const logoUrl = resolveUrl(client.logo_url, baseUrl) || undefined;
  const phone =
    typeof client.phone === "string" && client.phone.trim() ? client.phone.trim() : "";

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

  const description = pickShortDescription(listing);
  const code = listing.propertyCodes ?? "—";
  const quartos = pickInfoValue(listing, "quartos");
  const areaTotal = pickInfoValue(listing, "area");
  const valor = displayPrice(listing);

  const entranceT = Math.min(1, frame / INFO_ENTRANCE_FRAMES);
  const infoTravel = infoEntranceProgress(entranceT);
  const infoTranslateY = (1 - infoTravel) * INFO_SLIDE_FROM;
  const infoBoxOpacity = Math.min(1, frame / 14);

  const topBarOpacity = Math.min(1, frame / 18);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <img
          src={media[index]}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
            opacity: currentOpacity,
          }}
        />
        {nextOpacity > 0 && (
          <img
            src={media[nextIndex]}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1)",
              opacity: nextOpacity,
            }}
          />
        )}
      </div>

      {/* Topo: vidro jateado, 10px das laterais */}
      <div
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 10,
          height: 112,
          borderRadius: 16,
          paddingLeft: 22,
          paddingRight: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          opacity: topBarOpacity,
          ...glassPanel,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                maxHeight: 72,
                maxWidth: 220,
                width: "auto",
                objectFit: "contain",
              }}
            />
          ) : (
            <span
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "rgba(255,255,255,0.95)",
                textShadow: "0 1px 6px rgba(0,0,0,0.25)",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {listing.imobname ?? "Imobiliária"}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          <span
            style={{
              fontSize: 29,
              fontWeight: 700,
              color: "#25D366",
              letterSpacing: "0.02em",
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            WhatsApp
          </span>
          {phone ? (
            <span
              style={{
                fontSize: 34,
                fontWeight: 600,
                color: "rgba(255,255,255,0.96)",
                textShadow: "0 1px 5px rgba(0,0,0,0.3)",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {phone}
            </span>
          ) : (
            <span style={{ fontSize: 26, color: "rgba(255,255,255,0.55)" }}>—</span>
          )}
        </div>
      </div>

      {/* Box de infos (igual op2): vidro jateado, sobe de baixo com 80/20 */}
      <div
        style={{
          position: "absolute",
          left: 52,
          bottom: 100,
          width: "30vw",
          minWidth: 300,
          maxWidth: 420,
          color: "#fff",
          padding: "18px 20px",
          borderRadius: 12,
          opacity: infoBoxOpacity,
          transform: `translateY(${infoTranslateY}px)`,
          willChange: "transform",
          ...glassPanel,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 39,
            lineHeight: 1.2,
            fontWeight: 500,
            textShadow: "0 1px 2px rgba(0,0,0,0.35)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {description}
        </p>

        <p
          style={{
            margin: "12px 0 0 0",
            fontSize: 27,
            lineHeight: 1.3,
            fontWeight: 400,
            textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          Cod. {code} | {quartos} quartos | {areaTotal}
        </p>

        <p
          style={{
            margin: "8px 0 0 0",
            fontSize: 36,
            lineHeight: 1.2,
            fontWeight: 600,
            textShadow: "0 1px 6px rgba(0,0,0,0.34)",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {valor}
        </p>
      </div>

      <SrtOverlay content={subtitlesSrt} bottom={280} revealMode="words" />
    </AbsoluteFill>
  );
};
