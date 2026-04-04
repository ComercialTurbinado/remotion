#!/usr/bin/env node
/**
 * Empacota o preview:
 * - public/preview.bundle.js — UI com textarea (GET /preview)
 * - public/preview-embed.bundle.js — só Player (POST /preview → HTML)
 */
import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outdir = path.join(rootDir, "public");

const prod = process.env.NODE_ENV === "production";

const shared = {
  bundle: true,
  outdir,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  minify: prod,
  sourcemap: true,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": JSON.stringify(prod ? "production" : "development"),
  },
};

await esbuild.build({
  ...shared,
  entryPoints: {
    "preview.bundle": path.join(rootDir, "src/preview/index.tsx"),
    "preview-embed.bundle": path.join(rootDir, "src/preview/embed.tsx"),
  },
  entryNames: "[name]",
});

console.log("[build-preview] wrote public/preview.bundle.js + public/preview-embed.bundle.js");
