import React, { useCallback, useMemo, useState } from "react";
import { Player } from "@remotion/player";
import {
  COMMON_VIDEO,
  COMPOSITION_MAP,
  FALLBACK_DURATIONS,
} from "../composition-registry";
import { parsePreviewPayloadFromString } from "./preview-payload";
import { durationInFramesFromSrt } from "../utils/parseSrt";

const DEFAULT_JSON = `{
  "animation": "op6",
  "input": {
    "listing": {
      "prices": { "Venda": "R$ 890.000" },
      "propertyCodes": "REF-001",
      "carousel_images": [
        "https://picsum.photos/1080/1920?random=61"
      ]
    }
  }
}`;

export const PreviewApp: React.FC = () => {
  const [jsonText, setJsonText] = useState(DEFAULT_JSON);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(() => parsePreviewPayloadFromString(DEFAULT_JSON));
  const [playerKey, setPlayerKey] = useState(0);

  const apply = useCallback(() => {
    try {
      const p = parsePreviewPayloadFromString(jsonText);
      setError(null);
      setActive(p);
      setPlayerKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [jsonText]);

  const durationInFrames = useMemo(() => {
    const fb = FALLBACK_DURATIONS[active.animation];
    return durationInFramesFromSrt(
      active.inputProps.subtitlesSrt,
      COMMON_VIDEO.fps,
      fb
    );
  }, [active]);

  const Component = COMPOSITION_MAP[active.animation];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Public Sans', system-ui, sans-serif",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 700 }}>
        Preview (browser)
      </h1>
      <p style={{ margin: "0 0 16px", fontSize: 14, color: "#94a3b8", maxWidth: 720 }}>
        Cole o mesmo JSON do <code style={{ color: "#cbd5e1" }}>POST /render</code> (animation, input,
        subtitlesSrt opcional) e clique em Aplicar. Não gera MP4 — só reproduz no Player.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <label
            htmlFor="payload-json"
            style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6 }}
          >
            Payload JSON
          </label>
          <textarea
            id="payload-json"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 220,
              boxSizing: "border-box",
              fontFamily: "ui-monospace, monospace",
              fontSize: 12,
              padding: 12,
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#020617",
              color: "#e2e8f0",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={apply}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Aplicar no player
            </button>
          </div>
          {error ? (
            <p style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</p>
          ) : null}
        </div>

        <div style={{ flex: "1 1 360px", minWidth: 300 }}>
          <div
            style={{
              fontSize: 12,
              color: "#94a3b8",
              marginBottom: 8,
            }}
          >
            <strong style={{ color: "#e2e8f0" }}>{active.animation}</strong>
            {" · "}
            {durationInFrames} frames @ {COMMON_VIDEO.fps} fps
          </div>
          <div
            style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
            }}
          >
            <Player
              key={playerKey}
              acknowledgeRemotionLicense
              component={Component}
              durationInFrames={durationInFrames}
              compositionWidth={COMMON_VIDEO.width}
              compositionHeight={COMMON_VIDEO.height}
              fps={COMMON_VIDEO.fps}
              controls
              inputProps={active.inputProps}
              style={{ width: "100%", maxWidth: 480 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
