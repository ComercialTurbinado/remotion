import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { SrtOverlay } from "../components/SrtOverlay";
import {
  normalizeListing,
  displayPrice,
  resolveUrl,
  type ListingData,
} from "../types/listing";
import type { CompositionProps } from "../types/composition-props";

type Option2SubtleProps = CompositionProps;

const FRAMES_PER_MEDIA = 90; // ~3s em 30fps
const FADE_FRAMES = 18; // fade suave no fim de cada mídia
const ZOOM_END = 1.08; // zoom-in lento durante os ~3s

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/1080/1920?random=1",
  "https://picsum.photos/1080/1920?random=2",
  "https://picsum.photos/1080/1920?random=3",
  "https://picsum.photos/1080/1920?random=4",
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

export const Option2Subtle: React.FC<Option2SubtleProps> = ({ input, subtitlesSrt }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const listing = normalizeListing(input);
  const baseUrl = input?.baseUrl;
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

      <div
        style={{
          position: "absolute",
          left: 52,
          top: 52,
          width: "30vw",
          minWidth: 300,
          maxWidth: 420,
          color: "#fff",
          padding: "18px 20px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.24)",
          backgroundColor: "rgba(0, 0, 0, 0.16)",
          backdropFilter: "blur(1px)",
          boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
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

      <SrtOverlay content={subtitlesSrt} bottom={220} />
    </AbsoluteFill>
  );
};
