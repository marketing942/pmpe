# Auditoria SEO — PMPE — Mentoria PMPE

Repositório: [`marketing942/pmpe`](https://github.com/marketing942/pmpe) · branch `seo/otimizacao-organica-20261023` (base `main`) · 23/10/2026
Relatório consolidado do ecossistema: [RELATORIO-GERAL-SEO-ECOSSISTEMA.md](RELATORIO-GERAL-SEO-ECOSSISTEMA.md)

## Arquitetura

- **Domínio de produção:** pmpe.cppem.com.br — evidência: README (`# Mentoria PMPE — pmpe.cppem.com.br`) e mapa de origens do Apps Script.
- **Stack:** HTML + CSS + JavaScript estáticos. Vercel com `redirects` (`/edital` → `/`, temporário). Fontes do Google (Oxanium, Rajdhani).
- **Renderização:** HTML estático; preços dos planos e datas do edital são escritos pelo `script.js` a partir do `CONFIG` (o Google renderiza JS, mas o HTML inicial não tem esses valores).

## Rotas

| Rota | O que é | Indexação |
|---|---|---|
| / | Venda direta da Mentoria PMPE (planos Operacional, Tático, Supremo → checkout) | Indexar |
| /edital | Redireciona (307) para `/` | Não indexar (redirect) |

## Finalidade e classificação

- **Objetivo:** Página oficial de venda da Mentoria PMPE no modelo "edital lançado". CTAs dos planos vão ao checkout (`pxa.cppem.com.br/lt/plano-de-combate-*`).
- **Unidade de negócio:** CPPEM Concursos
- **Público:** Candidatos ao concurso da PM de Pernambuco (soldado e oficial).
- **Tipo de página:** Landing page de vendas.
- **Indexação recomendada:** Indexar. É a página com mais conteúdo e mais aderência a uma demanda ativa (edital publicado).
- **Potencial orgânico:** **Alto** — Edital PMPE 2026 publicado (1.320 vagas: 1.250 soldado, 70 oficial; banca Instituto AOCP; prova objetiva prevista para 21/02/2027 segundo fontes secundárias). Demanda concentrada de agora até a prova.

## Problemas encontrados

Gravidade: **P0** crítico (indexação/integridade) · **P1** alto impacto · **P2** médio · **P3** evolução · **Info** registro sem ação de SEO.

| Sev. | Problema | Evidência | Impacto | Status |
|---|---|---|---|---|
| P1 | Sem og:image | Nenhuma meta `og:image` | Preview sem imagem no WhatsApp | Corrigido (1200×630) |
| P1 | Sem canonical | Ausente; `/edital` redireciona e há UTMs | Consolidação de sinais | Corrigido |
| P1 | Title longo (77 caracteres) | `Mentoria PMPE — o plano de combate para a Polícia Militar de Pernambuco \| CPPEM` | Corte no resultado; termos de busca no fim | Corrigido (57) |
| P1 | Datas do edital vazias | `CONFIG.edital` com todos os campos vazios → página mostra "Conforme edital" e não exibe a contagem regressiva | Perde relevância para "inscrições PMPE", "data da prova PMPE" e confiança do comprador | Recomendado (preencher após conferir o edital oficial; mexe no `script.js`) |
| P2 | Description com 196 caracteres |  | Corte | Corrigido (152) |
| P2 | Sem dados estruturados, robots.txt e sitemap |  |  | Corrigido |
| P3 | `/edital` com redirect temporário | `vercel.json`: `permanent: false` | Se o endereço não volta a existir, um 308 passa os sinais com mais clareza | Recomendado |
| P3 | Texto do H1 | `aria-label="Mentoria PMPE"`; o texto visível emenda "OficialEdital lançado" (sem espaço entre `<small>` e `<b>`) | Leitura do H1 pelo Google | Recomendado |

## Limitações desta auditoria

- **Produção inacessível desta sessão.** O proxy de rede do ambiente recusou
  conexões a `*.cppem.com.br` e `*.vercel.app`, e o leitor de páginas não
  resolveu esses domínios. Nada foi medido no site publicado: HTML servido,
  status HTTP, redirecionamentos e headers reais ficam **não validados**.
  Toda a auditoria foi feita no código e em servidores locais.
- **Sem Google Search Console, GA4, Keyword Planner, Trends, Semrush ou Ahrefs.**
  Não há volume, dificuldade, CPC nem posição. Nenhum número desse tipo
  aparece aqui. As prioridades de palavra-chave são **estimativas
  qualitativas** (intenção, tipo de página que aparece hoje, relevância
  comercial) e devem ser confirmadas no Search Console e no Planejador.
- **SERP observada com a busca web disponível, que não é o Google.** Os
  concorrentes listados são os que apareceram nessa busca e servem como
  indício, não como ranking do Google.
- **Lighthouse é dado de laboratório**, rodado localmente com os terceiros
  (GTM, PixelX, fontes do Google) bloqueados. Serve para comparar antes ×
  depois, não para prever o Core Web Vitals real (dado de campo do CrUX).
