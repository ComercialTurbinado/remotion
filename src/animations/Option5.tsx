import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  normalizeListing,
  displayPrice,
  fullAddress,
  resolveUrl,
  type ListingData,
  type InfoCard,
  type AmenityItem,
} from "../types/listing";
import type { CompositionProps } from "../types/composition-props";

const MAX_PHOTOS = 10;
const SLIDE_FRAMES = 90;
const SLIDE_FADE_FRAMES = 16;
const SLIDE_ZOOM_END = 1.06;

const PRIMARY = "#1152d4";
const GLASS_TEXT = "#ffffff";
const GLASS_MUTED = "rgba(255,255,255,0.82)";

const glassPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.42)",
  backgroundColor: "rgba(255,255,255,0.14)",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  boxShadow:
    "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
};

const defaultInfoCards: InfoCard[] = [
  { label: "Quartos", value: "6", icon: "bed" },
  { label: "Banheiros", value: "8", icon: "bathtub" },
  { label: "Área total", value: "14.200 m²", icon: "square_foot" },
  { label: "Vagas", value: "12", icon: "directions_car" },
];

const defaultAmenities: { icon: string; name: string }[] = [
  { icon: "pool", name: "Piscina" },
  { icon: "fitness_center", name: "Academia" },
  { icon: "movie", name: "Cinema" },
  { icon: "wine_bar", name: "Adega" },
];

function parseAmenity(item: AmenityItem): { icon: string; name: string } {
  if (typeof item === "string") return { icon: "check_circle", name: item };
  return { icon: item.icon ?? "check_circle", name: item.name };
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2);
}

function motionProgress(frame: number, startFrame: number, duration: number): number {
  const u = (frame - startFrame) / duration;
  return easeOut(u);
}

/**
 * Bloco que entra sozinho: opacidade + translate; altura efetiva cresce com o progresso
 * para o painel principal ir “abrir” conforme cada item aparece.
 */
function RevealRow({
  frame,
  startFrame,
  duration,
  maxExpandPx,
  children,
}: {
  frame: number;
  startFrame: number;
  duration: number;
  maxExpandPx: number;
  children: React.ReactNode;
}) {
  const p = motionProgress(frame, startFrame, duration);
  const h = p * maxExpandPx;
  return (
    <div
      style={{
        overflow: "hidden",
        maxHeight: h,
        opacity: Math.min(1, p * 1.15),
        transform: `translateY(${(1 - p) * 14}px)`,
        marginBottom: p > 0.95 ? 14 : p * 14,
      }}
    >
      {children}
    </div>
  );
}

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/1080/1920?random=201",
  "https://picsum.photos/1080/1920?random=202",
  "https://picsum.photos/1080/1920?random=203",
  "https://picsum.photos/1080/1920?random=204",
];

/** Espera antes do painel e do primeiro bloco de informação (alinhado ao `fps` da composição). */
const SECONDS_BEFORE_INFOS = 3;
const PANEL_SLIDE_FRAMES = 42;

function panelSlideProgress(
  frame: number,
  panelDelayFrames: number,
  panelReadyFrame: number
): number {
  if (frame < panelDelayFrames) return 0;
  if (frame >= panelReadyFrame) return 1;
  return easeOut((frame - panelDelayFrames) / PANEL_SLIDE_FRAMES);
}

/** Início de cada item (stagger) — mesma ordem da EstateInfos da op1 */
const D_ITEM = 12;
const T_ENTRANCE = 14;

export const OP5_DEFAULT_DURATION_FRAMES = 900;

type Option5Props = CompositionProps;

