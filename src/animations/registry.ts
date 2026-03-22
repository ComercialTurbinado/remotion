/**
 * Registro de animações disponíveis para render no servidor.
 * Cada id corresponde a uma Composition no Root.
 * Ao chamar o render, envie { "animation": "op1", "input": { ... } }.
 * Manter alinhado com ANIMATION_IDS em scripts/render-from-json.mjs.
 */
export const ANIMATION_IDS = ["op1", "op2", "op3", "op4", "op5"] as const;
export type AnimationId = (typeof ANIMATION_IDS)[number];

export function isValidAnimationId(id: string): id is AnimationId {
  return ANIMATION_IDS.includes(id as AnimationId);
}
