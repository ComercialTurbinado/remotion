import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ImobFinalSignature } from "../components/ImobFinalSignature";
import { SrtOverlay } from "../components/SrtOverlay";
import { normalizeListing, displayPrice, resolveUrl, type ListingData } from "../types/listing";
import type { CompositionProps } from "../types/composition-props";

const MAX_PHOTOS = 12;

/** Abertura: 0,4 s por foto, sem zoom/pan (imagem estática) */
const FAST_SECONDS = 0.4;
const FAST_FRAMES_PER_PHOTO = Math.round(FAST_SECONDS * 30);
const FAST_PHOTO_COUNT = 4;
const FAST_PHASE_TOTAL = FAST_FRAMES_PER_PHOTO * FAST_PHOTO_COUNT;

/** Fase lenta: 3 s por foto */
const SLOW_FRAMES_PER_PHOTO = 90;
const SLOW_PHOTO_COUNT = 8;
const SLOW_PHASE_TOTAL = SLOW_FRAMES_PER_PHOTO * SLOW_PHOTO_COUNT;

/** Crossfade no fim do slide: troca suave + zoom da próxima continua do mesmo scale (sem salto 1→1,1) */
const SLOW_CROSSFADE_FRAMES = 18;

/** Início do fade do slideshow → tela de assinatura (como op1) */
export const OP4_FADEOUT_START_FRAME = FAST_PHASE_TOTAL + SLOW_PHASE_TOTAL;
const FADE_OUT_MAIN_FRAMES = 22;

/** Duração total padrão da composição (slideshow + assinatura) */
export const OP4_DEFAULT_DURATION_FRAMES =
  OP4_FADEOUT_START_FRAME + FADE_OUT_MAIN_FRAMES + 74;

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/1080/1920?random=41",
  "https://picsum.photos/1080/1920?random=42",
  "https://picsum.photos/1080/1920?random=43",
  "https://picsum.photos/1080/1920?random=44",
  "https://picsum.photos/1080/1920?random=45",
  "https://picsum.photos/1080/1920?random=46",
  "https://picsum.photos/1080/1920?random=47",
  "https://picsum.photos/1080/1920?random=48",
];

/** Smoothstep: derivada contínua nas pontas, evita “passos” no zoom */
const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Zoom linear no tempo com smoothstep (sem ease quad que pode parecer truncado em 30 fps) */
function smoothZoomOut(
  frameInSegment: number,
  segmentLength: number,
  scaleStart: number,
  scaleEnd: number
): number {
  if (segmentLength <= 1) return scaleEnd;
  const u = frameInSegment / (segmentLength - 1);
  return scaleStart + (scaleEnd - scaleStart) * smoothstep(u);
}

const ZOOM_START = 1.08;
const ZOOM_END = 1;

/** Painel inferior: espera 5 s antes de começar a aparecer; depois sobe como op3 */
const INFO_BOX_DELAY_SECONDS = 5;
const INFO_BOX_DELAY_FRAMES = Math.round(INFO_BOX_DELAY_SECONDS * 30);
const INFO_ENTRANCE_FRAMES = 78;
const INFO_PHASE_FAST = 0.8;
const INFO_SLIDE_FROM = 320;

/** Margens do box em relação à borda da tela */
const INFO_BOX_MARGIN_LEFT = 55;
const INFO_BOX_MARGIN_RIGHT = 36;
const INFO_BOX_MARGIN_BOTTOM = 240;

const glassPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.42)",
  backgroundColor: "rgba(255,255,255,0.14)",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  boxShadow:
    "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.35)",
};

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

function pickInfoValue(listing: ListingData, key: "quartos" | "area"): string {
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
}

function pickShortDescription(listing: ListingData): string {
  const maybeShort = typeof listing.description === "string" ? listing.description : "";
  if (maybeShort.trim()) return maybeShort.trim();
  const addressParts = [listing.address, listing.city, listing.state].filter(Boolean);
  return addressParts.join(", ") || "Imovel em destaque";
}

type Option4Props = CompositionProps;

