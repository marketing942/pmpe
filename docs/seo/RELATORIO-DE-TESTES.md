# Relatório de testes — PMPE — Mentoria PMPE

Repositório: [`marketing942/pmpe`](https://github.com/marketing942/pmpe) · branch `seo/otimizacao-organica-20261023` (base `main`) · 23/10/2026
Relatório consolidado do ecossistema: [RELATORIO-GERAL-SEO-ECOSSISTEMA.md](RELATORIO-GERAL-SEO-ECOSSISTEMA.md)

## Testes técnicos

- Projeto estático, sem build, sem lint e sem testes no repositório.
- HTML servido localmente (`http-server`) e carregado no Chromium: sem erros de JavaScript novos.
- JSON-LD: parse OK em navegador.
- `git diff` revisado.

## Testes funcionais e de tracking

Original (worktree da `main`) e modificado servidos localmente lado a
lado; Chromium (Playwright) com **toda a rede externa interceptada**: o que a
página tenta chamar é registrado e abortado, então nenhum lead fictício chegou
à planilha, à PixelX ou ao WhatsApp.

| Teste | Resultado | Classificação |
|---|---|---|
| Fluxo de formulário/CTA (antes × depois) | Idêntico | Validado por teste de execução |
| Eventos no dataLayer no fluxo | gtm.js, modelo_pagina, clique_checkout | Validado por teste de execução |
| Chamadas externas no fluxo (interceptadas, nada enviado) | `GET https://fonts.googleapis.com/css2 ?display,family,family`<br>`GET https://pxa.cppem.com.br/lt/plano-de-combate-tatico ?utm_content`<br>`GET https://sgtm.cppem.com.br/metrics/` | Validado por teste de execução |
| Scripts (GTM e demais) idênticos | Sim | Validado por teste de execução |
| noscript do GTM idêntico | Sim | Validado por teste de execução |
| Formulários (ids, names, classes) idênticos | Sim | Validado por teste de execução |
| dataLayer no carregamento idêntico | Sim | Validado por teste de execução |
| Erros de JavaScript | Nenhum novo | Validado por teste de execução |
| DOM do `<body>` (tag, id, name, class, href, data-*) | Idêntico | Validado por teste de execução |
| Captura de tela (desktop / mobile) | 0.0% / 0.0% de pixels diferentes | Validado por teste de execução |

## Lighthouse (laboratório, mobile simulado, terceiros bloqueados)

| | Resultado |
|---|---|
| Antes | perf 67 · SEO 100 · acess. 98 · BP 96 · LCP 5,9 s · CLS 0,071 · TBT 170 ms |
| Depois | perf 65 · SEO 100 · acess. 98 · BP 96 · LCP 6,1 s · CLS 0,055 · TBT 240 ms |

Diferença dentro da variação do Lighthouse (nada de render mudou). O LCP alto vem do "render delay" da abertura animada e das fontes bloqueantes.

## O que não foi validado

- Disparo do **Lead na PixelX** e o recebimento no GTM server-side/Meta: o
  container e a PixelX vêm de `sgtm.cppem.com.br`/`pxa.cppem.com.br`, bloqueados
  neste ambiente. **Não validado por falta de acesso.** O código que a PixelX lê
  (id do form, `name` dos campos, evento `submit`) está idêntico.
- HTML, headers e redirecionamentos **em produção** (domínios bloqueados).
- Rich Results Test e Schema Markup Validator (sem acesso aos sites do Google);
  o JSON-LD foi validado por parse e por conferência manual dos campos
  obrigatórios.
