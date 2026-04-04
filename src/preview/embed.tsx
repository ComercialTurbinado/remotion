import React, { useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@remotion/player";
import type { AnimationId } from "../animations/registry";
import { COMMON_VIDEO, COMPOSITION_MAP, FALLBACK_DURATIONS } from "../composition-registry";
import type { CompositionProps } from "../types/composition-props";
import { durationInFramesFromSrt } from "../utils/parseSrt";

type Boot = {
  animation: AnimationId;
  inputProps: CompositionProps;
};

declare global {
  interface Window {
    __PREVIEW_BOOT__?: Boot;
  }
}

const EmbedPlayer: React.FC = () => {
  const boot = window.__PREVIEW_BOOT__;
  if (!boot?.animation || !COMPOSITION_MAP[boot.animation]) {
    return (
      <div style={{ color: "#f87171", padding: 16, fontFamily: "system-ui, sans-serif" }}>
        Payload inválido ou ausente.
      </div>
    );
  }

  const Component = COMPOSITION_MAP[boot.animation];
  const durationInFrames = useMemo(() => {
    const fb = FALLBACK_DURATIONS[boot.animation];
    return durationInFramesFromSrt(boot.inputProps.subtitlesSrt, COMMON_VIDEO.fps, fb);
  }, [boot.animation, boot.inputProps.subtitlesSrt]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        overflow: "hidden",
      }}
    >
      <Player
        acknowledgeRemotionLicense
        component={Component}
        durationInFrames={durationInFrames}
        compositionWidth={COMMON_VIDEO.width}
        compositionHeight={COMMON_VIDEO.height}
        fps={COMMON_VIDEO.fps}
        controls={false}
        autoPlay
        showVolumeControls={false}
        inputProps={boot.inputProps}
        style={{
          width: "min(100vw, calc(100vh * 1080 / 1920))",
          height: "min(100vh, calc(100vw * 1920 / 1080))",
        }}
      />
    </div>
  );
};

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(<EmbedPlayer />);
}
