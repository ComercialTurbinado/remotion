#!/usr/bin/env node
/**
 * API HTTP para render (EasyPanel, Docker, etc.).
 *
 * Variáveis:
 *   PORT — porta (default 8080)
 *
 * Rotas:
 *   GET  /health   — { "ok": true, "ready": true }
 *   GET  /preview  — página com formulário JSON + Player (debug)
 *   POST /preview  — mesmo body do POST /render; resposta text/html só com a animação (gravação de tela)
 *   POST /render   — body JSON igual ao render-from-json (subtitlesPath = caminho no container)
 *
 * Resposta: arquivo MP4 (video/mp4) ou JSON de erro.
 */
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import {
  bundleProject,
  getRootDir,
  normalizeRenderPayload,
  renderToLocation,
} from "./render-core.mjs";

const rootDir = getRootDir();
const PORT = Number(process.env.PORT || 8080);

let serveUrlPromise = null;
function getServeUrl() {
  if (!serveUrlPromise) {
    serveUrlPromise = bundleProject(rootDir);
  }
  return serveUrlPromise;
}

/** Uma renderização por vez (evita estourar RAM/CPU). */
let chain = Promise.resolve();

function enqueueRender(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "32mb" }));

const publicDir = path.join(rootDir, "public");

/**
 * @param {{ animation: string; inputProps: { input?: unknown; subtitlesSrt?: string } }} boot
 * @param {string} assetBase URL absoluta (ex.: https://host) para CSS/JS — permite salvar o HTML e abrir localmente com assets no servidor.
 */
function previewEmbedHtml(boot, assetBase) {
  const json = JSON.stringify(boot).replace(/</g, "\\u003c");
  const base = assetBase.replace(/\/$/, "");
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <title>preview</title>
  <link rel="stylesheet" href="${base}/preview-fonts.css"/>
  <style>html,body,#root{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}</style>
</head>
<body>
  <div id="root"></div>
  <script>window.__PREVIEW_BOOT__=${json};</script>
  <script src="${base}/preview-embed.bundle.js"></script>
</body>
</html>`;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, ready: true });
});

app.get("/preview", (_req, res) => {
  res.sendFile(path.join(publicDir, "preview.html"));
});

app.post("/preview", (req, res) => {
  try {
    const normalized = normalizeRenderPayload(req.body ?? {}, { cwd: process.cwd() });
    const boot = {
      animation: normalized.animation,
      inputProps: {
        input: normalized.input,
        subtitlesSrt: normalized.subtitlesSrt,
      },
    };
    const xfProto = req.get("x-forwarded-proto");
    const proto = typeof xfProto === "string" ? xfProto.split(",")[0].trim() : req.protocol;
    const host = req.get("host") || `localhost:${PORT}`;
    const assetBase = `${proto}://${host}`;
    res.type("html").send(previewEmbedHtml(boot, assetBase));
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(400).json({ error: msg });
  }
});

app.use(express.static(publicDir));

app.post("/render", (req, res) => {
  enqueueRender(async () => {
    let tmpFile = null;
    try {
      const normalized = normalizeRenderPayload(req.body ?? {}, { cwd: process.cwd() });
      const serveUrl = await getServeUrl();
      tmpFile = path.join(os.tmpdir(), `remotion-${randomUUID()}.mp4`);
      await renderToLocation({
        serveUrl,
        normalized,
        outputLocation: tmpFile,
        cwd: process.cwd(),
      });

      res.download(tmpFile, "video.mp4", (err) => {
        fs.unlink(tmpFile, () => {});
        if (err && !res.headersSent) {
          res.status(500).json({ error: String(err.message) });
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (tmpFile) fs.unlink(tmpFile, () => {});
      if (!res.headersSent) {
        res.status(400).json({ error: msg });
      }
    }
  }).catch((e) => {
    if (!res.headersSent) {
      res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
    }
  });
});

async function main() {
  const previewBundle = path.join(publicDir, "preview.bundle.js");
  const embedBundle = path.join(publicDir, "preview-embed.bundle.js");
  if (!fs.existsSync(previewBundle) || !fs.existsSync(embedBundle)) {
    console.warn("[http] Bundle(s) de preview ausente(s) — tentando `npm run build:preview`…");
    try {
      execSync("node scripts/build-preview.mjs", {
        cwd: rootDir,
        stdio: "inherit",
        env: process.env,
      });
    } catch (e) {
      console.error("[http] Falha ao gerar bundles de preview:", e);
    }
  }
  if (!fs.existsSync(previewBundle) || !fs.existsSync(embedBundle)) {
    console.warn(
      "[http] Preview incompleto; confira `npm run build:preview` no deploy (Nixpacks/Docker)."
    );
  }
  console.log("[http] Bundling Remotion (primeira carga)...");
  await getServeUrl();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `[http] listening on 0.0.0.0:${PORT} (GET /health, GET|POST /preview, POST /render)`
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
