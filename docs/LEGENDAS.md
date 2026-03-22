# Legendas (SRT)

## Remotion (neste projeto)

As composições **op1**–**op5** aceitam a prop opcional **`subtitlesSrt`**: o texto completo do arquivo `.srt` em UTF-8. O componente `SrtOverlay` sincroniza pelo tempo do vídeo (`frame / fps`).

### Duração do vídeo e o SRT

Quando **`subtitlesSrt`** está preenchido (e o arquivo parseia com pelo menos uma cue), a **duração da composição** passa a ser calculada automaticamente: do início até o **fim da última legenda**, mais cerca de **0,5 s** de margem. Assim o MP4 acompanha o roteiro da legenda.

Sem SRT (ou SRT vazio/inválido), vale a duração fixa definida em `src/Root.tsx` para cada id (ex.: `op1` ~31 s, `op2`/`op3`/`op5` ~30 s, `op4` ~29 s a 30 fps — valores aproximados).

### Studio

Cole o conteúdo do `.srt` no painel de props do Remotion, no campo **`subtitlesSrt`** (ou carregue via fluxo que você preferir para injetar props).

### Render via JSON (`render:server`)

No JSON de payload, use **`subtitlesPath`** com caminho absoluto ou relativo ao diretório de onde você roda o comando:

```json
{
  "animation": "op1",
  "input": {},
  "subtitlesPath": "/Volumes/Extreme-SSD/Downloads/leg-7926 (1).srt",
  "output": "out/video-com-legenda.mp4"
}
```

Alternativa: enviar o texto inline em **`subtitlesSrt`** (útil para testes curtos).

### CLI Remotion (`remotion render`)

É possível passar props com `--props` apontando para um JSON que contenha `subtitlesSrt` (string com o arquivo inteiro). Caminhos de arquivo diretos na CLI dependem da sua shell; para paths com espaços, prefira `subtitlesPath` no script Node acima.

---

## FFmpeg (só pós-processamento)

Se você já tem um MP4 **sem** legenda no Remotion, pode queimar o SRT no FFmpeg:

```bash
ffmpeg -i out/video.mp4 -vf "subtitles='caminho/legenda.srt'" -c:a copy out-com-legenda.mp4
```

No macOS/Linux, com espaços no nome do arquivo, use `subtitles='/Volumes/Extreme-SSD/Downloads/leg-7926 (1).srt'` (aspas simples por fora).

**Quando usar cada um**

| Abordagem | Vantagem |
|-----------|----------|
| **Remotion** | Tipografia, posição e contraste iguais ao layout do vídeo; tudo em um único render. |
| **FFmpeg** | Rápido para reaproveitar um MP4 já exportado; estilo controlado por `force_style` do filtro subtitles. |
