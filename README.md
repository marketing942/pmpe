# Mentoria PMPE — pmpe.cppem.com.br

Página de venda direta da **Mentoria PMPE**, com três planos (Operacional, Supremo e Tático) indo
direto para o checkout. Substituiu a antiga página de captação de leads, que continua no histórico do
Git.

Página estática: `index.html` + `styles.css` + `script.js` + `public/`, no sistema visual das landings
CPPEM (Oxanium + Rajdhani, ouro `#AF9256` sobre preto `#0A0A0B`). Deploy automático na Vercel a cada
push na `main`.

## O modelo no ar

**Modelo B · edital lançado** ("Lançou o edital", carimbo EDITAL LANÇADO, linha do edital) em
`pmpe.cppem.com.br`. Ele entrou no lugar do modelo A (pré-edital), que continua no histórico do Git.
O antigo endereço da equipe, `/edital`, redireciona para a página principal (`vercel.json`).

### Datas do edital

Em `script.js`, preencha `CONFIG.edital` com o que o edital disser:

```js
edital: {
  publicacao: "12/10",
  inscricoes: "13/10 a 11/11",
  prova:      "14/12",
  taf:        "fev/2027",
  provaISO:   "2026-12-14T08:00:00-03:00"  // liga a contagem regressiva
}
```

Campo vazio mostra "Conforme edital". Sem `provaISO`, a contagem regressiva não aparece.

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
