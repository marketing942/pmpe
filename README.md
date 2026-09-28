# Mentoria PMPE — pmpe.cppem.com.br

Página de venda direta da **Mentoria PMPE**, com três planos (Operacional, Supremo e Tático) indo
direto para o checkout. Substituiu a antiga página de captação de leads, que continua no histórico do
Git.

Página estática: `index.html` + `styles.css` + `script.js` + `public/`, no sistema visual das landings
CPPEM (Oxanium + Rajdhani, ouro `#AF9256` sobre preto `#0A0A0B`). Deploy automático na Vercel a cada
push na `main`.

## Os dois modelos

| Modelo | Onde está | Quando vai ao ar |
|---|---|---|
| **A · pré-edital** ("Está quase lançando…") | branch `main` | agora |
| **B · edital lançado** ("Lançou o edital", carimbo, linha do edital) | branch `modelo-b-edital` | no dia do edital |

O modelo B **não está na `main`**: nem escondido, nem no código-fonte. Na branch `modelo-b-edital`, o B
é o padrão da página, e o A continua acessível por `?modelo=a`.

## 📅 No dia do edital

1. Troque para a branch do B:
   ```bash
   git checkout modelo-b-edital
   git merge main          # traz qualquer ajuste feito no A até lá
   ```
2. Em `script.js`, preencha `CONFIG.edital` com o que o edital disser:
   ```js
   edital: {
     publicacao: "12/10",
     inscricoes: "13/10 a 11/11",
     prova:      "14/12",
     taf:        "fev/2027",
     provaISO:   "2026-12-14T08:00:00-03:00"  // liga a contagem regressiva
   }
   ```
   Campo vazio mostra "Conforme edital". Sem `provaISO`, a contagem não aparece.
3. Confira localmente abrindo o `index.html`, e então publique:
   ```bash
   git commit -am "Atualiza datas do edital"
   git checkout main
   git merge modelo-b-edital
   git push
   ```

## Onde mexer

| O quê | Onde |
|---|---|
| Preços e links de checkout dos planos | `CONFIG.planos` no `script.js` |
| De/por do Supremo (hoje: total parcelado × à vista) | `CONFIG.planos.supremo` (`de`, `off`, `selo`) |
| Datas do edital (modelo B) | `CONFIG.edital` no `script.js` |
| Vídeo | `data-video-url` dos dois iframes (MacBook e iPhone) no `index.html` |

## A abertura e o vídeo

- **Abertura**: "MENTORIA" bate no vidro, "PMPE" sobe e colide. Toca uma vez por sessão.
  `?abertura=0` pula e `?abertura=1` força.
- **Desktop**: um MacBook que vem para a frente com a rolagem e liga o vídeo. O player é carregado
  antes, escondido, para o play ser instantâneo.
- **Celular**: um iPhone que cresce até ocupar a tela inteira. O vídeo toca mudo sozinho, e um toque
  liga o som e abre em tela cheia.
- **Som**: nenhum navegador toca som antes de a pessoa tocar ou clicar na página. Por isso o vídeo
  começa mudo, e o primeiro toque liga o som.
- **"Ativar som" da Panda**: fica coberto por um botão nosso, porque não dá para remover pela URL. Para
  tirar de vez, desligue o indicador de mudo no painel da Panda.

## Medição (dataLayer)

`modelo_pagina` · `clique_checkout` (plano, valor) · `mission_video_started` ·
`mission_video_sound_on` · `mission_video_tap`

## Pendências

- **og:image** 1200×630 com URL absoluta, para o preview no WhatsApp e no Instagram.
- Se existir um preço cheio oficial do Supremo, ele substitui o "de" atual (total parcelado).
- Os arquivos da página antiga (`public/foto*.webp`, `bg-collage.jpg`, `exit-popup-kit/`,
  `TRACKING.md`, `EXIT-POPUP.md`, `validar-tracking.js`) não são usados pela página nova e podem ser
  removidos numa limpeza.
