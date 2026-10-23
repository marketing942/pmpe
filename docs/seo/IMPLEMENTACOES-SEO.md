# Implementações de SEO — PMPE — Mentoria PMPE

Repositório: [`marketing942/pmpe`](https://github.com/marketing942/pmpe) · branch `seo/otimizacao-organica-20261023` (base `main`) · 23/10/2026
Relatório consolidado do ecossistema: [RELATORIO-GERAL-SEO-ECOSSISTEMA.md](RELATORIO-GERAL-SEO-ECOSSISTEMA.md)

Commits na branch `seo/otimizacao-organica-20261023`. Nada foi publicado; merge e deploy dependem de aprovação.

## Arquivos modificados

| Arquivo | Alteração | Por quê |
|---|---|---|
| index.html (`<head>`) | Title, description, canonical, robots, `og:url`, `og:image` 1200×630, JSON-LD (Organization, WebSite, WebPage) | Relevância, CTR, consolidação |
| public/og-mentoria-pmpe.jpg (novo) | Recorte 1200×630 de `tropa-pmpe.jpeg` | Preview |
| robots.txt, sitemap.xml, .vercelignore (novos) | Bloqueia `/docs/`, `/exit-popup-kit/` e arquivos internos | Rastreamento |

## Metadados — antes × depois

Extraídos do HTML renderizado localmente (Playwright/HTTP), antes e depois.

| Campo | Antes | Depois |
|---|---|---|
| `title` | Mentoria PMPE — o plano de combate para a Polícia Militar de Pernambuco \| CPPEM | Mentoria PMPE 2026: Cronograma e Plano de Estudos \| CPPEM |
| `description` | Mentoria PMPE com o Prof. Everton Mota: cronograma individual, metas diárias, mentoria ao vivo e a plataforma CPPEM. 1.320 vagas autorizadas. Planos Operacional, Tático e Supremo. | Mentoria PMPE com o Prof. Everton Mota: cronograma individual, metas diárias, mentoria ao vivo e simulados para o edital de 1.320 vagas. Veja os planos. |
| `canonical` | — | https://pmpe.cppem.com.br/ |
| `robots` | — | index, follow, max-image-preview:large |
| `og:image` | — | https://pmpe.cppem.com.br/public/og-mentoria-pmpe.jpg |
| `og:url` | — | https://pmpe.cppem.com.br/ |
| JSON-LD |  | Organization, WebSite, WebPage |

## Dados estruturados

Só tipos aplicáveis e só com dados que a página mostra. Nada de avaliações,
preços inventados, prêmios ou credenciais. Sem `FAQPage` (o resultado de FAQ
foi restrito a sites de governo e saúde em 2023 — [Google — Mudanças nos resultados de FAQ/HowTo (2023)](https://developers.google.com/search/blog/2023/08/howto-faq-changes) — e o
changelog da documentação registra a descontinuação em 2026 — [Google — Atualizações da documentação da Pesquisa (changelog)](https://developers.google.com/search/updates)) e sem `Course`
(o Course Info saiu dos resultados em 2025: [Google — Simplificação da página de resultados (Course Info descontinuado, 2025)](https://developers.google.com/search/blog/2025/06/simplifying-search-results)). Sem promessa
de resultado enriquecido.

## Benefícios esperados

- Título e descrição alinhados à intenção principal → mais impressões
  relevantes e CTR (a confirmar no Search Console).
- Canonical absoluto → sinais concentrados no domínio de produção
  ([Google — Como especificar uma URL canônica](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
- `WebSite` com `name` no subdomínio → chance de o Google exibir o nome do site
  em vez do host ([Google — Nomes de sites na Pesquisa (subdomínios)](https://developers.google.com/search/docs/appearance/site-names)).
- Preview correto no WhatsApp/redes (tráfego de compartilhamento).
