/**
 * Parser mínimo de arquivo .srt (SubRip).
 * Suporta timestamps com vírgula ou ponto nos milissegundos.
 */

export type SrtCue = {
  startMs: number;
  endMs: number;
  text: string;
};

function timeToMs(h: string, m: string, s: string, ms: string): number {
  return (
    (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000 + Number(ms.padEnd(3, "0").slice(0, 3))
  );
}

/**
 * Converte conteúdo UTF-8 de um .srt em lista de cues ordenados por tempo.
 */
export function parseSrt(raw: string): SrtCue[] {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const blocks = text.split(/\n\n+/);
  const cues: SrtCue[] = [];

  const timeRe =
    /^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/;

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    if (lines.length < 2) continue;

    let i = 0;
    if (/^\d+$/.test(lines[0]!)) i++;

    const timeLine = lines[i];
    if (!timeLine) continue;

    const m = timeLine.match(timeRe);
    if (!m) continue;

    const startMs = timeToMs(m[1]!, m[2]!, m[3]!, m[4]!);
    const endMs = timeToMs(m[5]!, m[6]!, m[7]!, m[8]!);
    const body = lines.slice(i + 1).join("\n").trim();
    if (!body) continue;

    cues.push({ startMs, endMs, text: body });
  }

  cues.sort((a, b) => a.startMs - b.startMs);
  return cues;
}

/** Margem após o fim da última legenda (~0,5 s, em frames) */
function tailPaddingFrames(fps: number): number {
  return Math.max(1, Math.round(0.5 * fps));
}

/**
 * Duração do vídeo em frames: quando há SRT válido, segue o fim da última cue (+ pequena margem).
 * Sem SRT ou SRT vazio/inválido, usa `fallbackFrames` (duração fixa da composição).
 */
export function durationInFramesFromSrt(
  subtitlesSrt: string | undefined,
  fps: number,
  fallbackFrames: number
): number {
  if (!subtitlesSrt?.trim()) return fallbackFrames;
  const cues = parseSrt(subtitlesSrt);
  if (cues.length === 0) return fallbackFrames;
  const lastEndMs = Math.max(...cues.map((c) => c.endMs));
  const fromSrt = Math.ceil((lastEndMs / 1000) * fps) + tailPaddingFrames(fps);
  return Math.max(1, fromSrt);
}
