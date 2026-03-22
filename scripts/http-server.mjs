#!/usr/bin/env node
/**
 * API HTTP para render (EasyPanel, Docker, etc.).
 *
 * Variáveis:
 *   PORT — porta (default 8080)
 *
 * Rotas:
 *   GET  /health  — { "ok": true, "ready": true }
 *   POST /render — body JSON igual ao render-from-json (subtitlesPath = caminho no container)
 *
 * Resposta: arquivo MP4 (video/mp4) ou JSON de erro.
 */
import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, ready: true });
});

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
  console.log("[http] Bundling Remotion (primeira carga)...");
  await getServeUrl();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[http] listening on 0.0.0.0:${PORT} (POST /render, GET /health)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
