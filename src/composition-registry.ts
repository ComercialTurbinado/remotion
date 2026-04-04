import type { ComponentType } from "react";
import { SpinningBoxes } from "./SpinningBoxes";
import { Option2Subtle } from "./animations/Option2Subtle";
import { Option3 } from "./animations/Option3";
import { Option4, OP4_DEFAULT_DURATION_FRAMES } from "./animations/Option4";
import { Option5, OP5_DEFAULT_DURATION_FRAMES } from "./animations/Option5";
import { Option6, OP6_DEFAULT_DURATION_FRAMES } from "./animations/Option6";
import type { AnimationId } from "./animations/registry";
import type { CompositionProps } from "./types/composition-props";

/** Mesmas dimensões/fps das composições em `Root.tsx`. */
export const COMMON_VIDEO = {
  fps: 30 as const,
  width: 1080,
  height: 1920,
};

/** Duração padrão sem SRT válido — alinhado ao `Root`. */
export const FALLBACK_DURATIONS: Record<AnimationId, number> = {
  op1: 930,
  op2: 900,
  op3: 900,
  op4: OP4_DEFAULT_DURATION_FRAMES,
  op5: OP5_DEFAULT_DURATION_FRAMES,
  op6: OP6_DEFAULT_DURATION_FRAMES,
};

export const COMPOSITION_MAP: Record<AnimationId, ComponentType<CompositionProps>> = {
  op1: SpinningBoxes,
  op2: Option2Subtle,
  op3: Option3,
  op4: Option4,
  op5: Option5,
  op6: Option6,
};