export const Option5: React.FC<Option5Props> = ({ input }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  const panelDelayFrames = Math.round(SECONDS_BEFORE_INFOS * fps);
  const panelReadyFrame = panelDelayFrames + PANEL_SLIDE_FRAMES;
  const startPrice = panelDelayFrames;
  const startAddress = startPrice + D_ITEM;
  const startCard = (i: number) => startAddress + D_ITEM + i * D_ITEM;
  const startSectionTitle = startCard(4) + D_ITEM;
  const startAmenity = (i: number) => startSectionTitle + D_ITEM + i * D_ITEM;

  const listing: ListingData = normalizeListing(input);
  const baseUrl = input?.baseUrl;
  const imageUrls =
    listing.carousel_images?.length
      ? listing.carousel_images.map((u) => resolveUrl(u, baseUrl))
      : listing.selected_images?.length
        ? listing.selected_images.map((u) => resolveUrl(u, baseUrl))
        : DEFAULT_IMAGE_URLS;
  const media = (imageUrls.length > 0 ? imageUrls : DEFAULT_IMAGE_URLS).slice(0, MAX_PHOTOS);
  const m = media.length;

  const price = displayPrice(listing);
  const address = fullAddress(listing);
  const infoCards = listing.infoCards ?? defaultInfoCards;
  const amenitiesList = (listing.amenitiesList ?? []).map(parseAmenity);
  const amenities =
    amenitiesList.length > 0 ? amenitiesList.slice(0, 4) : defaultAmenities;

  const index = Math.floor(frame / SLIDE_FRAMES) % m;
  const nextIndex = (index + 1) % m;
  const frameInMedia = frame % SLIDE_FRAMES;
  const progress = frameInMedia / SLIDE_FRAMES;
  const zoom = 1 + (SLIDE_ZOOM_END - 1) * progress;
  const fadeStart = SLIDE_FRAMES - SLIDE_FADE_FRAMES;
  const currentOpacity =
    frameInMedia < fadeStart ? 1 : 1 - (frameInMedia - fadeStart) / SLIDE_FADE_FRAMES;
  const nextOpacity =
    frameInMedia < fadeStart ? 0 : (frameInMedia - fadeStart) / SLIDE_FADE_FRAMES;

  const boxMaxWidth = Math.min(750, width - 48);

  const slideP = panelSlideProgress(frame, panelDelayFrames, panelReadyFrame);
  const slideFromY = -Math.min(520, height * 0.38);
  const panelTranslateY = (1 - slideP) * slideFromY;
  const panelOpacity = Math.min(1, slideP * 1.08);

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
            }}
          />
        ) : null}
      </div>

      {/* Painel vidro: após 3 s desliza do topo; preço e demais infos entram nesse mesmo frame */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: Math.min(120, height * 0.06),
          transform: `translate(-50%, ${panelTranslateY}px)`,
          width: boxMaxWidth,
          maxWidth: "95%",
          boxSizing: "border-box",
          padding: "20px 22px 22px",
          borderRadius: 16,
          color: GLASS_TEXT,
          opacity: panelOpacity,
          willChange: "transform, opacity",
          ...glassPanel,
        }}
      >
        <RevealRow frame={frame} startFrame={startPrice} duration={T_ENTRANCE} maxExpandPx={150}>
          <h1
            style={{
              margin: 0,
              color: GLASS_TEXT,
              fontSize: 78,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              textAlign: "center",
              wordBreak: "break-word",
            }}
          >
            {price}
          </h1>
        </RevealRow>

        <RevealRow frame={frame} startFrame={startAddress} duration={T_ENTRANCE} maxExpandPx={144}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              color: GLASS_MUTED,
              marginTop: 4,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 42, flexShrink: 0 }}>
              location_on
            </span>
            <h2
              style={{
                margin: 0,
                fontSize: 33,
                fontWeight: 600,
                lineHeight: 1.25,
                textShadow: "0 1px 8px rgba(0,0,0,0.3)",
                wordBreak: "break-word",
              }}
            >
              {address}
            </h2>
          </div>
        </RevealRow>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: "repeat(1, 1fr)",
            gap: 12,
            marginTop: 4,
          }}
        >
          {infoCards.slice(0, 4).map((item, i) => (
            <RevealRow
              key={item.label}
              frame={frame}
              startFrame={startCard(i)}
              duration={T_ENTRANCE}
              maxExpandPx={162}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 12px",
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    backgroundColor: PRIMARY,
                    borderRadius: 10,
                    width: 57,
                    height: 57,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 34, color: "#fff" }}
                  >
                    {item.icon ?? "info"}
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontSize: 17,
                      fontWeight: 600,
                      color: GLASS_MUTED,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      textAlign: "center",
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 33,
                      fontWeight: 700,
                      color: GLASS_TEXT,
                      textShadow: "0 1px 6px rgba(0,0,0,0.25)",
                      wordBreak: "break-word",
                      textAlign: "center",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            </RevealRow>
          ))}
        </div>

        <RevealRow
          frame={frame}
          startFrame={startSectionTitle}
          duration={T_ENTRANCE}
          maxExpandPx={78}
        >
          <h3
            style={{
              margin: "10px 0 12px 0",
              fontSize: 30,
              fontWeight: 700,
              color: GLASS_TEXT,
              borderLeft: `4px solid ${PRIMARY}`,
              paddingLeft: 12,
              textShadow: "0 1px 8px rgba(0,0,0,0.3)",
            }}
          >
            Lazer e comodidades
          </h3>
        </RevealRow>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {amenities.map((item, i) => (
            <RevealRow
              key={item.name}
              frame={frame}
              startFrame={startAmenity(i)}
              duration={T_ENTRANCE}
              maxExpandPx={144}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 10px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.22)",
                  backgroundColor: "rgba(255,255,255,0.25)",
                  boxSizing: "border-box",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 47, color: PRIMARY, marginBottom: 6 }}
                >
                  {item.icon}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 600,
                    color: GLASS_TEXT,
                    textAlign: "center",
                    textShadow: "0 1px 6px rgba(0,0,0,0.25)",
                    wordBreak: "break-word",
                  }}
                >
                  {item.name}
                </p>
              </div>
            </RevealRow>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
