import React from "react";
import type { ListingClient } from "../types/listing";

/** Mesma cadência da op1: itens entram escalonados com fade + leve translateY */
export const FINAL_ITEM_DURATION = 10;
export const FINAL_ITEM_STAGGER = 8;

type ImobFinalSignatureProps = {
  /** Frames desde o início do fade / tela final (0 = primeiro frame da assinatura) */
  frameInFinal: number;
  logoUrl?: string;
  imobname: string;
  website: string;
  client: ListingClient;
  /**
   * `splitVertical` (op4): logo + nome agrupados no topo; contatos na base, mais afastados.
   * `default`: bloco central compacto (op1).
   */
  signatureLayout?: "default" | "splitVertical";
};

const easeOutFinal = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 2);

function finalItemProgress(frameInFinal: number, delay: number): number {
  return easeOutFinal((frameInFinal - delay) / FINAL_ITEM_DURATION);
}

function finalItemTranslate(frameInFinal: number, delay: number): number {
  const p = finalItemProgress(frameInFinal, delay);
  return (1 - p) * 28;
}

function finalItemOpacity(frameInFinal: number, delay: number): number {
  return Math.min(1, Math.max(0, finalItemProgress(frameInFinal, delay)));
}

/**
 * Tela final branca: logo, nome da imobiliária e contatos (ícone + texto), como na op1.
 */
export const ImobFinalSignature: React.FC<ImobFinalSignatureProps> = ({
  frameInFinal,
  logoUrl,
  imobname,
  website,
  client,
  signatureLayout = "default",
}) => {
  const isSplit = signatureLayout === "splitVertical";

  const logoBlock = (
    <div
      style={{
        height: 300,
        maxWidth: 800,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: finalItemOpacity(frameInFinal, 0),
        transform: `translateY(${finalItemTranslate(frameInFinal, 0)}px)`,
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          style={{
            maxWidth: 800,
            width: "100%",
            height: 300,
            objectFit: "contain",
            borderRadius: 16,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            maxWidth: 800,
            height: 300,
            borderRadius: 16,
            backgroundColor: "rgba(17, 82, 212, 0.12)",
          }}
        />
      )}
    </div>
  );

  const nameBlock = (
    <span
      style={{
        marginTop: isSplit ? 16 : 24,
        fontSize: 73,
        fontWeight: 800,
        color: "#1e293b",
        letterSpacing: "-0.02em",
        opacity: finalItemOpacity(frameInFinal, FINAL_ITEM_STAGGER),
        transform: `translateY(${finalItemTranslate(frameInFinal, FINAL_ITEM_STAGGER)}px)`,
        wordBreak: "break-word",
        overflowWrap: "break-word",
        textAlign: "center",
      }}
    >
      {imobname}
    </span>
  );

  const contactsBlock = (
    <div
      style={{
        marginTop: isSplit ? 0 : 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
        {[
          { icon: "phone" as const, label: client.phone ?? "", delay: 2 * FINAL_ITEM_STAGGER },
          { icon: "mail" as const, label: client.email ?? "", delay: 3 * FINAL_ITEM_STAGGER },
          { icon: "language" as const, label: website, delay: 4 * FINAL_ITEM_STAGGER },
          { icon: "photo_camera" as const, label: client.instagram ?? "", delay: 5 * FINAL_ITEM_STAGGER },
        ]
          .filter((item) => item.label)
          .map((item) => (
            <div
              key={item.icon}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: finalItemOpacity(frameInFinal, item.delay),
                transform: `translateY(${finalItemTranslate(frameInFinal, item.delay)}px)`,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 52, color: "#1152d4" }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 47,
                  color: "#1152d4",
                  fontWeight: 700,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {item.label}
              </span>
            </div>
          ))}
    </div>
  );

  if (isSplit) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-around",
          boxSizing: "border-box",
          paddingTop: 160,
          paddingBottom: 250,
          fontFamily: "'Public Sans', sans-serif",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            flexShrink: 0,
          }}
        >
          {logoBlock}
          {nameBlock}
        </div>
        <div style={{ width: "100%", flexShrink: 0 }}>{contactsBlock}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Public Sans', sans-serif",
        backgroundColor: "#ffffff",
      }}
    >
      {logoBlock}
      {nameBlock}
      {contactsBlock}
    </div>
  );
};
