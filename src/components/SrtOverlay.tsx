import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { parseSrt } from "../utils/parseSrt";

export type SrtRevealMode = "block" | "words";

type SrtOverlayProps = {
  content?: string;
  bottom?: number;
  position?: "center" | "bottom";
  /** `block`: texto inteiro da cue (comportamento anterior). `words`: revela palavra a palavra ao longo da duração da cue. */
  revealMode?: SrtRevealMode;
  /**
   * Com `revealMode="words"`: cor da **palavra atual** (última revelada), ex. cor da marca vinda do JSON.
   * Demais palavras permanecem brancas.
   */
  wordHighlightColor?: string;
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
function buildWordSegments(text: string): { text: string; brBefore: boolean }[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const segments: { text: string; brBefore: boolean }[] = [];
  for (const line of lines) {
    const words = line.split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      segments.push({
        text: words[i]!,
        brBefore: i === 0 && segments.length > 0,
      });
    }
  }
  return segments;
}

export const SrtOverlay: React.FC<SrtOverlayProps> = ({
  content,
  bottom = 140,
  position = "center",
  revealMode = "block",
  wordHighlightColor,
}) => {
  const cues = useMemo(() => {
    const t = content?.trim();
    return t ? parseSrt(t) : [];
  }, [content]);

  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const tMs = (frame / fps) * 1000;
  const active = cues.length > 0 ? cues.find((c) => c.startMs <= tMs && tMs < c.endMs) : undefined;

  const wordSegments = useMemo(() => {
    if (!active) return [] as { text: string; brBefore: boolean }[];
    return buildWordSegments(active.text);
  }, [active]);

  if (cues.length === 0 || !active) return null;

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

  const cueDurationMs = Math.max(1, active.endMs - active.startMs);
  const cueProgress = Math.min(1, Math.max(0, (tMs - active.startMs) / cueDurationMs));
  const wordCount = wordSegments.length;
  const wordsToShow =
    revealMode === "words" && wordCount > 0
      ? Math.min(wordCount, Math.max(1, Math.ceil(cueProgress * wordCount)))
      : wordCount;

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
        {revealMode === "words" && wordCount > 0
          ? wordSegments.slice(0, wordsToShow).map((item, idx) => {
              const isActiveWord =
                Boolean(wordHighlightColor?.trim()) && idx === wordsToShow - 1;
              return (
                <React.Fragment key={idx}>
                  {item.brBefore ? <br /> : idx > 0 ? " " : null}
                  <span
                    style={
                      isActiveWord
                        ? { color: wordHighlightColor!.trim() }
                        : undefined
                    }
                  >
                    {item.text}
                  </span>
                </React.Fragment>
              );
            })
          : lines.map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
      </div>
    </AbsoluteFill>
  );
};
