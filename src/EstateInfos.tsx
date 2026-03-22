import React from "react";
import type { ListingData, InfoCard, AmenityItem } from "./types/listing";
import { fullAddress, displayPrice } from "./types/listing";

const PRIMARY = "#1152d4";
const BG_LIGHT = "#f6f6f8";
const SLATE_500 = "#64748b";
const SLATE_400 = "#94a3b8";
const SLATE_800 = "#1e293b";
const SLATE_900 = "#0f172a";
const BORDER = "rgba(17, 82, 212, 0.1)";
const BORDER_SLATE = "rgba(148, 163, 184, 0.3)";

const fontDisplay = "'Public Sans', sans-serif";

// easeOut: sobe rápido no início, suaviza no fim
function easeOut(t: number): number {
  return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 2);
}

function motionProgress(frame: number, startFrame: number, duration: number): number {
  const t = (frame - startFrame) / duration;
  return easeOut(t);
}

type EstateInfosProps = {
  width: number;
  height: number;
  frame: number;
  startFrame: number;
  listing?: ListingData;
};

const ENTRANCE_DURATION = 14;
const STAGGER = 10;

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

export const EstateInfos: React.FC<EstateInfosProps> = ({
  width,
  height,
  frame,
  startFrame,
  listing,
}) => {
  const paddingX = 36;
  const paddingY = 16;
  const price = listing ? displayPrice(listing) : "R$ 12.450.000";
  const address = listing ? fullAddress(listing) : "1230 Summit Ridge Dr, Beverly Hills, CA";
  const infoCards = listing?.infoCards ?? defaultInfoCards;
  const amenitiesList = listing?.amenitiesList?.map(parseAmenity) ?? defaultAmenities;

  // Só mostra a área depois que as fotos terminaram
  if (frame < startFrame) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: BG_LIGHT,
        }}
      />
    );
  }

  const p = (offset: number, duration = ENTRANCE_DURATION) =>
    motionProgress(frame, startFrame + offset, duration);

  return (
    <div
      style={{
        width,
        height,
        maxHeight: 700,
        padding: `${paddingY}px ${paddingX}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        backgroundColor: BG_LIGHT,
        fontFamily: fontDisplay,
        color: SLATE_900,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Preço + endereço — primeiro bloco */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: 18,
          flexShrink: 0,
          opacity: p(0),
          transform: `translateY(${(1 - p(0)) * 16}px)`,
        }}
      >
        <h1
          style={{
            color: PRIMARY,
            fontSize: 76,
            fontWeight: 800,
            margin: "0 0 6px 0",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {price}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: SLATE_500,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 38 }}>
            location_on
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 600,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              color: SLATE_500,
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {address}
          </h2>
        </div>
      </div>

      {/* Grid 2x2 — um card por vez */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
          flexShrink: 0,
        }}
      >
        {infoCards.slice(0, 4).map((item, i) => {
          const prog = p(STAGGER + i * STAGGER);
          return (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderRadius: 14,
                backgroundColor: "rgba(17, 82, 212, 0.05)",
                border: `1px solid ${BORDER}`,
                opacity: prog,
                transform: `translateY(${(1 - prog) * 24}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: PRIMARY,
                  borderRadius: 12,
                  width: 48,
                  height: 48,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 36, color: "#fff" }}
                >
                  {item.icon ?? "info"}
                </span>
              </div>
              <div>
                <p
                  style={{
                    margin: "0 0 2px 0",
                    fontSize: 18,
                    fontWeight: 500,
                    color: SLATE_500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: 34,
                    lineHeight: 1.15,
                    fontWeight: 700,
                    color: SLATE_900,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leisure & Amenities — dinâmico a partir de listing.amenitiesList */}
      <div style={{ marginBottom: 8, flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
        <h3
          style={{
            margin: "0 0 10px 0",
            fontSize: 26,
            fontWeight: 700,
            color: SLATE_800,
            borderLeft: `6px solid ${PRIMARY}`,
            paddingLeft: 14,
            flexShrink: 0,
            opacity: p(4 * STAGGER + 8),
            transform: `translateY(${(1 - p(4 * STAGGER + 8)) * 12}px)`,
          }}
        >
          Lazer e comodidades
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            flex: "1 1 auto",
            minHeight: 0,
            alignContent: "start",
          }}
        >
          {amenitiesList.slice(0, 4).map((item, i) => {
            const prog = p(4 * STAGGER + 16 + i * 8);
            return (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 10px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER_SLATE}`,
                  opacity: prog,
                  transform: `translateY(${(1 - prog) * 16}px)`,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 44, color: PRIMARY, marginBottom: 4 }}
                >
                  {item.icon}
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: 30,
                    fontWeight: 600,
                    color: SLATE_900,
                    textAlign: "center",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                  }}
                >
                  {item.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
