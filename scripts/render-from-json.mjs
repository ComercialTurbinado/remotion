#!/usr/bin/env node
/**
 * Render headless: lê JSON (arquivo ou stdin) e gera MP4.
 *
 * JSON esperado:
 *   { "animation": "op1", "input": { "listing": {...}, "baseUrl": "..." }, "output": "out/video.mp4" }
 *
 * Legendas (.srt), uma das opções:
 *   "subtitlesPath": "/caminho/absoluto/legenda.srt"
 *   "subtitlesSrt": "conteúdo UTF-8 do arquivo (menos comum)"
 *
 * Uso:
 *   node scripts/render-from-json.mjs payload.json
 *   echo '{"animation":"op1","input":{}}' | node scripts/render-from-json.mjs
 */
import path from "path";
import {
  bundleProject,
  getRootDir,
  normalizeRenderPayload,
  renderToLocation,
} from "./render-core.mjs";

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

async function loadRawPayload() {
  const fileArg = process.argv[2];
  let raw;
  if (fileArg) {
    const fs = await import("fs");
    raw = fs.readFileSync(path.resolve(process.cwd(), fileArg), "utf8");
  } else {
    raw = await readStdin();
  }
  return JSON.parse(raw || "{}");
}

async function main() {
  const raw = await loadRawPayload();
  const normalized = normalizeRenderPayload(raw, { cwd: process.cwd() });
  const serveUrl = await bundleProject(getRootDir());

  const outputLocation = path.isAbsolute(normalized.output)
    ? normalized.output
    : path.join(process.cwd(), normalized.output);

  console.log("[render] Selecting composition", normalized.animation);
  console.log("[render] Rendering to", outputLocation);
  await renderToLocation({
    serveUrl,
    normalized,
    outputLocation,
    cwd: process.cwd(),
  });

  console.log("[render] Done:", outputLocation);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
