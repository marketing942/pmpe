# Mentoria PMPE — pmpe.cppem.com.br

Página de venda direta da **Mentoria PMPE**, com três planos (Operacional, Supremo e Tático) indo
direto para o checkout. Substituiu a antiga página de captação de leads, que continua no histórico do
Git.

Página estática: `index.html` + `styles.css` + `script.js` + `public/`, no sistema visual das landings
CPPEM (Oxanium + Rajdhani, ouro `#AF9256` sobre preto `#0A0A0B`). Deploy automático na Vercel a cada
push na `main`.

## Os dois modelos

| Endereço | Arquivo | Modelo | Quem vê |
|---|---|---|---|
| **pmpe.cppem.com.br** | `index.html` | **A · pré-edital** ("Está quase lançando…") | o público |
| **pmpe.cppem.com.br/edital** | `edital.html` | **B · edital lançado** ("Lançou o edital", carimbo, linha do edital) | a equipe (e a live) |

As duas páginas usam o mesmo `styles.css`, `script.js` e `public/`. O `/edital` já fica no ar antes do
edital, para o caso de ele sair de madrugada. Ele fica **fora do Google** (`noindex` na página e o
cabeçalho `X-Robots-Tag` no `vercel.json`) e sem link no site. Mesmo assim, é uma URL aberta: quem
tiver o link consegue ver.

O `index.html` não tem nada do modelo B, nem escondido no código-fonte.

> ⚠️ **Ajuste de conteúdo comum** (planos, textos, seções) vale para os **dois** arquivos. Mudou no
> `index.html`, mude também no `edital.html`. Preço e checkout moram no `script.js` e já valem para os
> dois.

## 📅 No dia do edital

1. **Datas.** Em `script.js`, preencha `CONFIG.edital` com o que o edital disser. Isso só aparece no
   `/edital`:
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
2. **Levar o B para o público** (quando for a hora): copie o `edital.html` para o `index.html` e, no
   `index.html`, apague a linha `<meta name="robots" content="noindex, nofollow">` e devolva o
   `<title>` da página principal.
   ```bash
   cp edital.html index.html
   # editar o index.html: tirar o meta robots e ajustar o <title>
   git commit -am "Edital publicado: modelo B na página principal"
   git push
   ```
   Até esse passo, o público continua vendo o pré-edital na raiz, e a equipe usa o `/edital`.

## Onde mexer

| O quê | Onde |
|---|---|
| Preços e links de checkout dos planos | `CONFIG.planos` no `script.js` |
| De/por do Supremo (hoje: total parcelado × à vista) | `CONFIG.planos.supremo` (`de`, `off`, `selo`) |
| Datas do edital (modelo B) | `CONFIG.edital` no `script.js` |

## A abertura

"MENTORIA" bate no vidro e "PMPE" sobe e colide. Toca uma vez por sessão. `?abertura=0` pula e
`?abertura=1` força. Logo abaixo do hero vem a prova social (os aprovados).

## Medição (dataLayer)

`modelo_pagina` · `clique_checkout` (plano, valor)

## Pendências

- **og:image** 1200×630 com URL absoluta, para o preview no WhatsApp e no Instagram.
- Se existir um preço cheio oficial do Supremo, ele substitui o "de" atual (total parcelado).
- Os arquivos da página antiga (`public/foto*.webp`, `bg-collage.jpg`, `exit-popup-kit/`,
  `TRACKING.md`, `EXIT-POPUP.md`, `validar-tracking.js`) não são usados pela página nova e podem ser
  removidos numa limpeza.
