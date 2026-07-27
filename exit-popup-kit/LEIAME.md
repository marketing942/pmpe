# Exit Popup — Kit portátil

Popup de intenção de saída pronto para transplantar para qualquer site.
**Zero dependências.** Sem build, sem biblioteca, sem framework. ~10KB.

Para instalar em um site novo você mexe em **3 lugares**: o conteúdo (HTML),
o tema (6 variáveis de CSS) e o destino do lead (2 linhas de JS).

---

## Arquivos

```
exit-popup-kit/
├── exit-popup.css   ← visual (tema no topo do arquivo)
├── exit-popup.js    ← comportamento (CONFIG no topo do arquivo)
├── exemplo.html     ← página funcional de referência
└── LEIAME.md        ← este guia
```

> **Atenção:** este kit é a versão **portátil**, independente. O site da PMPE
> (`/index.html`) roda uma versão **integrada**, que compartilha o modal e os
> estilos da própria página. Alterar um não altera o outro.
> A arquitetura da versão integrada está em [`../EXIT-POPUP.md`](../EXIT-POPUP.md).

---

## Instalação em 4 passos

### 1. Copie os arquivos e referencie

```html
<link rel="stylesheet" href="exit-popup.css" />
...
<script src="exit-popup.js"></script>   <!-- antes de </body> -->
```

### 2. Cole o HTML antes de `</body>`

Este bloco é o conteúdo do popup. **É aqui que você muda os textos.**

```html
<div class="xp" id="xp-modal" hidden>
  <div class="xp__overlay" data-xp-close></div>
  <div class="xp__box" role="dialog" aria-modal="true" aria-labelledby="xp-title">
    <button type="button" class="xp__close" data-xp-close aria-label="Fechar">&times;</button>

    <span class="xp__eyebrow">Espera um pouco</span>
    <h2 class="xp__title" id="xp-title">Não desista do seu sonho de ser <span>PMPE</span>!</h2>
    <p class="xp__sub">Inscreva-se abaixo para receber:</p>

    <ul class="xp__benefits">
      <li>Comunidade com notícias diárias, materiais gratuitos, questões e descontos!</li>
    </ul>

    <form class="xp__form" novalidate>
      <div class="xp__field">
        <input type="text" name="nome" data-xp-rule="text" data-xp-msg="Informe seu nome completo."
               placeholder="Nome completo" autocomplete="name" required />
        <span class="xp__error"></span>
      </div>
      <div class="xp__field">
        <input type="email" name="email" data-xp-rule="email"
               placeholder="E-mail" autocomplete="email" required />
        <span class="xp__error"></span>
      </div>
      <div class="xp__field">
        <input type="text" name="telefone" data-xp-rule="phone" inputmode="tel"
               placeholder="Seu WhatsApp (com DDD)" autocomplete="tel" required />
        <span class="xp__error"></span>
      </div>

      <button type="submit" class="xp__cta">Quero entrar na comunidade</button>

      <p class="xp__note">Cadastro gratuito • Seus dados estão seguros.</p>
      <p class="xp__success" role="status" hidden>✅ Inscrição confirmada!</p>
    </form>

    <button type="button" class="xp__decline" data-xp-close data-xp-decline>
      Não, quero continuar sem ajuda
    </button>
  </div>
</div>
```

O texto dentro de `<span>` no título recebe a cor de destaque automaticamente.
Para mais de um benefício, basta adicionar `<li>` — o ✓ vem sozinho.

### 3. Ajuste o tema (topo do `exit-popup.css`)

Só o bloco de variáveis. **Nenhuma outra regra precisa ser tocada.**

```css
.xp{
  --xp-accent:#E11733;                     /* cor de destaque */
  --xp-accent-soft:rgba(225,23,51,.14);    /* fundo do selo e dos benefícios */
  --xp-accent-line:rgba(225,23,51,.38);    /* borda do selo e dos benefícios */
  --xp-bg:rgba(10,16,32,.92);              /* fundo da caixa */
  --xp-cta:linear-gradient(180deg,#16C34A,#0E9E39);   /* botão */
  --xp-cta-shadow:0 12px 34px rgba(14,158,57,.4);
  /* ...demais variáveis: texto, bordas, fontes, raio */
}
```

