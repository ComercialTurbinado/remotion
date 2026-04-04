# Integração com sistema externo

Este documento orienta como **outro sistema** (CRM, CMS, fila de jobs, n8n, backend próprio, etc.) envia **dados do imóvel**, **mídias**, **legendas** e recebe o **vídeo MP4** gerado pelo serviço Remotion.

## Visão geral do fluxo

1. O seu sistema monta um **JSON** no formato descrito abaixo.
2. Envia uma requisição **HTTP POST** para o endpoint **`/render`** do serviço deployado (ou chama o script local `render-from-json`).
3. A resposta bem-sucedida é o **arquivo MP4** (`Content-Type: video/mp4`), não JSON.
4. Opcionalmente envia **legenda** em texto **SRT** no próprio JSON (`subtitlesSrt`).

```
┌─────────────────┐     POST /render (JSON)      ┌──────────────────────┐
│  Seu sistema    │ ───────────────────────────► │  API Remotion        │
│  (origem dados) │ ◄─────────────────────────── │  (render headless)   │
└─────────────────┘     corpo: MP4               └──────────────────────┘
```

## Endpoints HTTP (produção)

| Método | Caminho | Uso |
|--------|---------|-----|
| **GET** | `/health` | Verificar se o serviço está no ar. Resposta esperada: JSON `{"ok":true,"ready":true}`. Se vier HTML “Remotion Studio”, o deploy está com comando errado — ver [EASYPANEL.md](./EASYPANEL.md). |
| **GET** | `/preview` | Página de **teste** com textarea + botão: mesmo JSON do `POST /render`, útil para ajustar payload manualmente. |
| **POST** | `/preview` | **Mesmo body** do `POST /render` (`Content-Type: application/json`). Resposta **`text/html`**: tela **só com a animação** (Player sem barras de controle), fundo preto, ideal para **gravação de tela** no browser. Erros de validação: **400** com JSON `{ "error": "..." }`. |
| **POST** | `/render` | Enviar payload JSON e receber o MP4. |

**Exemplo (health):**

```bash
curl -sS "https://n8n-srcleads-remotion.dtna1d.easypanel.host/health"
```

**Exemplo (render + salvar arquivo):**

```bash
curl -sS -X POST "https://n8n-srcleads-remotion.dtna1d.easypanel.host/render" \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --output video.mp4
```

**Exemplo (preview só animação — HTML para abrir no browser e gravar tela):**

```bash
curl -sS -X POST "https://n8n-srcleads-remotion.dtna1d.easypanel.host/preview" \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --output preview-run.html
# Abra preview-run.html no Chrome (File → Open): CSS/JS vêm com URL absoluta do mesmo host.
```

Os arquivos `public/preview.bundle.js` e `public/preview-embed.bundle.js` **não vão no Git**; o deploy deve rodar `npm run build:preview` (Nixpacks `phases.build` ou `Dockerfile`). Se faltar, o servidor tenta gerar na subida.

### Boas práticas na integração

- **Timeout:** o render pode levar **vários minutos**. Configure o cliente HTTP (axios, fetch, Guzzle, etc.) com timeout alto (ex.: **10–20 minutos**) ou use fila assíncrona no seu lado (job dispara POST e worker aguarda).
- **Fila no servidor:** a API atual processa **um render por vez**; requisições simultâneas entram em fila. Evite disparar dezenas de POSTs ao mesmo tempo sem controle.
- **HTTPS:** em produção, use URL **https://** e certifique-se de que as URLs das imagens no JSON também sejam acessíveis pelo **servidor** Remotion (não só pelo navegador do usuário).
- **Autenticação:** este repositório **não** inclui API key no `/render`. Coloque o serviço atrás de **API Gateway**, **Traefik** com middleware, **VPN**, ou regra no EasyPanel, se precisar restringir acesso.

---

## Formato do JSON (`POST /render`)

### Campos de primeiro nível

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| **`animation`** | Sim | Um de: `op1`, `op2`, `op3`, `op4`, `op5`, `op6`. Define qual template de vídeo será renderizado. |
| **`input`** | Não | Objeto com `listing` e opcionalmente `baseUrl` (veja abaixo). Se omitido, entram valores padrão de demonstração. |
| **`subtitlesSrt`** | Não | String UTF-8 com o **conteúdo completo** de um arquivo `.srt`. Recomendado para integração HTTP. |
| **`subtitlesPath`** | Não | Caminho de arquivo `.srt` no **disco do servidor** (útil só em CLI/Docker com volume montado; **não** use para cliente remoto). |
| **`output`** | Não | Nome/caminho do arquivo de saída — **ignorado** na resposta HTTP (o arquivo vem no body); usado pelo script `render-from-json` em disco. |

