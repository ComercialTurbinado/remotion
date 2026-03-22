import type { ListingInput } from "./listing";

/** Props comuns às composições que aceitam listing + legenda opcional */
export type CompositionProps = {
  input?: ListingInput;
  /**
   * Texto completo de um arquivo .srt (UTF-8).
   * Preenchido no Studio, via --props ou pelo script render-from-json (subtitlesPath).
   */
  subtitlesSrt?: string;
};
