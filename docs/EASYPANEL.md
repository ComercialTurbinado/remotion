# Deploy no EasyPanel (Docker + HTTP)

Este repositório inclui um **Dockerfile** e o script **`scripts/http-server.mjs`**, que expõe:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Saúde do serviço (bundle já carregado ao subir). |
| POST | `/render` | Body JSON igual ao `render-from-json` → resposta **MP4** (`video/mp4`). |

## Variáveis de ambiente

- **`PORT`** — porta HTTP (padrão **8080**). No EasyPanel, use a porta que o painel injeta (muitas vezes `PORT`).

## EasyPanel (resumo)

1. Crie um app **Docker** apontando para este repositório GitHub.
2. **Build**: contexto na raiz; Dockerfile padrão `Dockerfile`.
3. **Porta**: mapeie a porta interna **8080** (ou a que você definir em `PORT`).
4. **Health check** (opcional): HTTP GET em `/health`.

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