### Objeto `input`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| **`listing`** | objeto | Dados do imóvel e mídias (estrutura na próxima seção). |
| **`baseUrl`** | string | URL base (com barra final opcional) para **prefixar** caminhos relativos em `carousel_images` / `selected_images` / `client.logo_url`. |

Exemplo: `baseUrl: "https://cdn.seudominio.com/imoveis/123/"` e `carousel_images: ["foto1.jpg"]` → o render tenta carregar `https://cdn.seudominio.com/imoveis/123/foto1.jpg`.

---

## Objeto `listing` (informações e mídia)

Os tipos TypeScript estão em [`src/types/listing.ts`](../src/types/listing.ts). Campos omitidos são mesclados com **defaults** internos (`normalizeListing`).

### Texto / identificação

| Campo | Tipo | Uso nas animações |
|-------|------|-------------------|
| `imobname` | string | Nome da imobiliária |
| `propertyCodes` | string | Código do imóvel |
| `prices` | objeto | Ex.: `{ "Venda": "R$ 1.200.000" }` ou `{ "Locação": "R$ 5.000" }` — o primeiro disponível é exibido como preço principal |
| `address`, `city`, `state` | string | Montam o endereço exibido |
| `client` | objeto | `logo_url`, `phone`, `email`, `website`, `instagram` — tela final / assinatura conforme a op |
| `design_config` | objeto | Configuração visual. Hoje é usado principalmente em `op6` para receber as cores predominantes: define a cor `primary` (destaque/fundo de blocos) e `secondary` (tons complementares). Aceita `primaryColor`/`secondaryColor` e aliases como `primary`, `secondary`, `primary_color`/`secondary_color`, `corPrincipal`/`corSecundaria` e ainda `colors: { primary, secondary }` ou `brand: { primary, secondary }`. Use cores CSS (ex.: `#ff7a00`, `rgb(17,24,39)`). Para o texto do topo, opcionalmente: `title`/`headline`/`titulo`/`propertyTitle`/`nomeTipo`. |

### Imagens (fundo / carrossel)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `carousel_images` | `string[]` | Lista de URLs (ou caminhos relativos com `baseUrl`) das fotos. **Prioridade** sobre `selected_images`. |
| `selected_images` | `string[]` | Fallback se `carousel_images` estiver vazio. |

**Importante — vídeos como fundo:** as composições atuais usam a tag **`<img>`** para o slideshow de fundo. Ou seja, esperam **URLs de imagem** (JPEG, PNG, WebP, etc.). **Arquivos de vídeo** (`.mp4`, `.web`) **não** são suportados como substituto direto dessas URLs neste projeto. Se o seu sistema só tiver vídeo, será necessário **gerar thumbnails/frames** ou estender o código com `<OffthreadVideo>` / `<Video>` do Remotion (fora do escopo deste guia).

**Acesso às URLs:** durante o render, o Chromium no servidor **baixa** cada URL. Elas devem ser **públicas** ou acessíveis da rede onde o container roda (sem bloqueio por IP incorreto).

### Cards e diferenciais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `infoCards` | array | Até 4 itens típicos: `{ "label": "Quartos", "value": "3", "icon": "bed" }`. O `icon` é o nome do **Material Symbol** (mesma família usada no layout). |
| `amenitiesList` | array | Lista de comodidades: string ou `{ "name": "Piscina", "icon": "pool" }`. |

