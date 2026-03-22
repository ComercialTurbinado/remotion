import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { parseSrt } from "../utils/parseSrt";

type SrtOverlayProps = {
  content?: string;
  bottom?: number;
  position?: "center" | "bottom";
};

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** Sombra em camadas (difusa + contorno em cruz). Sem box de fundo — só texto. */
const SUBTITLE_TEXT_SHADOW =
  "rgba(0, 0, 0, 0.8) 0.12em 0.22em 3em, rgba(0, 0, 0, 0.34) 0.12em 0.22em 5em, rgba(0, 0, 0, 0.1) 0.1em 0.2em 27em, rgba(0, 0, 0, 0.5) 0.12em 0.12em 0.08em, #00000050 3px 4px 1px, #00000050 -4px -4px 0px, #00000050 -3px 4px 1px, #00000050 3px -4px 1px";

/**
 * Legendas queimadas no vídeo, sincronizadas pelo tempo (frame/fps).
 * Entrada: fade + sobe de baixo; saída: fade. Só sombra no texto (sem painel escuro).
 */
export const SrtOverlay: React.FC<SrtOverlayProps> = ({
  content,
  bottom = 140,
  position = "center",
}) => {
  const cues = useMemo(() => {
    const t = content?.trim();
    return t ? parseSrt(t) : [];
  }, [content]);

  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  if (cues.length === 0) return null;

  const tMs = (frame / fps) * 1000;
  const active = cues.find((c) => c.startMs <= tMs && tMs < c.endMs);
  if (!active) return null;

  const lines = active.text.split("\n").filter(Boolean);

  const startFrame = Math.round((active.startMs / 1000) * fps);
  const endFrame = Math.round((active.endMs / 1000) * fps);
  const cueLen = Math.max(1, endFrame - startFrame);
  const localFrame = frame - startFrame;

  const fadeInFrames = Math.min(14, Math.max(5, Math.floor(cueLen * 0.28)));
  const fadeOutFrames = Math.min(12, Math.max(4, Math.floor(cueLen * 0.24)));
  const slidePx = Math.min(36, Math.max(14, width * 0.028));

  let opacity = 1;
  let translateY = 0;

  if (localFrame < fadeInFrames) {
    const t = smoothstep(localFrame / fadeInFrames);
    opacity = t;
    translateY = (1 - t) * slidePx;
  } else if (localFrame > cueLen - fadeOutFrames) {
    const u = (cueLen - localFrame) / fadeOutFrames;
    const t = smoothstep(u);
    opacity = t;
    translateY = 0;
  }

  const isCenter = position === "center";

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 100,
        alignItems: "center",
        justifyContent: isCenter ? "center" : "flex-end",
        paddingBottom: isCenter ? 0 : bottom,
        paddingLeft: 40,
        paddingRight: 40,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          textAlign: "center",
          fontFamily: "'Public Sans', system-ui, sans-serif",
          fontSize: Math.min(55, width * 0.049),
          fontWeight: 600,
          lineHeight: 1.2,
          color: "#fff",
          textShadow: SUBTITLE_TEXT_SHADOW,
          opacity,
          transform: `translateY(${translateY}px)`,
          willChange: "opacity, transform",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <br /> : null}
            {line}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
