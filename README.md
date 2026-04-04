# Remotion – Repositório de animações

Animações em [Remotion](https://www.remotion.dev/) para uso em servidor (browserless). Cada animação tem um **id** (`op1` … `op6`). Você envia um JSON com o id e os dados; o servidor gera o MP4.

## Animações disponíveis

| Id   | Descrição |
|------|-----------|
| `op1` | Boxes girando, carrossel de fotos, infos do listing, tela final com logo e contatos |
| `op2` | Slideshow fullscreen com infos no topo |
| `op3` | Slideshow com barra topo (logo + WhatsApp) e infos em vidro |
| `op4` | Abertura rápida em 4 fotos (zoom-out) → slideshow lento → assinatura estilo op1 |
| `op5` | Slideshow + painel vidro compacto com infos (preço, endereço, cards, lazer) |
| `op6` | Card estilo “flyer” com preço/características/contatos |

## Como rodar no Studio

```bash
npm install
npm start
```

Abre o Remotion Studio. Selecione a composição desejada (`op1`–`op6`) no dropdown.

## Renderizar vídeo (CLI)

```bash
npm run render
```

Gera `out/video.mp4` com a animação `op1` e props padrão.

## Render no servidor (browserless) com JSON

Para rodar em servidor sem interface (Node + Chromium headless) e salvar em MP4:

### 1. JSON de entrada

Formato esperado:

```json
{
  "animation": "op1",
  "input": {
    "listing": {
      "client": { "logo_url", "phone", "email", "website", "instagram" },
      "carousel_images": ["url1", "url2", ...],
      "selected_images": [...],
      "imobname": "...",
      "propertyCodes": "...",
      "prices": { "Venda": "R$ ..." },
      "address": "...",
      "city": "...",
      "state": "...",
      "amenitiesList": [...],
      "infoCards": [...]
    },
    "baseUrl": "https://cdn.seudominio.com/"
  },
  "output": "out/video.mp4",
  "subtitlesPath": "/caminho/para/legenda.srt"
}
```

- **animation**: obrigatório. Um de `op1`, `op2`, `op3`, `op4`, `op5`, `op6`.
- **input**: opcional. Objeto passado para a composição (estrutura em `src/types/listing.ts`; todas as ops listadas usam `normalizeListing`).
- **output**: opcional. Caminho do MP4 (default: `out/video.mp4`). Pode ser absoluto ou relativo ao cwd.
- **subtitlesPath** ou **subtitlesSrt**: opcional. Legenda em formato SRT — ver [docs/LEGENDAS.md](docs/LEGENDAS.md).

### 2. Chamar o script

**Com arquivo JSON:**

```bash
npm run render:server -- payload.json
```

**Com stdin:**

```bash
echo '{"animation":"op1","input":{},"output":"out/meu-video.mp4"}' | npm run render:server
```

O script:

1. Faz o **bundle** do projeto (webpack).
2. Seleciona a composição pelo **animation**.
3. Chama **renderMedia** com **input**, **subtitlesSrt** (se houver) e grava em **output**.

Recomendado em servidor: ter Chromium/Chrome instalado (ou usar o que o Remotion baixa). Em Linux, podem ser necessárias dependências para headless; ver [Linux Dependencies](https://www.remotion.dev/docs/miscellaneous/linux-dependencies).

### 3. Integrar no seu sistema

- **Opção A**: no seu backend (Node), ler o JSON da requisição, escrever em um arquivo temporário e rodar `node scripts/render-from-json.mjs /tmp/payload.json` (ou passar o JSON via stdin).
- **Opção B**: usar o mesmo fluxo do script (bundle uma vez, chamar `renderMedia` várias vezes com payloads diferentes) para não bundlar a cada vídeo.
- **Opção C (HTTP / EasyPanel)**: subir o container Docker e chamar `POST /render` com o mesmo JSON — ver [docs/EASYPANEL.md](docs/EASYPANEL.md).

### API HTTP local

```bash
npm run serve:http
```

- `GET /health` — serviço pronto.
- `POST /render` — body JSON (igual ao `render:server`) → download do MP4.

`PORT` padrão: **8080** (use a variável de ambiente `PORT` no painel).

## Estrutura do projeto

- `src/index.ts` – entry que registra o root.
- `src/Root.tsx` – registra as composições `op1`–`op6`.
- `src/animations/registry.ts` – lista de ids de animações.
- `src/components/SrtOverlay.tsx` – legendas a partir de texto SRT.
- `docs/LEGENDAS.md` – Remotion vs FFmpeg para legendas.
- `src/SpinningBoxes.tsx` – animação `op1`; `src/animations/Option4.tsx` (`op4`), `Option5.tsx` (`op5`), `Option6.tsx` (`op6`).
- `src/types/listing.ts` – tipos e defaults do payload do listing.
- `scripts/render-from-json.mjs` – script de render headless que lê JSON e gera MP4.
- `scripts/render-core.mjs` – núcleo compartilhado (bundle + `renderMedia`).
- `scripts/http-server.mjs` – API HTTP (`/health`, `/render`) para Docker / EasyPanel.
- `Dockerfile` – imagem Debian + Chrome headless + servidor HTTP.
- `docs/EASYPANEL.md` – deploy no EasyPanel e exemplo `curl`.
- `docs/INTEGRACAO.md` – **integração com outro sistema** (POST `/render`, JSON, imagens, SRT, limitações).

## Adicionar nova animação (ex.: op6)

1. Em `src/animations/registry.ts`, adicione o id em `ANIMATION_IDS` (ex.: `"op6"`).
2. Em `scripts/render-from-json.mjs`, inclua o mesmo id no array `ANIMATION_IDS`.
3. Em `src/Root.tsx`, adicione um `<Composition id="op6" component={SuaAnimacao} ... />` e a duração em `DEFAULT_DURATIONS` se necessário.
4. Com isso, `render:server` aceita `"animation": "op6"` no JSON.