Exemplo real de outro site, trocando **6 linhas** (vermelho → azul):

```css
.xp{
  --xp-accent:#2E8BE1;
  --xp-accent-soft:rgba(46,139,225,.16);
  --xp-accent-line:rgba(46,139,225,.40);
  --xp-bg:rgba(8,20,40,.94);
  --xp-cta:linear-gradient(180deg,#2E8BE1,#1B63A8);
  --xp-cta-shadow:0 12px 34px rgba(46,139,225,.4);
}
```

Se o site não usa Bebas Neue/Montserrat, troque `--xp-font` e `--xp-font-title`.

### 4. Aponte o destino (topo do `exit-popup.js`)

```js
var CONFIG = {
  prefix:   "cppem",     // ← TROQUE por site. Evita colisão de storage entre domínios.
  endpoint: "",          // ← URL que recebe o POST do lead
  redirect: "",          // ← para onde o lead vai após enviar
  origem:   "exit_popup" // ← identifica a origem no seu banco/planilha
};
```

Exemplo com Google Apps Script (mesmo backend da PMPE):

```js
endpoint: "https://script.google.com/macros/s/SEU_ID/exec?aba=COMUNIDADE",
redirect: "https://chat.whatsapp.com/SEU_GRUPO",
```

`endpoint` vazio faz o popup pular o envio e ir direto para o `redirect` — útil
quando você só quer levar a pessoa para um grupo, sem capturar o lead.

Pronto. Não há passo 5.

---

## Configuração completa

| Chave | Padrão | O que faz |
|---|---|---|
| `enabled` | `true` | Kill switch. `false` desliga o popup inteiro. |
| `backTrap` | `false` | Intercepta o botão "voltar" no mobile. Muito eficaz e muito invasivo — ligue só como teste consciente. |
| `armDelay` | `8000` | ms mínimos na página antes de o popup poder aparecer. |
| `idleDelay` | `25000` | ms de inatividade que disparam o popup no mobile. |
| `snoozeDays` | `3` | Dias de silêncio depois que a pessoa fecha ou envia. |
| `redirectDelay` | `1500` | ms antes de sair da página. **Abaixo de ~1s você perde eventos de tracking.** |
| `stopSubmitPropagation` | `true` | Impede que regras externas contem este cadastro como Lead. Ver seção de tracking. |
| `scrollUpMinPx` | `1200` | Subida acumulada mínima para valer como arremesso. |
| `scrollUpMinVh` | `2` | ...ou N telas cheias, o que for maior. |
| `scrollUpSpeed` | `1.2` | Velocidade média mínima em px/ms (~1200 px/s). |
| `scrollUpGap` | `400` | ms de pausa que quebram o gesto. |
| `scrollUpJitter` | `60` | px de descida tolerados sem zerar o gesto. |
| `scrollUpTop` | `200` | O gesto precisa terminar a até N px do topo. |
| `prefix` | `"cppem"` | Prefixo das chaves de storage. **Troque por site.** |
| `endpoint` | `""` | URL que recebe o `POST` do lead. |
| `redirect` | `""` | Destino após o envio. |
| `origem` | `"exit_popup"` | Vai no payload, identifica a origem. |
| `eventName` | `"exit_popup"` | Prefixo dos eventos de `dataLayer`. |
| `blockWhen` | `() => false` | Trava extra sua. Retorne `true` para impedir o popup. |

### `blockWhen` — o encaixe com o site existente

Se o site já tem um modal próprio, impeça que os dois apareçam juntos:

```js
blockWhen: function () {
  return document.querySelector("#meu-modal:not([hidden])") !== null;
}
```

---

## Como o popup decide aparecer

**Gatilhos** — desktop e mobile são detectados por `matchMedia("(pointer: fine)")`,
nunca por user-agent:

| Plataforma | Gatilho | Condição |
|---|---|---|
| Desktop | Cursor sai pelo topo | `mouseout` sem `relatedTarget` e `clientY <= 0` |
| Mobile | Inatividade | `idleDelay` sem scroll, toque ou clique |
| Mobile | *Push* bruto ao topo | ver regra detalhada abaixo |
| Mobile | Botão voltar | só se `backTrap: true` |

