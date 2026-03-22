import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { EstateInfos } from "./EstateInfos";
import { ImobFinalSignature } from "./components/ImobFinalSignature";
import {
  normalizeListing,
  fullAddress,
  displayPrice,
  resolveUrl,
  type ListingData,
} from "./types/listing";
import type { CompositionProps } from "./types/composition-props";

const BOX_FRACTION = 0.45; // 45% da tela por box
const GAP_FRACTION = 0.02; // 2% de gap/margem
const ANIM_SIZE = 1080; // quadrado da animação
const TOP_MARGIN = 115; // espaço topo: margin + logo + nome + site
const BOX_ANIM_END_FRAME = 60; // fotos prontas ao fim dos 2s
const MOVE_UP_DELAY_FRAMES = 15; // 0.5s de espera antes do box subir
const MOVE_UP_DURATION = 20; // subida suave com ease-in-out
const MOVE_UP_START_FRAME = BOX_ANIM_END_FRAME + MOVE_UP_DELAY_FRAMES;
const SLIDESHOW_START_FRAME = MOVE_UP_START_FRAME + MOVE_UP_DURATION; // após o box subir
const WAIT_AFTER_MOVE_FRAMES = 60; // esperar 2s após o box subir
const FIRST_PHOTO_ZOOM_FRAMES = 30; // 1s para a primeira foto assumir o quadro
const HOLD_FIRST_IMAGE_FRAMES = 90; // 3s com a imagem 1 em tela antes do carrossel
const CAROUSEL_START_FRAME =
  SLIDESHOW_START_FRAME +
  WAIT_AFTER_MOVE_FRAMES +
  FIRST_PHOTO_ZOOM_FRAMES +
  HOLD_FIRST_IMAGE_FRAMES;
const SLIDESHOW_CYCLE_FRAMES = 60; // ~2s por foto para mostrar ~10 fotos em 25s
const SLIDESHOW_FADE_FRAMES = 15; // fade out no final do ciclo
const SLIDESHOW_ZOOM_END = 1.06; // zoom-in devagar até 6% no fim dos 3s
const MAX_CAROUSEL_PHOTOS = 10; // carrossel até 10 fotos
const FADEOUT_START_FRAME = 720; // 24s: começa fade out de tudo
/** Altura máxima do bloco de infos (op1): evita corte e compacta o layout */
const INFOS_MAX_HEIGHT = 700;

const DEFAULT_IMAGE_URLS = [
  "https://picsum.photos/800/800?random=1",
  "https://picsum.photos/800/800?random=2",
  "https://picsum.photos/800/800?random=3",
  "https://picsum.photos/800/800?random=4",
  "https://picsum.photos/800/800?random=5",
  "https://picsum.photos/800/800?random=6",
  "https://picsum.photos/800/800?random=7",
  "https://picsum.photos/800/800?random=8",
  "https://picsum.photos/800/800?random=9",
  "https://picsum.photos/800/800?random=10",
];

type SpinningBoxesProps = CompositionProps;

