import type { AnimationId } from "../animations/registry";
import { isValidAnimationId } from "../animations/registry";
import type { CompositionProps } from "../types/composition-props";

export type ParsedPreviewPayload = {
  animation: AnimationId;
  inputProps: CompositionProps;
};

export function parsePreviewPayloadFromString(raw: string): ParsedPreviewPayload {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("JSON inválido");
  }
  if (!data || typeof data !== "object") {
    throw new Error("O corpo deve ser um objeto JSON");
  }
  const obj = data as Record<string, unknown>;
  const animation = obj.animation;
  if (typeof animation !== "string" || !isValidAnimationId(animation)) {
    throw new Error(`animation deve ser um id válido (ex.: op1 … op6). Recebido: ${String(animation)}`);
  }
  const inputProps: CompositionProps = {
    input: obj.input as CompositionProps["input"],
    subtitlesSrt: typeof obj.subtitlesSrt === "string" ? obj.subtitlesSrt : undefined,
  };
  return { animation, inputProps };
}