**O *push* bruto ao topo.** Subir rápido não basta — isso dispara em rolagem
comum. O gatilho exige o gesto inteiro: arremesso longo, contínuo e terminando no
início da página. O detector acumula um "burst" de subida e só dispara quando
**todas** as condições valem juntas:

| Condição | Padrão | Por quê |
|---|---|---|
| Distância acumulada | ≥ `1200px` ou 2 telas | Descarta subidas curtas |
| Velocidade média | ≥ `1.2 px/ms` | Separa arremesso de rolagem deliberada |
| Posição final | ≤ `200px` do topo | "Foi até o início de uma vez" |
| Eventos no burst | ≥ 2 | Sem 2 eventos não há intervalo para medir velocidade |

O burst zera quando o usuário volta a descer mais de `scrollUpJitter` px ou passa
mais de `scrollUpGap` ms sem evento. Descidas menores são toleradas — um *layout
shift* de imagem carregando não pode matar o gesto.

Para endurecer ainda mais, aumente `scrollUpMinPx` ou `scrollUpSpeed`. Para
desligar só este gatilho, use um `scrollUpMinPx` absurdo (ex.: `999999`).

**Travas** — todas precisam passar, nesta ordem:

1. `enabled` é `true`
2. Já passou o `armDelay`
3. Ainda não disparou nesta sessão
4. O `snooze` de `snoozeDays` expirou
5. A pessoa nunca converteu (`<prefix>_lead_converted`)
6. `blockWhen()` retornou `false`

**Storage usado** (todos prefixados por `prefix`):

| Chave | Onde | Para quê |
|---|---|---|
| `<prefix>_exit_seen` | sessionStorage | 1 exibição por sessão |
| `<prefix>_exit_snooze` | localStorage | silêncio de N dias após fechar/enviar |
| `<prefix>_lead_converted` | localStorage | quem converteu nunca mais vê |

---

## Campos do formulário

Adicione ou remova `<div class="xp__field">` livremente — **o JS não precisa ser
alterado**. Ele lê todos os `input[name]` do formulário e monta o payload sozinho.

Regras de validação via `data-xp-rule`:

| Regra | Valida |
|---|---|
| `text` (padrão) | mínimo 2 caracteres |
| `email` | formato de e-mail |
| `phone` | mínimo 10 dígitos numéricos |

`data-xp-msg="..."` personaliza a mensagem de erro do campo.
Campos sem `required` são opcionais e não bloqueiam o envio.

Payload enviado ao `endpoint`:

```json
{
  "nome": "Maria Souza",
  "email": "maria@exemplo.com",
  "telefone": "(81) 99999-8888",
  "origem": "exit_popup",
  "gatilho": "desktop",
  "pagina": "https://...",
  "data_envio": "2026-07-27T13:00:00.000Z"
}
```

---

## Medição (GTM / dataLayer)

Três eventos, prefixados por `eventName`:

| Evento | Quando | Parâmetros |
|---|---|---|
| `exit_popup_view` | popup apareceu | `trigger` |
| `exit_popup_submit` | envio com sucesso | `trigger` |
| `exit_popup_close` | fechou sem enviar | `trigger`, `method` (`x`, `overlay`, `esc`, `recusa`) |

`trigger` diz qual gatilho disparou: `desktop`, `inatividade`, `scroll_up` ou `back`.

A métrica que importa não é só quantos leads o popup trouxe — é se o formulário
principal do site **caiu** no mesmo período. Compare os dois antes de comemorar.

---

## Tracking — leia antes de instalar

Esta é a parte que mais dá problema ao replicar, e o erro é silencioso.

### O popup não deve emitir Lead

Ele capta para uma **comunidade / material gratuito**. Quem entra num grupo tem
intenção muito menor que quem pede contato comercial. Se o cadastro do popup for
contado como `Lead`, os dois públicos se misturam e a **otimização das campanhas
piora** — o algoritmo passa a buscar gente parecida com quem só queria algo grátis.

Por isso o kit já vem com:

```js
stopSubmitPropagation: true
```