export const SpinningBoxes: React.FC<SpinningBoxesProps> = ({ input }) => {
  const listing: ListingData = normalizeListing(input);
  const baseUrl = input?.baseUrl;
  const imageUrls =
    listing.carousel_images?.length
      ? listing.carousel_images.map((u) => resolveUrl(u, baseUrl))
      : listing.selected_images?.length
        ? listing.selected_images.map((u) => resolveUrl(u, baseUrl))
        : DEFAULT_IMAGE_URLS;
  const raw = imageUrls.slice(0, MAX_CAROUSEL_PHOTOS);
  const carouselUrls =
    raw.length > 0 ? raw : DEFAULT_IMAGE_URLS.slice(0, 1);
  const client = listing.client ?? {};
  const imobname = listing.imobname ?? "Estate Elite";
  const website = client.website ?? "www.estateelite.com";
  const logoUrl = resolveUrl(client.logo_url, baseUrl) || undefined;
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  const animSize = ANIM_SIZE;
  const contentHeight = height - TOP_MARGIN;
  const centerY = TOP_MARGIN + contentHeight / 2;
  const animBoxYStart = centerY - animSize / 2; // animação começa centralizada

  // Delay 0.5s, depois box sobe com ease-in-out até logo abaixo da margem do topo
  const moveUpProgress =
    frame < MOVE_UP_START_FRAME
      ? 0
      : Math.min(
          1,
          (frame - MOVE_UP_START_FRAME) / MOVE_UP_DURATION
        );
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
  const easeInOutQuad = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const animBoxY =
    frame < MOVE_UP_START_FRAME
      ? animBoxYStart
      : animBoxYStart +
        (TOP_MARGIN - animBoxYStart) * easeInOutQuad(moveUpProgress);

  const infosTop = animBoxY + animSize;
  // Área de infos só aparece quando o box começa a subir (height=0 antes)
  const infosHeight =
    frame < MOVE_UP_START_FRAME ? 0 : height - infosTop;

  // Uma volta só nos primeiros 2s; depois congela. Giro com ease-in-out.
  const progress = Math.min(1, frame / Math.max(1, BOX_ANIM_END_FRAME - 1));
  const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const angle = easeInOut(progress) * Math.PI * 2; // uma volta completa (em radianos)
  const scaleProgress = progress; // tamanho total na primeira (e única) volta

  const boxWidth = animSize * BOX_FRACTION;
  const boxHeight = animSize * BOX_FRACTION;
  const gap = animSize * GAP_FRACTION;
  const dx = boxWidth / 2 + gap / 2;
  const dy = boxHeight / 2 + gap / 2;

  // Quatro cantos (centros dos boxes) em relação ao centro da tela
  const corners: [number, number][] = [
    [-dx, -dy], // top-left
    [dx, -dy],  // top-right
    [-dx, dy],  // bottom-left
    [dx, dy],   // bottom-right
  ];

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Extensão do grid para as linhas de separação (afinando nas pontas)
  const halfW = dx + (boxWidth * scaleProgress) / 2;
  const halfH = dy + (boxHeight * scaleProgress) / 2;
  const lineStrokeWidth = 1.5;

  const infosStartFrame = SLIDESHOW_START_FRAME; // infos após o box subir

  // Fase 1: esperar 2s com os 4 boxes congelados (frame 74–133)
  // Fase 2: primeira foto aumenta em 1s e assume o quadro (frame 134–163)
  // Fase 3: carrossel (frame 164+)
  const waitEndFrame = SLIDESHOW_START_FRAME + WAIT_AFTER_MOVE_FRAMES;
  const firstPhotoStartFrame = waitEndFrame;
  const firstPhotoEndFrame = CAROUSEL_START_FRAME;

  const inFirstPhotoPhase =
    frame >= firstPhotoStartFrame && frame < firstPhotoEndFrame;
  const inCarouselPhase = frame >= CAROUSEL_START_FRAME;

  // Esconde os 4 boxes só quando o carrossel começa (depois da imagem 1 assumir a tela toda)
  const hideFourBoxes = inCarouselPhase;

  // Primeira foto: centro do 1º box → centro da tela, aumentando ao mesmo tempo (um único progresso fluido)
  const frameInFirstPhoto = frame - firstPhotoStartFrame;
  const progressFirst = Math.min(
    1,
    frameInFirstPhoto / FIRST_PHOTO_ZOOM_FRAMES
  );
  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const p = easeInOutCubic(progressFirst);
  // Com translate(-50%,-50%) o left/top são o centro do elemento
  const firstBoxCenterX = animSize / 2 - dx;
  const firstBoxCenterY = animSize / 2 - dy;
  const firstPhotoCenterX =
    firstBoxCenterX + (animSize / 2 - firstBoxCenterX) * p;
  const firstPhotoCenterY =
    firstBoxCenterY + (animSize / 2 - firstBoxCenterY) * p;
  const firstPhotoLeft = firstPhotoCenterX;
  const firstPhotoTop = firstPhotoCenterY;
  const firstPhotoWidth = boxWidth + (animSize - boxWidth) * p;
  const firstPhotoHeight = boxHeight + (animSize - boxHeight) * p;
  const firstPhotoOpacity = progressFirst < 0.2 ? progressFirst / 0.2 : 1;
  // Imagem dentro do box com "quebra": fica em escala menor durante a expansão e só preenche no final / na troca pro carrossel
  const firstPhotoImageScale =
    progressFirst < 0.65 ? 0.88 : 0.88 + (1 - 0.88) * ((progressFirst - 0.65) / 0.35);

  // Carrossel: uma foto por vez, troca a cada 3s, zoom-in lento + fade no final
  const frameInSlideshow = Math.max(0, frame - CAROUSEL_START_FRAME);
  const cycleIndex = Math.floor(frameInSlideshow / SLIDESHOW_CYCLE_FRAMES);
  const t = frameInSlideshow % SLIDESHOW_CYCLE_FRAMES;
  const progressInCycle = t / SLIDESHOW_CYCLE_FRAMES;
  const zoom = 1 + (SLIDESHOW_ZOOM_END - 1) * progressInCycle;
  const fadeStart = SLIDESHOW_CYCLE_FRAMES - SLIDESHOW_FADE_FRAMES;
  const currentOpacity =
    t < fadeStart ? 1 : 1 - (t - fadeStart) / SLIDESHOW_FADE_FRAMES;
  const nextOpacity =
    t < fadeStart ? 0 : (t - fadeStart) / SLIDESHOW_FADE_FRAMES;
  const currentPhotoIndex = cycleIndex % carouselUrls.length;
  const nextPhotoIndex = (cycleIndex + 1) % carouselUrls.length;

  // Encerramento: tudo vai a opacidade 0, tela final com logo + nome + contatos (um a um, subindo com fade)
  const inFadeOut = frame >= FADEOUT_START_FRAME;
  const frameInFinal = frame - FADEOUT_START_FRAME;
  const fadeOutProgress = inFadeOut
    ? Math.min(1, frameInFinal / 20)
    : 0; // conteúdo principal some em ~0.7s
  const mainContentOpacity = 1 - fadeOutProgress;
  const finalScreenOpacity = inFadeOut ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#ffffff",
      }}
    >
      {/* Conteúdo principal: fade out no final */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: mainContentOpacity,
          pointerEvents: "none",
        }}
      >
      {/* Topo: logo | nome imobiliária | site (dinâmico) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: width,
          height: TOP_MARGIN,
          paddingTop: 20,
          paddingLeft: 32,
          paddingRight: 32,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "'Public Sans', sans-serif",
          backgroundColor: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              style={{
                width: 81,
                height: 81,
                borderRadius: 13,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 81,
                height: 81,
                borderRadius: 13,
                backgroundColor: "rgba(17, 82, 212, 0.12)",
                flexShrink: 0,
              }}
            />
          )}
          <span
            style={{
              fontSize: 49,
              fontWeight: 700,
              color: "#1e293b",
              letterSpacing: "-0.02em",
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {imobname}
          </span>
        </div>
        <span
          style={{
            fontSize: 39,
            fontWeight: 700,
            color: "#1152d4",
            wordBreak: "break-word",
            overflowWrap: "break-word",
          }}
        >
          {website}
        </span>
      </div>

      {/* Box da animação: começa no centro, depois sobe */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: animBoxY,
          width: width,
          height: animSize,
        }}
      >
        {/* 4 boxes: visíveis até a imagem 1 assumir a tela; depois z-index 0 e escondidos para o carrossel */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: animSize,
            height: animSize,
            transform: `translate(${animSize / 2}px, ${animSize / 2}px)`,
            zIndex: 0,
            opacity: hideFourBoxes ? 0 : 1,
            visibility: hideFourBoxes ? "hidden" : "visible",
          }}
        >
        {/* Linhas de separação entre os quadrados: finas e afinando nas pontas */}
        <svg
          style={{
            position: "absolute",
            left: -halfW,
            top: -halfH,
            width: halfW * 2,
            height: halfH * 2,
            transform: `rotate(${angle}rad)`,
            transformOrigin: "center center",
            pointerEvents: "none",
          }}
          viewBox={`0 0 ${halfW * 2} ${halfH * 2}`}
        >
          <defs>
            <linearGradient id="lineGradV" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="12%" stopColor="rgba(0,0,0,0.9)" />
              <stop offset="88%" stopColor="rgba(0,0,0,0.9)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            <linearGradient id="lineGradH" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="12%" stopColor="rgba(0,0,0,0.9)" />
              <stop offset="88%" stopColor="rgba(0,0,0,0.9)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
          </defs>
          <line
            x1={halfW}
            y1={0}
            x2={halfW}
            y2={halfH * 2}
            stroke="url(#lineGradV)"
            strokeWidth={lineStrokeWidth}
          />
          <line
            x1={0}
            y1={halfH}
            x2={halfW * 2}
            y2={halfH}
            stroke="url(#lineGradH)"
            strokeWidth={lineStrokeWidth}
          />
        </svg>
        {corners.map(([px, py], i) => {
          // Posição rotacionada em torno do centro (origem do container)
          const rotatedX = cos * px - sin * py;
          const rotatedY = sin * px + cos * py;

          const currentBoxWidth = boxWidth * scaleProgress;
          const currentBoxHeight = boxHeight * scaleProgress;

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: rotatedX,
                top: rotatedY,
                width: currentBoxWidth,
                height: currentBoxHeight,
                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                overflow: "hidden",
                boxSizing: "border-box",
                borderRadius: 5,
              }}
            >
              {/* Contador-rotação: imagem não gira, só acompanha o tamanho (box = máscara) */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "150%",
                  height: "150%",
                  marginLeft: "-75%",
                  marginTop: "-75%",
                  transform: `rotate(${-angle}rad)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={carouselUrls[i % carouselUrls.length]}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    minWidth: "100%",
                    minHeight: "100%",
                  }}
                />
              </div>
            </div>
          );
        })}
        </div>

        {/* Fase 2: imagem 1 sai do box do grid e cresce até preencher o quadro */}
        {inFirstPhotoPhase && (
          <div
            style={{
              position: "absolute",
              left: firstPhotoLeft,
              top: firstPhotoTop,
              width: firstPhotoWidth,
              height: firstPhotoHeight,
              transform: "translate(-50%, -50%)",
              overflow: "hidden",
              boxSizing: "border-box",
              borderRadius: 5,
              zIndex: 2,
              opacity: firstPhotoOpacity,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "150%",
                height: "150%",
                marginLeft: "-75%",
                marginTop: "-75%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={carouselUrls[0]}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  minWidth: "100%",
                  minHeight: "100%",
                  transform: `scale(${firstPhotoImageScale})`,
                }}
              />
            </div>
          </div>
        )}

        {/* Fase 3: carrossel — uma foto por vez, troca a cada 3s, zoom-in lento + fade no final */}
        {inCarouselPhase && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: animSize,
              height: animSize,
              overflow: "hidden",
              borderRadius: 5,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: currentOpacity,
              }}
            >
              <img
                src={carouselUrls[currentPhotoIndex]}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: `scale(${zoom})`,
                }}
              />
            </div>
            {nextOpacity > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: nextOpacity,
                }}
              >
                <img
                  src={carouselUrls[nextPhotoIndex]}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: "scale(1)",
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Infos: abaixo do box; altura limitada e alinhada ao rodapé da área útil */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: infosTop,
          width: width,
          height: infosHeight,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "stretch",
          boxSizing: "border-box",
        }}
      >
        <EstateInfos
          width={width}
          height={Math.min(infosHeight, INFOS_MAX_HEIGHT)}
          frame={frame}
          startFrame={infosStartFrame}
          listing={listing}
        />
      </div>
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: finalScreenOpacity,
          pointerEvents: "none",
        }}
      >
        <ImobFinalSignature
          frameInFinal={frameInFinal}
          logoUrl={logoUrl}
          imobname={imobname}
          website={website}
          client={client}
        />
      </div>
    </AbsoluteFill>
  );
};
