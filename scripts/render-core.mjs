/**
 * Núcleo do render headless: validação de payload, bundle e renderMedia.
 * Usado por render-from-json.mjs e http-server.mjs.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia } from "@remotion/renderer";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

/** Manter alinhado com src/animations/registry.ts */
export const ANIMATION_IDS = ["op1", "op2", "op3", "op4", "op5"];

export function getRootDir() {
  return path.resolve(__dirname, "..");
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ cwd?: string }} [opts]
 */
export function normalizeRenderPayload(payload, opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload inválido ou vazio");
  }
  const animation = payload.animation;
  if (typeof animation !== "string" || !ANIMATION_IDS.includes(animation)) {
    throw new Error(
      `animation deve ser um de: ${ANIMATION_IDS.join(", ")}. Recebido: ${animation ?? "undefined"}`
    );
  }
  let subtitlesSrt = typeof payload.subtitlesSrt === "string" ? payload.subtitlesSrt : undefined;
  if (payload.subtitlesPath) {
    if (typeof payload.subtitlesPath !== "string") {
      throw new Error("subtitlesPath deve ser string");
    }
    const p = path.isAbsolute(payload.subtitlesPath)
      ? payload.subtitlesPath
      : path.resolve(cwd, payload.subtitlesPath);
    subtitlesSrt = fs.readFileSync(p, "utf8");
  }
  const output =
    typeof payload.output === "string" && payload.output.length > 0
      ? payload.output
      : "out/video.mp4";
  return {
    animation,
    input: payload.input ?? undefined,
    output,
    subtitlesSrt,
  };
}

/**
 * @param {object} params
 * @param {string} params.serveUrl
 * @param {ReturnType<typeof normalizeRenderPayload>} params.normalized
 * @param {string} params.outputLocation — caminho absoluto ou relativo ao cwd do processo
 * @param {string} [params.cwd]
 */
export async function renderToLocation({ serveUrl, normalized, outputLocation, cwd }) {
  const inputProps = {
    input: normalized.input,
    subtitlesSrt: normalized.subtitlesSrt,
  };
  const composition = await selectComposition({
    serveUrl,
    id: normalized.animation,
    inputProps,
  });
  const out = path.isAbsolute(outputLocation)
    ? outputLocation
    : path.join(cwd ?? process.cwd(), outputLocation);

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: out,
    inputProps,
    logLevel: "info",
    chromiumOptions: {
      enableMultiProcessOnLinux: true,
    },
  });
  return out;
}

export async function bundleProject(rootDir = getRootDir()) {
  const entryPoint = path.join(rootDir, "src/index.ts");
  console.log("[render] Bundling...");
  return bundle({
    entryPoint,
    rootDir,
  });
}