export const Option4: React.FC<Option4Props> = ({ input, subtitlesSrt }) => {
  const frame = useCurrentFrame();

  const listing: ListingData = normalizeListing(input);
  const baseUrl = input?.baseUrl;
  const imageUrls =
    listing.carousel_images?.length
      ? listing.carousel_images.map((u) => resolveUrl(u, baseUrl))
      : listing.selected_images?.length
        ? listing.selected_images.map((u) => resolveUrl(u, baseUrl))
        : DEFAULT_IMAGE_URLS;
  const urls = (imageUrls.length > 0 ? imageUrls : DEFAULT_IMAGE_URLS).slice(0, MAX_PHOTOS);
  const n = urls.length;

  const client = listing.client ?? {};
  const imobname = listing.imobname ?? "Estate Elite";
  const website = client.website ?? "www.estateelite.com";
  const logoUrl = resolveUrl(client.logo_url, baseUrl) || undefined;
  const phone =
    typeof client.phone === "string" && client.phone.trim() ? client.phone.trim() : "";

  const description = pickShortDescription(listing);
  const code = listing.propertyCodes ?? "—";
  const quartos = pickInfoValue(listing, "quartos");
  const areaTotal = pickInfoValue(listing, "area");
  const valor = displayPrice(listing);

  const frameForInfoEntrance = Math.max(0, frame - INFO_BOX_DELAY_FRAMES);
  const entranceT = Math.min(1, frameForInfoEntrance / INFO_ENTRANCE_FRAMES);
  const infoTravel = infoEntranceProgress(entranceT);
  const infoTranslateY = (1 - infoTravel) * INFO_SLIDE_FROM;

  const inFadeOut = frame >= OP4_FADEOUT_START_FRAME;
  const bottomBarOpacity =
    inFadeOut || frame < INFO_BOX_DELAY_FRAMES
      ? 0
      : Math.min(1, (frame - INFO_BOX_DELAY_FRAMES) / 14);
  const fadeProgress = inFadeOut
    ? Math.min(1, (frame - OP4_FADEOUT_START_FRAME) / FADE_OUT_MAIN_FRAMES)
    : 0;
  const slideshowOpacity = inFadeOut ? 1 - fadeProgress : 1;
  const finalScreenOpacity = inFadeOut ? 1 : 0;

  const frameInFinal = Math.max(0, frame - OP4_FADEOUT_START_FRAME);

  const fadeStartSlow = SLOW_FRAMES_PER_PHOTO - SLOW_CROSSFADE_FRAMES;
  const incomingZoomLen = Math.max(2, SLOW_FRAMES_PER_PHOTO - fadeStartSlow);

  /** Slow phase frame index (trava no último slide durante fade-out para assinatura) */
  const relClamped =
    frame < FAST_PHASE_TOTAL
      ? -1
      : Math.min(frame - FAST_PHASE_TOTAL, SLOW_PHASE_TOTAL - 1);
  const inSlow = relClamped >= 0 && n > 0;
  const slot = inSlow ? Math.floor(relClamped / SLOW_FRAMES_PER_PHOTO) : 0;
  const t = inSlow ? relClamped % SLOW_FRAMES_PER_PHOTO : 0;
  const idxCur = inSlow ? (FAST_PHOTO_COUNT + slot) % n : 0;
  const idxNext = inSlow ? (FAST_PHOTO_COUNT + slot + 1) % n : 0;

  const inSlowVisible = inSlow && !inFadeOut;

  const scaleCur = inSlow
    ? smoothZoomOut(t, SLOW_FRAMES_PER_PHOTO, ZOOM_START, ZOOM_END)
    : 1;
  const scaleHandoff = smoothZoomOut(fadeStartSlow, SLOW_FRAMES_PER_PHOTO, ZOOM_START, ZOOM_END);
  const scaleNext =
    inSlow && t >= fadeStartSlow
      ? scaleHandoff +
        (ZOOM_END - scaleHandoff) *
          smoothstep((t - fadeStartSlow) / (incomingZoomLen - 1))
      : ZOOM_START;

  const uFade =
    t >= fadeStartSlow ? Math.min(1, (t - fadeStartSlow) / Math.max(1, SLOW_CROSSFADE_FRAMES - 1)) : 0;
  const opacityCur = inSlow ? (t < fadeStartSlow ? 1 : 1 - smoothstep(uFade)) : 1;
  const opacityNext = inSlow ? (t < fadeStartSlow ? 0 : smoothstep(uFade)) : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: slideshowOpacity,
          pointerEvents: "none",
          textAlign: "left",
        }}
      >
        {!inFadeOut && frame < FAST_PHASE_TOTAL && n > 0 ? (
          <img
            src={urls[Math.floor(frame / FAST_FRAMES_PER_PHOTO) % n]!}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : null}

        {inSlowVisible ? (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: opacityCur,
              }}
            >
              <img
                src={urls[idxCur]!}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${scaleCur})`,
                  transformOrigin: "center center",
                  willChange: "transform",
                }}
              />
            </div>
            {opacityNext > 0 ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: opacityNext,
                }}
              >
                <img
                  src={urls[idxNext]!}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: `scale(${scaleNext})`,
                    transformOrigin: "center center",
                    willChange: "transform",
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {inFadeOut && n > 0 ? (
          <img
            src={urls[(FAST_PHOTO_COUNT + SLOW_PHOTO_COUNT - 1) % n]!}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${ZOOM_END})`,
            }}
          />
        ) : null}
      </div>

      {/* Full width inferior: vidro op3 — topo (logo | WhatsApp) + infos, tudo em baixo */}
      {!inFadeOut ? (
        <div
          style={{
            position: "absolute",
            left: INFO_BOX_MARGIN_LEFT,
            right: INFO_BOX_MARGIN_RIGHT,
            bottom: INFO_BOX_MARGIN_BOTTOM,
            maxWidth: "90%",
            boxSizing: "border-box",
            borderRadius: 16,
            padding: "20px 22px 22px",
            color: "#fff",
            opacity: bottomBarOpacity,
            transform: `translateY(${infoTranslateY}px)`,
            willChange: "transform, opacity",
            ...glassPanel,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: "1 1 200px" }}>
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
                  {imobname}
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

          <div
            style={{
              marginTop: 22,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.22)",
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
        </div>
      ) : null}

      <SrtOverlay content={subtitlesSrt} position="center" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: finalScreenOpacity,
          pointerEvents: "none",
        }}
      >
        <ImobFinalSignature
          frameInFinal={frameInFinal}
          logoUrl={logoUrl}
          imobname={imobname}
          website={website}
          client={client}
          signatureLayout="splitVertical"
        />
      </div>
    </AbsoluteFill>
  );
};
