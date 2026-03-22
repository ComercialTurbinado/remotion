import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { SpinningBoxes } from "./SpinningBoxes";
import { Option2Subtle } from "./animations/Option2Subtle";
import { Option3 } from "./animations/Option3";
import { Option4, OP4_DEFAULT_DURATION_FRAMES } from "./animations/Option4";
import { Option5, OP5_DEFAULT_DURATION_FRAMES } from "./animations/Option5";
import type { CompositionProps } from "./types/composition-props";
import { DEMO_SRT } from "./fixtures/demo-legenda.srt";
import { durationInFramesFromSrt } from "./utils/parseSrt";

const COMMON_PROPS = {
  fps: 30 as const,
  width: 1080,
  height: 1920,
};

/** Duração padrão quando não há SRT (ou SRT inválido). Com SRT, o vídeo segue o fim da última legenda. */
const DEFAULT_DURATIONS = {
  op1: 930,
  op2: 900,
  op3: 900,
  op4: OP4_DEFAULT_DURATION_FRAMES,
  op5: OP5_DEFAULT_DURATION_FRAMES,
} as const;

function makeSrtAwareMetadata(
  fallbackFrames: number
): CalculateMetadataFunction<CompositionProps> {
  return ({ defaultProps, props }) => {
    const merged: CompositionProps = { ...defaultProps, ...props };
    const fps = COMMON_PROPS.fps;
    return {
      durationInFrames: durationInFramesFromSrt(
        merged.subtitlesSrt,
        fps,
        fallbackFrames
      ),
    };
  };
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* op1: animação principal (boxes + carrossel + infos + tela final) */}
      <Composition
        id="op1"
        component={SpinningBoxes}
        durationInFrames={DEFAULT_DURATIONS.op1}
        calculateMetadata={makeSrtAwareMetadata(DEFAULT_DURATIONS.op1)}
        {...COMMON_PROPS}
        defaultProps={
          {
            input: undefined,
          } satisfies CompositionProps
        }
      />

      {/* op2: slideshow fullscreen sutil com infos no topo esquerdo */}
      <Composition
        id="op2"
        component={Option2Subtle}
        durationInFrames={DEFAULT_DURATIONS.op2}
        calculateMetadata={makeSrtAwareMetadata(DEFAULT_DURATIONS.op2)}
        {...COMMON_PROPS}
        defaultProps={
          {
            input: undefined,
            subtitlesSrt: DEMO_SRT,
          } satisfies CompositionProps
        }
      />

      {/* op3: fullscreen + barra topo (logo | WhatsApp) + infos em vidro que sobem */}
      <Composition
        id="op3"
        component={Option3}
        durationInFrames={DEFAULT_DURATIONS.op3}
        calculateMetadata={makeSrtAwareMetadata(DEFAULT_DURATIONS.op3)}
        {...COMMON_PROPS}
        defaultProps={
          {
            input: undefined,
            subtitlesSrt: DEMO_SRT,
          } satisfies CompositionProps
        }
      />

      {/* op4: 4 fotos muito rápidas (zoom-out) → slideshow lento → assinatura como op1 */}
      <Composition
        id="op4"
        component={Option4}
        durationInFrames={DEFAULT_DURATIONS.op4}
        calculateMetadata={makeSrtAwareMetadata(DEFAULT_DURATIONS.op4)}
        {...COMMON_PROPS}
        defaultProps={
          {
            input: undefined,
            subtitlesSrt: DEMO_SRT,
          } satisfies CompositionProps
        }
      />

      {/* op5: slideshow + painel vidro compacto com infos da op1, item a item */}
      <Composition
        id="op5"
        component={Option5}
        durationInFrames={DEFAULT_DURATIONS.op5}
        calculateMetadata={makeSrtAwareMetadata(DEFAULT_DURATIONS.op5)}
        {...COMMON_PROPS}
        defaultProps={
          {
            input: undefined,
          } satisfies CompositionProps
        }
      />
    </>
  );
};
