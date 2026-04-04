#!/usr/bin/env node
/**
 * Empacota a página de preview (React + @remotion/player) para `public/preview.bundle.js`.
 * Rode após `npm install` ou quando alterar `src/preview/**`.
 */
import * as esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const entry = path.join(rootDir, "src/preview/index.tsx");
const outfile = path.join(rootDir, "public/preview.bundle.js");

const prod = process.env.NODE_ENV === "production";

await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  outfile,
  format: "iife",
  platform: "browser",
  jsx: "automatic",
  minify: prod,
  sourcemap: true,
  logLevel: "info",
  define: {
    "process.env.NODE_ENV": JSON.stringify(prod ? "production" : "development"),
  },
});

console.log("[build-preview] wrote", outfile);
