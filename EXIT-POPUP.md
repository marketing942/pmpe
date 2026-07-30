# Exit Popup (Exit Intent) — PMPE / CPPEM

Registro completo do que foi construído, **por quê** cada decisão foi tomada, e o
que é preciso saber para replicar sem repetir os erros do caminho.

Este documento cobre a versão **integrada**, que roda neste site e compartilha o
modal, o CSS e o `script.js` da própria página.

> Para instalar em **outro site**, não copie daqui — use o kit portátil em
> [`exit-popup-kit/`](exit-popup-kit/LEIAME.md), que é independente e não depende
> de nada desta landing.

---

## Índice

1. [O que é e o que resolve](#1-o-que-é-e-o-que-resolve)
2. [Conteúdo do popup](#2-conteúdo-do-popup)
3. [Decisões, com o porquê](#3-decisões-com-o-porquê)
4. [Arquitetura](#4-arquitetura)
5. [Os gatilhos](#5-os-gatilhos)
6. [Travas de exibição e storage](#6-travas-de-exibição-e-storage)
7. [Tracking — e por que o popup NÃO emite Lead](#7-tracking--e-por-que-o-popup-não-emite-lead)
8. [Backend: Google Sheets](#8-backend-google-sheets)
9. [Design](#9-design)
10. [Configuração completa](#10-configuração-completa)
11. [Cobertura de testes](#11-cobertura-de-testes)
12. ["O popup parou de abrir"](#12-️-o-popup-parou-de-abrir--leia-antes-de-suspeitar-do-código)
13. [Checklist de QA](#13-checklist-de-qa)
14. [Limitações honestas](#14-limitações-honestas)

---

## 1. O que é e o que resolve

Recupera o visitante que está saindo da landing sem converter, oferecendo uma
**segunda porta, de menor atrito**: a comunidade gratuita no WhatsApp.

Não substitui e não compete com o formulário principal (`#lead-modal`), que
continua sendo a oferta de venda. O popup só entra em cena quando o visitante já
desistiu daquela.

**Arquivos envolvidos:**

| Arquivo | O que tem |
|---|---|
| [index.html](index.html) | `#exit-modal` — markup do popup, no fim do `<body>` |
| [styles.css](styles.css) | `.exit__benefits`, `.exit__decline` e ajustes do título |
| [script.js](script.js) | `ModalManager`, `ExitIntent`, `enviarComunidade()`, barreira de submit |
| [google-apps-script.js](google-apps-script.js) | roteamento por aba na planilha |
| [TRACKING.md](TRACKING.md) | contexto de GTM/PixelX que o popup precisa respeitar |

---

## 2. Conteúdo do popup

```text
[selo]      ESPERA UM POUCO
[título]    NÃO DESISTA DO SEU SONHO DE SER PMPE!
[sub]       Inscreva-se abaixo para receber:
[benefício] ✓ Comunidade com notícias diárias, materiais gratuitos,
              questões e descontos!
[form]      Nome completo · E-mail · Seu WhatsApp (com DDD)
[cta]       QUERO ENTRAR NA COMUNIDADE
[nota]      Cadastro gratuito • Seus dados estão seguros.
[recusa]    Não, quero continuar sem ajuda
```

O envio leva para o grupo da comunidade (`COMMUNITY_URL`).

---

## 3. Decisões, com o porquê

| # | Decisão | Escolha | Por quê |
|---|---|---|---|
| 1 | Campos | Nome + E-mail + WhatsApp | Começou com 2 campos por atrito. E-mail incluído a pedido, para habilitar nutrição por e-mail além do WhatsApp. |
| 2 | Back-button trap no mobile | **Desligado**, atrás de flag | É o gatilho mais eficaz e o mais invasivo — "prende" o usuário. Fica pronto para ligar e medir. |
| 3 | Aba da planilha | `PMPE_COMUNIDADE` | Separa o funil de comunidade do de venda no relatório. |
| 4 | Destino | `COMMUNITY_URL` | Grupo do WhatsApp. Se ficar vazia, cai no WhatsApp da equipe. |
| 5 | Visual | Reaproveitar `.modal`, `.cta`, `.field`, `.eyebrow` | Zero divergência com o site; nenhum token novo. |
| 6 | Emitir Lead? | **Não** | Cadastro em comunidade tem intenção muito menor que pedido de contato comercial. Contar os dois como `Lead` degrada a otimização das campanhas — ver [§7](#7-tracking--e-por-que-o-popup-não-emite-lead). |
| 7 | Bloqueio por conversão | Só quem **converteu** nunca mais vê | Quem abriu o form de venda e desistiu é justamente o melhor alvo de recuperação. |

---

## 4. Arquitetura

```text
                        ┌──────────────────────────┐
   eventos do usuário → │   ExitIntent (detector)  │
   (mouse/scroll/idle)  └───────────┬──────────────┘
                                    │ pode abrir?
                        ┌───────────▼──────────────┐
                        │   ModalManager (core)    │ ← único dono do estado
                        └───────┬──────────┬───────┘
                                │          │
                   #lead-modal ─┘          └─ #exit-modal
                                │          │
                    ┌───────────▼──────────▼───────────┐
                    │  Barreira de submit (captura)    │
                    └───────┬──────────────────┬───────┘
                            │                  │
                     enviarLead()      enviarComunidade()
                            │                  │
                  Sheets aba=PMPE      Sheets aba=PMPE_COMUNIDADE
                  + evento Lead        + exit_popup_submit (sem Lead)
                            │                  │
                  WhatsApp comercial    Grupo da comunidade
```

### `ModalManager` — dono único do estado

Antes existiam `openModal()`/`closeModal()` amarrados a um único modal. Viraram
um gerenciador genérico:

```js
ModalManager.open(id)   // fecha o atual, abre o novo, trava scroll, foca 1º input
ModalManager.close(m)   // destrava scroll, devolve foco, registra o motivo
ModalManager.isOpen()   // usado pelo ExitIntent como trava
```

Responsabilidades: **scroll lock**, **focus trap**, **ESC**, **clique no
overlay**, **devolução de foco**.

**Garantia:** nunca dois modais abertos ao mesmo tempo.

> Ganho colateral: o modal principal, que antes deixava o `Tab` escapar para a
> página atrás do overlay, passou a prender o foco.

### `ExitIntent` — o detector

```js
ExitIntent.init()        // avalia travas, arma após ARM_DELAY, liga os gatilhos
ExitIntent.canFire()     // todas as travas de uma vez
ExitIntent.fire(gatilho) // abre, marca a sessão, emite o evento, desliga os listeners
```

Depois de disparar, `teardown()` remove **todos** os listeners — o popup é
estritamente uma vez por sessão.

---

## 5. Os gatilhos

Plataforma detectada por `matchMedia('(pointer: fine)')` — **nunca** por
user-agent.

| Plataforma | Gatilho | Condição |
|---|---|---|
| Desktop | Cursor sai pelo topo | `mouseout` sem `relatedTarget` e `clientY <= 0` |
| Mobile | Inatividade | `IDLE_DELAY` sem scroll, toque ou clique |
| Mobile | *Push* bruto ao topo | regra completa abaixo |
| Mobile | Botão voltar | só com `ENABLE_BACK_TRAP = true` |

Todos exigem `ARM_DELAY` de permanência mínima na página.

### O *push* bruto ao topo

A primeira versão era ingênua — "subida > 380px em menos de 500ms" — e disparava
em rolagem normal. A regra atual exige o **gesto inteiro**: arremesso longo,
contínuo e terminando no início da página.

O detector acumula um *burst* de subida a cada evento de scroll e só dispara
quando **todas** as condições valem juntas:

| Condição | Valor | Por quê |
|---|---|---|
| Distância acumulada | ≥ `1200px` **ou** 2 telas cheias | Descarta subidas curtas |
| Velocidade média | ≥ `1.2 px/ms` (~1200 px/s) | Separa arremesso de rolagem deliberada |
| Posição final | ≤ `200px` do topo | "Foi até o início de uma vez" |
| Eventos no burst | ≥ 2 | Sem 2 eventos não há intervalo para medir velocidade |

O burst **zera** quando o usuário volta a descer mais de `60px` **ou** passa mais
de `400ms` sem evento.

### As três correções que os testes forçaram

Documentadas porque cada uma parecia certa e não era:

**1. Janela fixa de tempo descartava os arremessos mais longos.**
A regra original limitava o gesto a 1500ms. Um flick de 5000px leva mais que isso
para desacelerar, então a contagem zerava no meio — perdendo exatamente o gesto
mais bruto de todos. Trocado por **velocidade média**, que escala com a distância
em vez de puni-la.

**2. Um único evento espúrio matava o gesto inteiro.**
Zerar o burst a qualquer delta negativo significava que um *layout shift* de
imagem carregando (uns poucos px para baixo) anulava o arremesso. Daí o
`SCROLL_UP_JITTER` de 60px: oscilações pequenas são ignoradas, mudança de direção
de verdade não.

**3. Falso positivo com eventos coalescidos — o mais sutil.**
Quando o browser entrega o gesto inteiro em **um único** evento de scroll (main
thread ocupada, celular fraco), a duração medida é ~0 e a velocidade tende ao
infinito. Rolagem lenta passava por arremesso. Por isso `burstN >= 2`: sem dois
eventos não há intervalo real para medir, e **preferimos não abrir**.

> A regra erra deliberadamente para o lado de **não aparecer**. Perder uma
> exibição é melhor do que incomodar quem só estava rolando a página.

---

## 6. Travas de exibição e storage

Avaliadas nesta ordem. Falhou uma, não abre:

1. `EXIT_POPUP_ENABLED === true` — kill switch
2. Já passou o `ARM_DELAY`
3. Nenhum modal aberto (`ModalManager.isOpen() === false`)
4. Não apareceu ainda nesta sessão
5. O silêncio de `SNOOZE_DAYS` expirou
6. A pessoa nunca converteu — em **nenhum** dos dois formulários

| Chave | Onde | Para quê |
|---|---|---|
| `cppem_exit_seen` | sessionStorage | 1 exibição por sessão |
| `cppem_exit_snooze` | localStorage | silêncio de N dias após fechar ou enviar |
| `cppem_lead_converted` | localStorage | quem converteu nunca mais vê |

Todo acesso a storage é embrulhado em `try/catch` — Safari em navegação privada
lança exceção, e isso não pode derrubar a página.

---

## 7. Tracking — e por que o popup NÃO emite Lead

Esta seção é a mais importante para replicar. Leia o [TRACKING.md](TRACKING.md)
antes, especialmente §4 (inventário de emissores) e §7.8 (ordem dos listeners).

### A decisão

O popup capta para a **comunidade gratuita**. Quem entra num grupo de WhatsApp
tem intenção muito menor que quem pede contato comercial. Contar os dois como
`Lead` mistura os dois públicos e **degrada a otimização das campanhas** — o
algoritmo passa a buscar gente parecida com quem só queria material grátis.

Então: **o formulário principal emite `Lead`. O popup não.**

| Formulário | id | Emite Lead? | Evento próprio |
|---|---|---|---|
| Captação principal | `lead-form` | **Sim** | — |
| Popup de saída | `exit-form` | **Não** | `exit_popup_submit` |

### Como isso é garantido

Uma **barreira única de submit**, em fase de captura no `document`:

```js
document.addEventListener("submit", (e) => {
  if (e.target === exitForm) {
    e.preventDefault();
    if (!validateCommunity()) { e.stopImmediatePropagation(); return; }
    if (!EXIT_POPUP_ENVIA_LEAD || LEAD_MODE === "site") e.stopImmediatePropagation();
    enviarComunidade();
  }
}, true);   // <- captura
```

**A flag `true` é o ponto inteiro.** Um listener de captura no `document` roda
**sempre** antes de qualquer listener registrado no `<form>` — inclusive os que
PixelX, GTM ou Meta instalam sozinhos, e que a gente não controla. Com
`stopImmediatePropagation()`, nenhuma regra externa de "conversão ao enviar
formulário" alcança este form.

> Sem a fase de captura o listener roda **depois** dos listeners do `<form>`, e a
> proteção não existe. Esse erro foi cometido no kit portátil e só apareceu
> porque um teste registrou um espião no `<form>` para simular o painel.

### Eventos que o popup emite

| Evento `dataLayer` | Quando | Parâmetros |
|---|---|---|
| `exit_popup_view` | popup apareceu | `trigger` |
| `exit_popup_submit` | envio com sucesso | `trigger` |
| `exit_popup_close` | fechou sem enviar | `trigger`, `method` (`x`/`overlay`/`esc`/`recusa`) |

`trigger` diz qual gatilho abriu: `desktop`, `inatividade`, `scroll_up` ou `back`.

Se quiser criar uma tag de GTM para o cadastro na comunidade, use
`exit_popup_submit` — **nunca** aponte a tag de `Lead` para ele.

### Para mudar a decisão

Uma linha em [script.js](script.js):

```js
const EXIT_POPUP_ENVIA_LEAD = false;   // true → o popup também vira Lead
```

### A métrica que realmente importa

Não é quantos leads o popup trouxe. É se o **formulário principal caiu** no mesmo
período. Compare os dois antes de comemorar.

---

## 8. Backend: Google Sheets

O popup grava numa aba separada da mesma planilha:

```js
const COMMUNITY_SHEET_TAB = "PMPE_COMUNIDADE";
```

### O bug que existia aqui

O `doPost` original usava `SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()`
e **ignorava o parâmetro `?aba=`** da URL. Os dois funis cairiam na mesma aba,
apesar de a URL sugerir o contrário.

Corrigido em [google-apps-script.js](google-apps-script.js): a aba é escolhida
pelo parâmetro e **criada se não existir**.

> ⚠️ **Exige nova implantação** no Apps Script — "Implantar → Nova implantação",
> não "gerenciar existente". Sem isso a separação não passa a valer.

Payload enviado:

```json
{
  "nome": "...", "email": "...", "telefone": "...",
  "origem": "exit_popup_comunidade",
  "gatilho": "desktop | inatividade | scroll_up | back",
  "pagina": "https://...",
  "data_envio": "2026-07-27T13:00:00.000Z"
}
```

---

## 9. Design

Nenhum token novo, nenhuma fonte nova, nenhuma cor fora da paleta.

| Elemento | Reaproveitado de |
|---|---|
| Overlay + caixa | `.modal`, `.modal__overlay`, `.modal__box` |
| Selo superior | `.eyebrow` |
| Título | `.modal__title` + `.hl` em `--red-bright` no "PMPE" |
| Inputs | `.field input` |
| Botão | `.cta` — mesmo gradiente verde dos CTAs da página |
| Nota / sucesso | `.note`, `.success` |

Único bloco novo, no vocabulário do `.vagas__total`:

```css
.exit__benefits{
  background:linear-gradient(180deg,rgba(200,16,46,.18),rgba(10,16,32,.6));
  border:1px solid rgba(225,23,51,.35);
  border-radius:14px; padding:1rem 1.1rem; margin-bottom:1.3rem;
}
.exit__benefits li::before{content:"✓";color:var(--red-bright);font-weight:800}
```

Mais `.exit__decline`, o link discreto de recusa. Responsivo e
`prefers-reduced-motion` vêm de graça do CSS existente.

Validado visualmente em **1280px e 390px**. O título precisou de
`text-wrap:balance` e corpo menor, senão "PMPE!" ficava órfão numa linha.

---

## 10. Configuração completa

Tudo no topo de [script.js](script.js). Qualquer ajuste é uma linha.

```js
/* --- Popup --- */
const EXIT_POPUP_ENABLED  = true;    // kill switch — false desliga tudo
const ENABLE_BACK_TRAP    = false;   // back-button no mobile (invasivo)
const ARM_DELAY           = 8000;    // ms mínimos na página antes de armar
const IDLE_DELAY          = 25000;   // ms de inatividade (mobile)
const SNOOZE_DAYS         = 3;       // silêncio após fechar/enviar
const COMMUNITY_URL       = "...";   // grupo do WhatsApp
const COMMUNITY_SHEET_TAB = "PMPE_COMUNIDADE";

/* --- Gatilho do push bruto ao topo --- */
const SCROLL_UP_MIN_PX = 1200;  // subida mínima acumulada
const SCROLL_UP_MIN_VH = 2;     // ...ou 2 telas cheias, o que for maior
const SCROLL_UP_SPEED  = 1.2;   // px/ms médios
const SCROLL_UP_GAP    = 400;   // ms de pausa que quebram o gesto
const SCROLL_UP_JITTER = 60;    // px de descida tolerados
const SCROLL_UP_TOP    = 200;   // precisa terminar a até N px do topo

/* --- Tracking (ver TRACKING.md) --- */
const EXIT_POPUP_ENVIA_LEAD = false; // popup NÃO é lead de venda
const REDIRECT_DELAY_MS     = 1500;  // abaixo de ~1s perde evento
```

**Receitas rápidas:**

| Quero... | Faço |
|---|---|
| Desligar o popup | `EXIT_POPUP_ENABLED = false` |
| Deixar o gatilho de scroll mais difícil | aumentar `SCROLL_UP_MIN_PX` ou `SCROLL_UP_SPEED` |
| Desligar só o gatilho de scroll | `SCROLL_UP_MIN_PX = 999999` |
| Popup aparecer mais rápido no mobile | reduzir `IDLE_DELAY` |
| Testar sem esperar | console: `ExitIntent.armed = true; ExitIntent.fire('teste')` |
| Rearmar entre testes | console: `sessionStorage.clear(); localStorage.clear()` |

---

## 11. Cobertura de testes

Tudo rodado em Chrome real, sem mock de DOM.

| Suíte | Casos | O que cobre |
|---|---|---|
| Modais e popup | **27** | abertura/fechamento, ESC, overlay, focus trap, scroll lock, travas, snooze, storage, validação dos 3 campos, os 3 eventos, nunca dois modais abertos |
| Regra do gatilho de scroll | **13** | flick curto, flick que para no meio, rolagem lenta até o topo, rolagem média, evento coalescido, jitter de layout, mudança de direção, flick muito longo |
| Tracking / Lead | **25** | validação de telefone, E.164, submit inválido → zero Lead, submit válido → exatamente 1, envio repetido não duplica, regra de painel não dispara, **popup não gera Lead** |

Os testes de gatilho são **determinísticos**: alimentam sequências sintéticas de
eventos `(posição, tempo)` na regra de decisão, em vez de depender do pipeline de
scroll do browser — que sob tempo virtual entrega eventos de forma instável e
produzia falso negativo no harness.

O teste de tracking usa uma **PixelX falsa** que conta cada Lead recebido, mais um
**espião registrado no `<form>`** simulando a regra do painel. É esse espião que
prova que a barreira funciona — e foi ele que encontrou a flag de captura
faltando no kit portátil.

---

---

## 12. ⚠️ "O popup parou de abrir" — leia antes de suspeitar do código

**Este é o erro mais fácil de cometer, e já foi cometido.** Depois de testar o
site algumas vezes, o popup para de aparecer e parece quebrado. Na quase
totalidade dos casos ele está funcionando — o bloqueio está no **seu navegador**.

### Por que acontece

As travas de exibição gravam estado no navegador. Testar o site aciona essas
travas exatamente como um visitante real acionaria:

| Chave | Onde | Duração | Grava quando |
|---|---|---|---|
| `cppem_exit_seen` | sessionStorage | a sessão | o popup aparece |
| `cppem_exit_snooze` | localStorage | **3 dias** | você fecha OU envia o popup |
| `cppem_lead_converted` | localStorage | **para sempre** | o visitante converte em **qualquer um dos dois** formulários |

> **A pegadinha específica desta landing:** o formulário **principal** também
> grava `cppem_lead_converted` ([script.js:509](script.js#L509)). Ou seja,
> testar o formulário de venda — como nos testes de GTM — bloqueia o popup de
> saída **permanentemente** naquele navegador.

### Diagnóstico em 5 segundos

No console do site:

```js
ExitIntent.isBlocked()                        // true = travado, o código está OK
localStorage.getItem("cppem_lead_converted")  // "1" = é este o motivo
localStorage.getItem("cppem_exit_snooze")     // timestamp futuro = snooze ativo
```

### Como destravar para testar

```js
sessionStorage.clear(); localStorage.clear(); location.reload();
```

Depois **aguarde 8 segundos** na página antes de tentar sair — abaixo do
`ARM_DELAY` o gatilho nem está armado, e nada vai acontecer por mais correto que
o gesto esteja.

Para abrir na hora, ignorando todas as travas:

```js
ExitIntent.armed = true; ExitIntent.fire('teste');
```

### Antes de concluir que o deploy falhou

Verifique se o que está no ar realmente tem o código, em vez de supor:

```bash
curl -s https://SEU-DOMINIO/script.js | grep -c "EXIT_POPUP_ENABLED"   # > 0
curl -sL https://SEU-DOMINIO/ | grep -c 'id="exit-modal"'              # 1
```

### A ordem certa de investigação

1. `ExitIntent.isBlocked()` → `true`? É storage. Limpe e recarregue.
2. Esperou os 8 segundos do `ARM_DELAY`?
3. O `curl` acima confirma o código no ar?
4. Console com erro de JS antes do fim do `script.js`? Um erro no topo impede o
   `init()` de rodar.
5. Só depois disso suspeite da lógica do gatilho.

> **Trade-off consciente:** `cppem_lead_converted` não expira. Faz sentido para não
> importunar quem já virou lead, mas significa que quem preencheu o formulário
> uma vez nunca mais vê a oferta da comunidade — e torna qualquer teste inviável
> sem limpar o storage. Se preferir, dá para fazer esse bloqueio expirar (30/90
> dias) ou não aplicá-lo ao popup.

---

## 13. Checklist de QA

- [ ] Desktop: sair com o mouse pelo topo abre o popup **uma vez**
- [ ] Desktop: não abre nos primeiros 8s
- [ ] Mobile: 25s parado abre o popup
- [ ] Mobile: *push* bruto até o topo abre o popup
- [ ] Mobile: **rolagem normal para cima não abre**
- [ ] Não abre com o modal principal aberto
- [ ] Fechar e recarregar: não reabre (snooze de 3 dias)
- [ ] Após converter em qualquer form: nunca mais aparece
- [ ] `ESC`, X e overlay fecham
- [ ] `Tab` circula dentro do popup
- [ ] Scroll do body travado e destravado corretamente
- [ ] Envio grava na aba `PMPE_COMUNIDADE`
- [ ] Nova implantação do Apps Script feita
- [ ] Redireciona para o grupo da comunidade
- [ ] Validação de nome, e-mail e telefone mostra erro
- [ ] `exit_popup_view` / `submit` / `close` aparecem no preview do GTM
- [ ] **Cadastro no popup NÃO gera `Lead`** no painel
- [ ] iPhone / Android / 360px sem quebra

> A validação final do gesto por toque só existe em **celular real**. Headless
> não reproduz momentum de scroll com fidelidade.

---

## 14. Limitações honestas

- **Exit intent de verdade não existe no mobile.** Não há evento de "vou sair" em
  navegador de celular. Inatividade e *push* ao topo são aproximações de
  comportamento, não leitura de intenção. Parte do tráfego mobile sai sem ver o
  popup — é limite de plataforma, não de implementação.

- **O gatilho de scroll erra para o lado de não aparecer.** Com eventos
  coalescidos não há intervalo para medir velocidade, e preferimos perder a
  exibição a incomodar quem só rolava a página.

- **Canibalização é possível.** Alguém que preencheria o formulário de venda pode
  pegar a oferta mais fácil. As travas reduzem, o tracking mede. Se os números
  piorarem: `EXIT_POPUP_ENABLED = false`.

- **Lead de comunidade é mais frio** que lead de venda. Por isso a aba separada e
  a ausência de evento `Lead` — o time não deve tratar os dois do mesmo jeito.

- **A PixelX captura os campos no `blur`, independente de submit**
  ([TRACKING.md §13](TRACKING.md)). Os campos do popup usam
  `name="nome|email|telefone"`, que casam com as keywords dela, então dados
  parciais do popup chegam ao painel como captura de lead. Isso **não** é evento
  de `Lead` e não afeta as campanhas. Só daria para evitar dando nomes sem
  significado aos campos — não valeu a troca.

- **Uma regra de conversão por clique no painel duplicaria**, e o site não tem
  como impedir: o clique acontece antes do submit. Confira no painel.
