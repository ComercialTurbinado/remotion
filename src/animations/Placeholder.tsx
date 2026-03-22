import React from "react";
import { AbsoluteFill } from "remotion";

type PlaceholderProps = { id: string };

/** Placeholder para animações op2, op3 etc. até serem implementadas. */
export const Placeholder: React.FC<PlaceholderProps> = ({ id }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f6f6f8",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Public Sans', sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 62, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Animação {id}
        </p>
        <p style={{ fontSize: 31, color: "#64748b", marginTop: 16 }}>
          Em breve
        </p>
      </div>
    </AbsoluteFill>
  );
};
