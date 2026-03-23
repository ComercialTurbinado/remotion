# Deploy no EasyPanel (Docker + HTTP)

Este repositório inclui um **Dockerfile** e o script **`scripts/http-server.mjs`**, que expõe:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Saúde do serviço (bundle já carregado ao subir). |
| POST | `/render` | Body JSON igual ao `render-from-json` → resposta **MP4** (`video/mp4`). |

## Variáveis de ambiente

- **`PORT`** — porta HTTP (padrão **8080**). No EasyPanel, use a porta que o painel injeta (muitas vezes `PORT`).

## EasyPanel (resumo)

1. **Preferível:** app **Docker** a partir do **`Dockerfile`** do repositório (Chrome headless + API estável).
2. **Se o painel usar Nixpacks** (`npm start` = Remotion Studio): o repo inclui **`nixpacks.toml`** para o comando de start ser **`node scripts/http-server.mjs`** (API com `/health` e `/render`). Faça um novo deploy após o pull.
3. **Ajuste manual no painel** (se ainda abrir “Remotion Studio” na raiz):
   - **Start command** → `node scripts/http-server.mjs` (ou `npm run serve:http`)
   - **Domínio / proxy — porta interna** → **`8080`**, ou a porta definida na variável **`PORT`** do serviço (se o EasyPanel injetar `PORT=3000`, use **3000** no proxy).
4. **Health check** (opcional): HTTP GET em `/health` (deve responder JSON `{"ok":true,"ready":true}`, não HTML do Studio).

### Sintoma: build Nixpacks falha com `sudo apt-get` (exit 100) ou `$NIXPACKS_PATH`

Não use `apt-get` manual no `nixpacks.toml` na fase `install` — o Nixpacks pode gerar `Dockerfile` com `sudo` e falhar. O repo usa só **`aptPkgs`** em `[phases.setup]`. Se o build continuar problemático, use **build por Dockerfile** (abaixo).

### Sintoma: `POST /render` retorna 400 e `libnspr4.so` / “Failed to launch the browser process”

A imagem precisa das libs do Chrome (incl. **libnspr4**). O **`Dockerfile`** na raiz instala tudo com `apt-get`. **Preferível:** no EasyPanel, tipo de build **Dockerfile** apontando para `./Dockerfile`, não só Nixpacks automático. Depois, **rebuild** do serviço.

### Sintoma: `curl .../health` devolve HTML “Remotion Studio”

O container ainda está rodando **`remotion studio`**. Corrija o **start command** ou use build por **Dockerfile**, conforme acima.

## Exemplo de chamada

```bash
curl -X POST "https://seu-dominio/render" \
  -H "Content-Type: application/json" \
  -d '{"animation":"op5","input":{"listing":{"prices":{"Venda":"R$ 1"}}}}' \
  --output video.mp4
```

- **`subtitlesSrt`**: pode ir no JSON (string do `.srt`).
- **`subtitlesPath`**: só funciona se esse caminho existir **dentro do container** (não é útil para cliente remoto; prefira `subtitlesSrt` na requisição).

## Recursos

Renderização é **sequencial** (uma por vez) para reduzir pico de memória. Ajuste CPU/RAM no painel (vídeo Remotion costuma precisar de **vários GB de RAM**).

## GitHub

Na raiz do projeto:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/remotion-boxes.git
git push -u origin main
```

Certifique-se de **não** commitar `node_modules/`, `out/` nem `.env` (já cobertos pelo `.gitignore`).

### Deploy automático (webhook EasyPanel)

Cada **push** na branch **`main`** dispara o workflow [`.github/workflows/easypanel-deploy.yml`](../.github/workflows/easypanel-deploy.yml), que chama o webhook de deploy do EasyPanel.

**URL do gatilho** (também configurada no workflow):

`http://3.210.217.206:3000/api/deploy/e0ced917512c130ccc8256373e88926b25f0861faea32fbe`

- É possível rodar o deploy manualmente em **Actions → Deploy EasyPanel → Run workflow**.
- Se o repositório for **público**, considere mover a URL para um [GitHub Secret](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions) (`EASYPANEL_DEPLOY_URL`) e usar `${{ secrets.EASYPANEL_DEPLOY_URL }}` no `curl`, para não expor o token do path.