Referência de ícones: [Google Material Symbols](https://fonts.google.com/icons) (use o nome em snake_case como no exemplo, ex. `square_foot`).

---

## Legendas (SRT)

- O conteúdo deve estar em **UTF-8**, no formato **SubRip (.srt)**.
- Envie no JSON na propriedade **`subtitlesSrt`** (string multilinha).
- Com SRT válido, a **duração** do vídeo pode ser calculada até o fim da última legenda (+ margem curta). Sem SRT, usa a duração fixa de cada `animation` no `Root`.
- **Quais ops mostram legenda na tela:** hoje **`op2`**, **`op3`** e **`op4`** renderizam o componente de legenda (`SrtOverlay`). Em **`op1`**, **`op5`** e **`op6`** o SRT **não** é desenhado no layout, mas ainda influencia **duração** se você passar `subtitlesSrt`.

Detalhes e comparação com FFmpeg: [LEGENDAS.md](./LEGENDAS.md).

Exemplo mínimo de trecho SRT:

```text
1
00:00:00,000 --> 00:00:03,000
Primeira linha da narração.

2
00:00:03,000 --> 00:00:06,000
Segunda linha.
```

No JSON, use `\n` ou string real com quebras de linha (dependendo de como seu sistema serializa o body).

---

## Escolha da animação (`animation`)

| Id | Ideia geral |
|----|-------------|
| `op1` | Cena principal (boxes + carrossel + infos + tela final). Sem overlay SRT no vídeo. |
| `op2` | Slideshow com infos no topo + legenda (SRT). |
| `op3` | Barra superior + infos em vidro + legenda (SRT). |
| `op4` | Abertura rápida + slideshow + assinatura + legenda (SRT). |
| `op5` | Painel vidro compacto (preço, endereço, cards, lazer); **sem** overlay SRT no layout; SRT só afeta duração se enviado. |
| `op6` | Card estilo “flyer” com preço/características/contatos; **sem** overlay SRT no layout (SRT só afeta duração). |

---

## Exemplo completo de payload

Arquivo de referência no repositório: [`payload.example.json`](../payload.example.json).

Exemplo com legenda inline (trecho curto):

```json
{
  "animation": "op3",
  "input": {
    "baseUrl": "https://cdn.exemplo.com/imovel-99/",
    "listing": {
      "prices": { "Venda": "R$ 890.000" },
      "address": "Rua das Flores, 500",
      "city": "Curitiba",
      "state": "PR",
      "carousel_images": [
        "https://cdn.exemplo.com/imovel-99/sala.jpg",
        "https://cdn.exemplo.com/imovel-99/fachada.jpg"
      ],
      "infoCards": [
        { "label": "Quartos", "value": "2", "icon": "bed" },
        { "label": "Banheiros", "value": "2", "icon": "bathtub" },
        { "label": "Área", "value": "78 m²", "icon": "square_foot" },
        { "label": "Vagas", "value": "1", "icon": "directions_car" }
      ],
      "amenitiesList": [
        { "name": "Sacada", "icon": "balcony" },
        { "name": "Elevador", "icon": "elevator" }
      ],
      "client": {
        "logo_url": "https://cdn.exemplo.com/logo.png",
        "phone": "+55 41 99999-0000",
        "instagram": "@imobiliaria"
      }
    }
  },
  "subtitlesSrt": "1\n00:00:00,000 --> 00:00:02,500\nApartamento no centro.\n\n2\n00:00:02,500 --> 00:00:05,000\nAgende sua visita.\n"
}
```

## Erros

- Respostas **4xx** com corpo JSON: `{ "error": "mensagem" }` — payload inválido, `animation` desconhecido, etc.
- **5xx** — falha no render (mídia inacessível, falta de memória, Chrome, etc.). Consulte os logs do container no EasyPanel.

---

## Integração sem HTTP (mesmo contrato de dados)

- **CLI / worker Node:** `npm run render:server -- arquivo.json` ou pipe JSON no stdin — mesmo schema, sem campo `output` necessário na resposta (grava em disco).
- Ver também [README.md](../README.md) (seção render servidor) e [EASYPANEL.md](./EASYPANEL.md) (deploy e webhook).

---

## Checklist rápido para o time de integração

- [ ] URL base **`/health`** retorna JSON `ok` / `ready`.
- [ ] **`POST /render`** com `Content-Type: application/json` e timeout longo.
- [ ] Imagens: URLs **https** acessíveis pelo servidor de render.
- [ ] **`animation`** ∈ `op1` … `op6`.
- [ ] Legenda: **`subtitlesSrt`** em UTF-8 (SRT); para legenda na tela preferir **`op2`**, **`op3`** ou **`op4`** (em **`op1`**, **`op5`** e **`op6`** o SRT só afeta duração, se aplicável).
- [ ] Não enviar URLs de **vídeo** no lugar de imagem no carrossel (não suportado no código atual).