### Como funciona

O submit é interceptado no `document`, em **fase de captura**:

```js
document.addEventListener("submit", function (e) {
  if (e.target !== formEl) return;
  e.preventDefault();
  if (CONFIG.stopSubmitPropagation) e.stopImmediatePropagation();
  ...
}, true);   // <- a flag de captura é o ponto inteiro
```

Um listener de captura no `document` roda **sempre** antes de qualquer listener
registrado no `<form>` — inclusive os que PixelX, GTM, Meta ou o construtor de
página instalam sozinhos e que você não controla. Com `stopImmediatePropagation()`,
nenhuma regra de "conversão ao enviar formulário" alcança este formulário.

> ⚠️ **Sem o `true` final, a proteção não existe.** O listener passa a rodar
> depois dos listeners do `<form>`, e qualquer regra externa já disparou. Esse
> erro foi cometido neste kit e só apareceu porque um teste registrou um espião
> no `<form>` para simular a regra do painel.

### Se você QUISER que o popup gere Lead

```js
stopSubmitPropagation: false
```

E aí garanta que exista **exatamente um** emissor: ou a regra externa, ou uma
chamada sua no `then` do envio — nunca as duas.

### Eventos para o GTM

Use `<eventName>_submit` para criar a tag do cadastro na comunidade. **Nunca**
aponte a tag de `Lead` para ele.

---

## Testar

No console do navegador:

```js
ExitPopup.show()     // abre agora, ignorando todas as travas
ExitPopup.state()    // { armed, fired, open, blocked, trigger } — diz por que não abre
ExitPopup.reset()    // limpa o storage e rearma
ExitPopup.hide()     // fecha
```

`ExitPopup.state().blocked === true` é a resposta para 90% dos "não está aparecendo".

Para testar o gatilho real de desktop, mova o mouse para fora pelo topo da janela
depois de 8 segundos na página.

---

## Acessibilidade

Já vem resolvido, não mexa a menos que saiba o que está fazendo:

- `role="dialog"` + `aria-modal` + `aria-labelledby`
- Foco preso dentro do popup (Tab circula, não escapa para a página atrás)
- Foco devolvido ao elemento anterior ao fechar
- Fecha com `ESC`, no X e no overlay
- Scroll da página travado enquanto aberto
- Respeita `prefers-reduced-motion`
- A recusa é um botão real e visível — nunca esconda o "Não, quero continuar"

---

## Verificação

Este kit foi testado em Chrome com **28 testes funcionais automatizados**
(abertura, travas, storage, validação dos 3 tipos de campo, envio, os 3 eventos
de dataLayer, foco, scroll, e um espião no `<form>` provando que nenhuma regra
externa alcança o formulário) e validado visualmente em 1280px e 390px, incluindo
a troca de tema completa.

A regra do gatilho de scroll tem **13 testes determinísticos** próprios, com
sequências sintéticas de eventos: flick curto, flick que para no meio, rolagem
lenta até o topo, flick com jitter de layout, evento coalescido e mudança de
direção no meio do gesto.

Checklist ao instalar em um site novo:

- [ ] `prefix` trocado (senão dois sites no mesmo domínio brigam pelo storage)
- [ ] `endpoint` e `redirect` apontando para o lugar certo
- [ ] Um lead de teste chegou no destino
- [ ] Os 3 eventos aparecem no preview do GTM
- [ ] `blockWhen` configurado se o site já tem modal próprio
- [ ] `stopSubmitPropagation` coerente com a decisão de emitir ou não Lead
- [ ] Confirmado no preview do GTM que o cadastro **não** dispara a tag de Lead
- [ ] Testado em 360px de largura
- [ ] `ESC`, X e overlay fecham
- [ ] Textos e tema revisados

---

## Limitação honesta

**Exit intent de verdade não existe no mobile.** Não há evento de "vou sair" em
navegador de celular. Inatividade e *push* ao topo são aproximações de comportamento,
não leitura de intenção — parte do tráfego mobile sairá sem ver o popup. Isso é
limite da plataforma, não do código, e nenhuma solução de mercado resolve isso
sem o back-button trap, que prende o usuário.
