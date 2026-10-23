# Relatório geral de SEO — ecossistema CPPEM

23/10/2026 · branch `seo/otimizacao-organica-20261023` em cada repositório · publicado com aprovação do responsável.

## Resumo

- **Repositórios analisados:** 9 (7 páginas estáticas na Vercel + 2 apps Next.js).
- **Rotas de conteúdo identificadas:** 12 (contando os modelos dinâmicos da Central de Ajuda como uma rota cada), mais 1 redirecionamento (`pmpe /edital`) e 2 APIs.
- **Rotas com potencial orgânico:** todas as de conteúdo; Black Friday só em marca e na janela da campanha.
- **Problemas (sem contar registros "Info"):** 65 · **corrigidos/mitigados na branch:** 41 · os demais são recomendações que dependem de decisão, dado ou acesso.
- **Tracking:** nenhum ID, evento, script, seletor ou endpoint alterado; fluxos de formulário e checkout idênticos antes × depois em teste de execução.

## Matriz inicial

| Repositório | Finalidade | Stack | Domínio | Rotas | Indexação recomendada | Potencial SEO |
|---|---|---|---|---|---|---|
| [PMPE — Mentoria PMPE](https://github.com/marketing942/pmpe) | Landing page de vendas. | HTML/CSS/JS estático (Vercel) | pmpe.cppem.com.br | `/`<br>`/edital` | Indexar | **Alto** — Edital PMPE 2026 publicado (1.320 vagas: 1.250 soldado, 70 oficial; banca Instituto AOCP; prova objetiva prevista para 21/02/2027 segundo fontes secundárias). Demanda concentrada de agora até a prova. |
| [Contato Colégio CPPEM](https://github.com/marketing942/Contato-Colegio) | Página de captura com conteúdo institucional (pilares, depoimentos, nova sede, endereços). | HTML/CSS/JS estático (Vercel) | contato.colegio.cppem.com.br | `/` | Indexar | **Alto (local)** — Busca local por escola particular tem intenção forte e sazonalidade agora (matrículas 2027). Concorrentes locais aparecem em agregadores (Melhor Escola, Escol.as, Quero Bolsa). |
| [SRV PMPE — Super Revisão de Véspera](https://github.com/marketing942/SRV-PMPE) | Página de evento / venda. | HTML/CSS/JS estático (Vercel) | srv-pmpe.cppem.com.br | `/` | Indexar até o evento; depois, manter como "edição anterior" ou redirecionar para a próxima edição (decisão) | **Médio** — Busca local e sazonal (semanas antes de 21/02/2027). Concorrência direta em plataformas de evento (Sympla) e em blogs de revisão de véspera. |
| [Supletivo](https://github.com/marketing942/supletivo) | Landing de vendas/captação. | Next.js 14 (SSG, Vercel) | supletivo.cppem.com.br (o cppem-supletivo-filiado.vercel.app segue no ar e aponta o canonical para cá) | `/`<br>`/robots.txt, /sitemap.xml` | Indexar, com ressalvas de conformidade das promessas (ver P1) | **Alto (demanda) / Médio (viabilidade)** — "Supletivo online" e "EJA online" têm demanda nacional, mas a SERP tem guias de marcas grandes (Pravaler, Descomplica) e a página é de parceiro filiado — risco de conteúdo parecido com outras páginas da rede. |
| [Contato Unicive](https://github.com/marketing942/Contato-unicive) | Página de captura com catálogo resumido de cursos e FAQ. | HTML/CSS/JS estático (Vercel) | contato.unicive.cppem.com.br | `/` | Indexar | **Médio** — Há demanda local por graduação EAD, mas a SERP é dominada por agregadores (ead.com.br, Quero Bolsa, Educa Mais Brasil) e grandes grupos. Os cursos de segurança pública são o nicho com mais aderência ao público CPPEM. |
| [Mentoria Individual](https://github.com/marketing942/mentoria-individual) | Landing de captação/vendas. | HTML/CSS/JS estático (Vercel) | individual.cppem.com.br | `/` | Indexar | **Médio** — Nicho comercial claro ("mentoria para concursos policiais"); concorrência de mentorias da Gran e de mentores independentes. |
| [Contato CPPEM](https://github.com/marketing942/Contato-CPPEM) | Página de captura (lead) com argumentos de venda (dores, comparativo, prova social). | HTML/CSS/JS estático (Vercel) | contato.cppem.com.br | `/` | Indexar | **Médio** — Termos genéricos de alta concorrência e conteúdo enxuto; a página serve melhor a buscas de marca e de cauda média. O site institucional (cppem.com.br, fora deste escopo) tende a ser o destino natural dos termos amplos. |
| [Central de Ajuda CPPEM](https://github.com/marketing942/Central_de_Ajuda) | Central de suporte. | Next.js 16 (SSR, Notion; Docker/Vercel) | central-de-ajuda.cppem.com.br (e confirma.cppem.com.br reescrito para /confirma) | `/`<br>`/[categoria]`<br>`/artigo/[categoria]/[artigo]`<br>`/confirma`<br>`/api/consultar, /api/revalidate`<br>`/robots.txt, /sitemap.xml` | Indexar | **Médio (marca)** — Volume baixo, mas cada artigo responde uma dúvida real e reduz atendimento; `/confirma` protege contra golpes que usam o nome da marca. |
| [Black Friday CPPEM](https://github.com/marketing942/BlackFriday-CPPEM) | Campanha temporária / captura. | HTML/CSS/JS estático (Vercel) | black-friday.cppem.com.br | `/` | Indexar enquanto a campanha estiver ativa | **Baixo** — Demanda praticamente só de marca ("black friday CPPEM") e janela de dias. Termos genéricos ("black friday cursos concurso") são de grandes players e notícias. |

## Problema, oportunidade e status por repositório

| Repositório | Problema principal | Oportunidade | Prioridade | Implementação | Status |
|---|---|---|---|---|---|
| PMPE — Mentoria PMPE | Sem og:image | Concurso com edital aberto: maior janela de demanda do ecossistema até a prova. Mirar "mentoria/preparatório/cronograma PMPE" e ser destino dos links de conteúdo sobre o edital. | P1 | 5/8 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Contato Colégio CPPEM | Title sem termo de busca | Aparecer para famílias que procuram escola em Caruaru durante as matrículas 2027, com o diferencial que nenhum concorrente local destaca: cristã + militarizada + preparatória. | P1 | 3/7 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| SRV PMPE — Super Revisão de Véspera | Sem dados estruturados de evento | Ser o resultado local para "aulão/revisão de véspera PMPE" e aparecer na experiência de eventos do Google. | P1 | 4/5 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Supletivo | Sem canonical, robots e sitemap num domínio *.vercel.app | Demanda nacional alta; diferencial possível é o atendimento humano local (Caruaru) e a ponte com a graduação Unicive. | P0 | 2/8 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Contato Unicive | Title sem termo de busca | Capturar "graduação/tecnólogo EAD em Caruaru" e o nicho de cursos para quem é ou quer ser da segurança pública (Gestão da Atividade Policial, Criminologia, Segurança Privada), que conversa com a base do CPPEM. | P1 | 5/8 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Mentoria Individual | Title com marca na frente e sem a categoria | Disputar "mentoria para concursos policiais" com prova de autoridade do mentor e FAQ forte que já existe. | P1 | 5/6 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Contato CPPEM | og:image quebrada | Ser a porta de entrada de quem pesquisa "preparatório para concursos policiais" e ainda não conhece a CPPEM, e capturar buscas de marca ("CPPEM", "CPPEM concursos"). | P1 | 8/10 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Central de Ajuda CPPEM | Home e categorias sem canonical | Ocupar a SERP de marca com respostas oficiais e trilhas (breadcrumbs), e ser a referência antifraude. | P1 | 4/7 itens corrigidos na branch | Aguardando revisão (Draft PR) |
| Black Friday CPPEM | Sem canonical, og:url e og:image absolutos | Capturar quem procura a campanha pelo nome e acumular autoridade ano a ano. | P1 | 5/6 itens corrigidos na branch | Aguardando revisão (Draft PR) |

## Ranking estratégico de oportunidades

Critérios: relevância comercial, demanda (verificada por fontes públicas quando
existe, senão estimada), condição técnica e risco.

1. **PMPE — Mentoria PMPE** — Edital aberto (1.320 vagas) = maior demanda ativa do ecossistema até a prova (21/02/2027, a confirmar no edital). Página de venda madura; correções técnicas feitas; falta preencher as datas do edital.
2. **Contato Colégio CPPEM** — Busca local com intenção forte e sazonal agora (Matrículas 2027). Diferencial claro (cristã + militarizada + preparatória). Depende do domínio e do Google Business Profile.
3. **SRV PMPE — Super Revisão de Véspera** — Evento real, local e datado: elegível à experiência de eventos do Google. Pico de busca nas semanas antes da prova. Depende do domínio.
4. **Supletivo** — Maior demanda nacional, mas SERP difícil e promessas sensíveis (MEC/90 dias) a validar. Correção técnica crítica feita (canonical/robots/sitemap/FAQ).
5. **Contato Unicive** — Demanda local de graduação EAD + nicho de cursos de segurança pública ligado à base CPPEM. Agregadores dominam; possível canibalização com unicive.cppem.com.br.
6. **Mentoria Individual** — Nicho comercial claro, concorrência nacional (Gran). Ganho técnico relevante (imagens/LCP).
7. **Contato CPPEM** — Termos amplos e concorridos; o site institucional é o destino natural. Valor maior em marca e preview correto.
8. **Central de Ajuda CPPEM** — Volume baixo, mas protege a marca (golpes) e reduz atendimento.
9. **Black Friday CPPEM** — Sazonal e só de marca; vale mais uma URL perene do que otimização desta edição.

## Diagnóstico do ecossistema

1. **Maior potencial de tráfego:** Supletivo (demanda nacional) e Mentoria PMPE (edital aberto).
2. **Melhores oportunidades comerciais:** Mentoria PMPE, Colégio (matrículas 2027) e Super Revisão (ingressos).
3. **Subaproveitadas:** Colégio (title "Fale com a gente" e sem domínio canônico) e Supletivo (respondia só em *.vercel.app, sem canonical/sitemap, FAQ invisível).
4. **Prioridade imediata:** Search Console e envio dos sitemaps.
5. **Pouco benefício de indexação:** Black Friday (sazonal, marca).
6. **Páginas concorrendo entre si:** Contato CPPEM tinha "(PMPE)" no title (corrigido). Riscos fora do escopo: Contato Unicive × unicive.cppem.com.br; Contato CPPEM × cppem.com.br/turmas; Contato Colégio × site institucional do Colégio.
7. **Produtos sem página para a intenção:** "edital PMPE 2026" (informacional), cursos de segurança pública da Unicive (uma página por curso), "como verificar se o supletivo é válido".
8. **Links internos:** feito: Super Revisão → Mentoria PMPE (mesma prova, mesmo público). Propostos: Mentoria PMPE → Super Revisão; Contato Unicive (FAQ "sem Ensino Médio") → Supletivo; rodapé das landings → Central de Ajuda/confirma (suporte e antifraude). Não propostos: links entre Colégio e concursos (públicos e ofertas diferentes).
9. **Palavras sem página apropriada:** "edital PMPE 2026", "TAF PMPE", "gestão da atividade policial EAD", "criminologia EAD", "matrícula 2027 Caruaru", "supletivo é reconhecido pelo MEC".
10. **Crescimento conjunto:** cada intenção com uma URL dona (tabela abaixo); o domínio principal cppem.com.br concentra conteúdo informacional e distribui links para as landings; as landings ficam focadas em conversão.

## Divisão de intenções (anti-canibalização)

| Intenção | URL dona | Observação |
|---|---|---|
| preparatório para concursos policiais | cppem.com.br/turmas **ou** contato.cppem.com.br | Decidir; hoje as duas podem disputar |
| mentoria / preparatório / cronograma PMPE | pmpe.cppem.com.br | Implementado |
| revisão de véspera / aulão PMPE | srv-pmpe.cppem.com.br | Implementado |
| edital PMPE 2026 (informacional) | nova página no domínio principal | Proposto |
| mentoria para concursos policiais | individual.cppem.com.br | Implementado |
| graduação EAD / tecnólogo em Caruaru | contato.unicive.cppem.com.br **ou** unicive.cppem.com.br | Decidir |
| supletivo online / EJA | Supletivo | Implementado |
| escola cristã e militarizada em Caruaru / Colégio CPPEM | Contato Colégio (ou site do Colégio) | Decidir com o site institucional |
| suporte / número oficial CPPEM | central-de-ajuda.cppem.com.br | Implementado |
| black friday CPPEM | URL perene proposta | Proposto |

Nenhum redirecionamento ou consolidação foi implementado: todos têm impacto comercial e dependem de aprovação.

## Achados transversais de tracking (não alterados)

- O mesmo id de formulário da PixelX (`IPEyzyfmJhKQEYIXAlZH`) está em Contato CPPEM, Mentoria Individual e Supletivo. Leads de três páginas podem cair na mesma regra do painel. Confirmar se é intencional (o `TRACKING.md` do Contato CPPEM, §8.1, descreve esse risco).
- noscript do GTM do SRV-PMPE sem `?id=GTM-PJ379FLQ` (difere das demais).
- Contato Unicive envia e-mail, nome e telefone na query string do link do WhatsApp (LGPD).
- Supletivo carrega o GTM depois da hidratação (`afterInteractive`), não no topo do `<head>` como as estáticas.
- Central de Ajuda não tem nenhuma mensuração.

## Mensuração

**Linha de base:** não foi possível estabelecer — sem acesso ao Search Console e ao GA4 nesta sessão. Nenhuma métrica foi inventada.

Para medir depois do merge:

1. Search Console: propriedade de **domínio** `cppem.com.br` (cobre todos os subdomínios) + propriedades de prefixo para `*.vercel.app` se ainda recebem tráfego.
2. Enviar os sitemaps: `contato.cppem.com.br`, `contato.unicive.cppem.com.br`, `pmpe.cppem.com.br`, `individual.cppem.com.br`, `central-de-ajuda.cppem.com.br`, `supletivo.cppem.com.br`, `black-friday.cppem.com.br`, `contato.colegio.cppem.com.br` e `srv-pmpe.cppem.com.br`.
3. Exportar 28 dias **antes** do deploy (impressões, cliques, CTR, posição média por consulta e por página) como linha de base.
4. Leads orgânicos: o Apps Script já grava `pagina_url` e UTMs; lead sem UTM e com referrer de buscador pode ser marcado como orgânico — exige mudança no `script.js`/Apps Script (aprovação).
5. GA4: segmento "Organic Search" por página de destino e conversões por landing.
6. Reavaliar com 4, 8 e 12 semanas. Não atribuir variação de tráfego só ao SEO sem olhar sazonalidade (edital, matrículas, Black Friday) e mídia paga no mesmo período.

## As 10 ações de maior impacto

| # | Situação | Ação | Repositórios |
|---|---|---|---|
| 1 | Implementado | Canonical absoluto + robots + sitemap no Supletivo (no ar só em *.vercel.app) e FAQ completo no HTML | supletivo |
| 2 | Implementado | Title/description por intenção nas 9 páginas, sem PMPE fora da página da PMPE | todos |
| 3 | Implementado | Imagens OG 1200×630 absolutas onde o domínio é conhecido (5 projetos) e og:image quebrada corrigida | contato-cppem, contato-unicive, pmpe, mentoria-individual, central_de_ajuda |
| 4 | Implementado | JSON-LD de evento na Super Revisão e de escola no Colégio | srv-pmpe, contato-colegio |
| 5 | Implementado | Fotos do carrossel 14,7 MB → 0,74 MB e logos pesados (LCP Unicive 6,2→4,5 s; Mentoria 7,7→6,8 s em laboratório) | contato-cppem, mentoria-individual, contato-unicive |
| 6 | Implementado | Domínios de Black Friday, Colégio, Super Revisão e Supletivo aplicados: canonical, og:url, og:image e sitemap | blackfriday-cppem, contato-colegio, srv-pmpe, supletivo |
| 7 | Depende de você | Search Console (propriedade de domínio cppem.com.br) + envio dos sitemaps; linha de base de 28 dias | todos |
| 8 | Depende de você | Preencher as datas do edital na Mentoria PMPE com o edital oficial (Instituto AOCP) | pmpe |
| 9 | Depende de você | Google Business Profile do Colégio com o mesmo endereço/telefone do site | contato-colegio |
| 10 | Depende de você | Validar as promessas "reconhecido pelo MEC"/"90 dias" do Supletivo com a Estação Cursos e publicar o ato de credenciamento | supletivo |

## O que depende de você

- Decisões de URL dona nas intenções marcadas "Decidir".
- `.vercelignore` para não publicar `README.md`, `TRACKING.md` e `google-apps-script.js` (muda o que vai para o ar; hoje só `docs/seo/` foi excluído).

## Limitações

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

## Fontes consultadas

- [Google — Como especificar uma URL canônica](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google — Nomes de sites na Pesquisa (subdomínios)](https://developers.google.com/search/docs/appearance/site-names)
- [Google — Dados estruturados de evento (o que não é evento)](https://developers.google.com/search/docs/appearance/structured-data/event)
- [Google — Mudanças nos resultados de FAQ/HowTo (2023)](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Google — Atualizações da documentação da Pesquisa (changelog)](https://developers.google.com/search/updates)
- [Google — Simplificação da página de resultados (Course Info descontinuado, 2025)](https://developers.google.com/search/blog/2025/06/simplifying-search-results)
- [Google — Course list (o que ainda é suportado)](https://developers.google.com/search/docs/appearance/structured-data/course)
- [Google — Diretrizes gerais de dados estruturados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google — JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google — Criar conteúdo útil e confiável](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals)
- [Estratégia Concursos — Edital PM PE 2026 publicado (1.320 vagas)](https://www.estrategiaconcursos.com.br/blog/concurso-pmpe-edital-publicado-2026/)
- [Gran — Edital PMPE 2026 publicado](https://blog.grancursosonline.com.br/concurso-pm-pe-edital-publicado-2026/)
- [Cursos do Portal — PM PE 2026 (prazo estendido até 23/11, a confirmar)](https://cursosdoportal.com.br/noticias/concurso-pm-pe-2026-edital-publicado-de-r-561792-a-r-1293733-com-1320-vagas)
- [Nova Concursos — Concurso PM PE](https://www.novaconcursos.com.br/portal/concursos/concurso-pm-pe/)
- [Método 4.2 — Mentoria (concorrente em PM PE)](https://metodo4ponto2.com.br/oncurso-pm-pe-2026-edital-inscricoes-abertas)
- [Portal de Prefeitura — Conteúdos do edital PMPE](https://portaldeprefeitura.com.br/oportunidades/concurso-pmpe-veja-conteudos-cobrados-nas-provas-do-novo-edital/633281/)
- [Gran — PM PE Informática (datas: prova 21/02/2027, TAF 23/07/2027)](https://www.grancursosonline.com.br/cursos/por-materia/pm-pe-policia-militar-do-estado-de-pernambuco-informatica-para-soldado-praca-da-policia-militar-qpmg-professor-jeferson-bogo)
- [Sympla — Super Aulão de Véspera PM Pernambuco em Caruaru (concorrente, edição anterior)](https://www.sympla.com.br/super-aulao-de-vespera-pm-pernabuco-praca-em-caruaru-pe__2290857)
- [Estratégia — Revisão de véspera PM PE](https://www.estrategiaconcursos.com.br/blog/revisao-de-vespera-pm-pe-soldado-e-oficial-confira/amp/)
- [RuaCEP — Shopping Difusora (Av. Agamenon Magalhães, 44)](https://www.ruacep.com.br/pe/caruaru/mauricio-de-nassau/55012903/shopping-difusora/)
- [Buser — Shopping Difusora (Av. Agamenon Magalhães, 444)](https://www.buser.com.br/destinos/pontos-turisticos/pe/caruaru/shopping-difusora)
- [Gran — Mentoria concursos policiais PE 2026](https://blog.grancursosonline.com.br/concursos-policiais-pe-mentoria-2026/amp/)
- [Gran — Mentoria para carreiras policiais (Camila Quindere)](https://www.grancursosonline.com.br/cursos/coaching-para-concursos/mentoria-para-carreiras-policiais-com-camila-quindere)
- [Gran — Mentoria Furando a Fila (PMDF, PMGO, PRF, PCDF)](https://www.grancursosonline.com.br/cursos/coaching-para-concursos/mentoria-furando-a-fila-da-aprovacao-concursos-policiais-2-em-1-pmdf-pmgo-prf-e-pcdf-leandro-antunes)
- [Pravaler — Supletivo a distância](https://www.pravaler.com.br/blog/supletivo/supletivo-a-distancia-o-que-e-e-como-funciona/)
- [Descomplica — Como funciona o supletivo](https://descomplica.com.br/blog/como-funciona-o-supletivo/)
- [Labra — EJA em 3 meses](https://labra.com.br/eja-em-3-meses/)
- [EAD.com.br — Supletivo a distância](https://www.ead.com.br/supletivo-a-distancia)
- [Folha PE — Sesi-PE com EJA gratuita (Caruaru)](https://www.folhape.com.br/noticia/amp/402849/sesi-pe-oferece-300-vagas-gratuitas-para-educacao-de-jovens-e-adultos/)
- [EAD.com.br — Cruzeiro do Sul Virtual em Caruaru](https://www.ead.com.br/faculdades/cruzeiro-do-sul-virtual/cursos/pernambuco--caruaru)
- [EAD.com.br — ETEP EAD em Caruaru](https://www.ead.com.br/faculdades/etep-ead/cursos/pernambuco--caruaru)
- [EAD.com.br — Uniandrade polo Caruaru](https://www.ead.com.br/faculdades/uniandrade/campus/polo-caruaru)
- [Educa Mais Brasil — Unicive: Gestão da Atividade Policial](https://www.educamaisbrasil.com.br/unicive/cursos/gestao-da-atividade-policial)
- [Gran Faculdade — Gestão de atividade policial ou criminologia](https://faculdade.grancursosonline.com.br/blog/gestao-de-atividade-policial-ou-criminologia/)
- [Melhor Escola — Ranking ENEM Caruaru](https://www.melhorescola.com.br/escola/ranking-enem/pernambuco/caruaru)
- [Melhor Escola — Colégio Diocesano de Caruaru](https://www.melhorescola.com.br/escola/colegio-diocesano-de-caruaru)
- [Diario de Pernambuco — Terreno para Colégio Militar da PM em Caruaru (2022)](https://www.diariodepernambuco.com.br/noticia/vidaurbana/2022/06/prefeitura-de-caruaru-doa-terreno-para-policia-militar-construir-coleg.html)
- [Folha Qconcursos — Cursos para concursos com desconto na Black Friday](https://folha.qconcursos.com/n/cursos-para-concursos-publicos-desconto-black-friday)
- [Estratégia — Black Friday Concursos](https://www.estrategiaconcursos.com.br/blog/black-friday-concursos-estrategia/amp/)
