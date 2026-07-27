# Rastreamento de formulários — GTM server-side + PixelX

Guia de implantação e diagnóstico do evento **Lead**, escrito para ser
**reaproveitado em outros sites** com a mesma stack.

Todo o comportamento da PixelX descrito aqui foi verificado lendo o código-fonte
do `PixelXApp` e do `PxaMask` servidos pelo painel, ou recuperado do histórico
real deste repositório (os commits estão citados). O que é **hipótese a
confirmar** está marcado como tal — não misture os dois ao depurar.

---

## Índice

1. [Leia isto primeiro: os dois modos de falha](#1-leia-isto-primeiro-os-dois-modos-de-falha)
2. [O modelo mental: camada de container × camada de formulário](#2-o-modelo-mental-camada-de-container--camada-de-formulário)
3. [Arquitetura e loaders](#3-arquitetura-e-loaders)
4. [Inventário dos 5 emissores de Lead](#4-inventário-dos-5-emissores-de-lead)
5. [Escolha da arquitetura: Modelo A ou Modelo B](#5-escolha-da-arquitetura-modelo-a-ou-modelo-b)
6. [Como a PixelX identifica os campos](#6-como-a-pixelx-identifica-os-campos)
7. [Defeitos originais corrigidos no CPPEM](#7-defeitos-originais-corrigidos-no-cppem)
8. [Defeitos de replicação: o que quebra ao copiar](#8-defeitos-de-replicação-o-que-quebra-ao-copiar)
9. [Template portável](#9-template-portável)
10. [Protocolo de diagnóstico](#10-protocolo-de-diagnóstico)
11. [Checklist de replicação](#11-checklist-de-replicação)
12. [Tabela sintoma → causa](#12-tabela-sintoma--causa)
13. [O que não dá para controlar pelo site](#13-o-que-não-dá-para-controlar-pelo-site)
14. [Estado atual deste projeto](#14-estado-atual-deste-projeto)

---

## 1. Leia isto primeiro: os dois modos de falha

Os dois problemas relatados ao replicar em outros sites têm causas **opostas**, e
tratar um com a receita do outro piora a situação. Diagnostique antes de mexer.

### Falha A — "só chega pageview e general event, o Lead não valida"

**Causa raiz:** o loader foi trocado corretamente, mas o **vínculo com o
formulário** não. Pageview e general event são disparados no nível do
**container** — funcionam assim que o script carrega, sem saber que existe
formulário. O Lead é disparado no nível do **formulário**, e depende de um
casamento que não sobrevive ao copiar/colar.

O erro mais comum, de longe: **copiar o `id` do `<form>` junto com o HTML.**

```html
<!-- Copiado do CPPEM para outro site — o Lead NUNCA vai disparar -->
<form id="IPEyzyfmJhKQEYIXAlZH">
```

Esse id é o identificador do formulário **dentro da conta CPPEM no painel da
PixelX**. Em outra conta ele não existe, então a regra de Lead não encontra nada
para vincular. O container carrega, o pageview vai, o general event vai — e o
Lead simplesmente não tem gatilho. Ver [§8.1](#81-valores-que-são-específicos-de-cada-site).

Outras causas de Falha A, em ordem de frequência — ver [§8](#8-defeitos-de-replicação-o-que-quebra-ao-copiar):

| # | Causa | Seção |
|---|---|---|
| 1 | `id` do `<form>` copiado do site anterior | [§8.1](#81-valores-que-são-específicos-de-cada-site) |
| 2 | Formulário não emite evento `submit` nativo (Elementor, React, AJAX) | [§8.3](#83-formulários-que-não-emitem-submit-nativo) |
| 3 | `stopImmediatePropagation()` matando submits válidos | [§8.4](#84-a-barreira-de-validação-matando-o-lead) |
| 4 | `pixel_x_app` ainda não pronto quando o Lead é disparado | [§8.5](#85-corrida-com-o-start-assíncrono) |
| 5 | Campos sem `name`, PixelX sem dados do lead | [§6](#6-como-a-pixelx-identifica-os-campos) |

### Falha B — "o Lead duplica ou triplica"

**Causa raiz:** mais de um emissor de Lead ativo ao mesmo tempo, cada um
instalado em um momento diferente, por uma pessoa diferente, em uma camada
diferente — e nenhum deles sabe da existência dos outros.

Isto **não é hipótese**: este repositório já teve, em commits distintos, cinco
mecanismos capazes de disparar Lead. Em [§4](#4-inventário-dos-5-emissores-de-lead)
estão todos, com o commit onde cada um aparece. Duplicar exige dois ativos;
triplicar exige três — e é fácil chegar a três sem perceber, porque dois deles
são invisíveis no código do site (moram no painel).

> **A regra que resolve:** deve existir **exatamente um** emissor de Lead. Antes
> de adicionar qualquer coisa, faça o inventário de [§10.3](#103-auditoria-de-emissores-duplicados)
> e desligue todos menos um.

---

## 2. O modelo mental: camada de container × camada de formulário

Interiorizar esta separação resolve a maior parte dos diagnósticos.

```text
┌─ CAMADA DE CONTAINER ──────────────────────────────────────┐
│  Loader GTM/PixelX no <head>                               │
│  • pageview          ← dispara só de carregar a página     │
│  • general event     ← idem                                │
│  Depende de: domínio + path do loader corretos             │
└────────────────────────────────────────────────────────────┘
                          ↓  independentes
┌─ CAMADA DE FORMULÁRIO ─────────────────────────────────────┐
│  Regra de Lead vinculada a um formulário específico        │
│  • Lead                                                    │
│  Depende de: id do form ↔ painel, name dos campos,         │
│              evento submit nativo existir, pixel pronto    │
└────────────────────────────────────────────────────────────┘
```

**A consequência prática, que é o diagnóstico da Falha A:**

| O que chega no painel | O que isso prova |
|---|---|
| Nada, nem pageview | Loader errado, bloqueado ou não instalado — problema de container |
| Pageview e general event, sem Lead | **Container OK. O problema está 100% na camada de formulário** |
| Lead chegando N vezes | Container OK, formulário OK, **N emissores ativos** |

Se você vê pageview, pare de mexer no loader, no domínio e no GTM. O loader está
certo. O problema é o vínculo com o formulário — vá direto para [§8](#8-defeitos-de-replicação-o-que-quebra-ao-copiar).

---

## 3. Arquitetura e loaders

Três camadas independentes que se sobrepõem no mesmo formulário:

| Camada | Onde vive | O que faz |
|---|---|---|
| **GTM server-side** | `<head>`, loader first-party | Container sGTM próprio. No CPPEM: `https://sgtm.cppem.com.br/metrics/` |
| **PixelX** | `window.pixel_x_app`, carregada pelo GTM | Captura dados do lead, aplica máscara, dispara eventos de conversão |
| **`script.js` do site** | Bottom do `<body>` | Validação, mensagem de sucesso, redirecionamento |

O ponto central de todo o trabalho: **a PixelX se engancha no evento `submit`
nativo do formulário.** Qualquer coisa que impeça esse evento de existir, ou que
o deixe passar cedo demais, quebra o rastreamento — silenciosamente.

### 3.1 Loader do GTM server-side

```html
<script>(function(w,d,s,l){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'?l='+l:'';j.async=true;j.src=
'https://sgtm.cppem.com.br/metrics/'+dl;f.parentNode.insertBefore(j,f);})
(window,document,'script','dataLayer');</script>
```

Note que **não há parâmetro `id=GTM-XXXX`** — o ID do container está embutido no
path do loader server-side (`/metrics/`). Ao replicar em outro site, troque o
domínio e o path pelos do container daquele cliente.

### 3.2 Existem DOIS jeitos de a PixelX entrar na página

Esta é uma armadilha real deste repositório. Além de ser carregada por uma tag
dentro do GTM, a PixelX tem um **loader direto**, que já esteve no `<head>` do
`index.html` (commits `2c06396`, `033be5c`, removido em `2d3fe0f`):

```html
<!-- Loader DIRETO da PixelX — coexistiu com o carregamento via GTM -->
<script type='text/javascript'>
!function(){var e=window.location.href,t=document.title,n=Date.now(),
o=document.createElement('script');o.src='https://pxa.cppem.com.br/remote?url='
+encodeURIComponent(e)+'&title='+encodeURIComponent(t)+'&time='+n,
o.async=!0,document.head.appendChild(o)}()
</script>
```

**Se os dois estiverem presentes, a PixelX é instanciada duas vezes e cada evento
é contado em dobro — inclusive o Lead.** É a causa de duplicação mais difícil de
enxergar, porque um dos loaders está no HTML e o outro está escondido dentro de
uma tag do GTM, que ninguém abre.

Ver o teste de detecção em [§10.2](#102-detectar-pixelx-carregada-duas-vezes).

### 3.3 O `noscript` do GTM

```html
<noscript><iframe src="https://sgtm.cppem.com.br/ns.html?id= GTM-PJ379FLQ"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
```

Havia um **espaço espúrio** depois de `id=` neste projeto — **corrigido**. O
`noscript` só afeta visitantes sem JavaScript, então não era a causa de nenhuma
das falhas descritas aqui. Ao copiar para outro site, mantenha `?id=GTM-XXXXXXX`,
sem espaço.

---

## 4. Inventário dos 5 emissores de Lead

Todos os cinco já existiram neste projeto. Ao auditar um site novo, **procure
pelos cinco** — não presuma que o Lead só pode vir de onde você instalou.

### Emissor 1 — Regra de `submit` no painel

Configurada no painel da PixelX, vinculada ao `id` do formulário. Mecanismo do
`monitor_forms_dynamic`: listener de `submit` com debounce de 1500 ms, com guarda
de listener duplicado pela classe `pxa_tracked`.

- **Invisível no código do site.** Só se enxerga abrindo o painel.
- É o emissor que o CPPEM usa hoje.

### Emissor 2 — Regra de clique por classe no painel

Configurada no painel como "conversão ao clicar no elemento com a classe X". A
classe é um hash opaco. Este projeto usou (commit `906004f`):

```js
const PIXELX_CLASS = "xrmmmmzdllmckwinbxuh";

function syncPixelClass() {
  if (submitBtn) submitBtn.classList.toggle(PIXELX_CLASS, isFormValid());
}
```

A ideia era engenhosa — a classe só ficava no botão enquanto o formulário estava
válido, então clicar sem preencher não contava conversão. Mas ela cria um segundo
emissor permanente.

- **Semi-invisível:** no site aparece só como uma string sem significado. Se você
  vir uma classe que parece um hash aleatório em um botão, **é isto**.
- Se a regra de clique e a regra de submit estiverem ambas ativas no painel, um
  único envio dispara **dois** Leads.

### Emissor 3 — `send_event` manual no site

```js
await window.pixel_x_app.send_event({
  event_name: "Lead",
  lead_name:  nome,
  lead_email: email,
  lead_phone: telefone,
});
```

Assinatura verificada nos commits `2c06396`, `8227f51`, `290806f`, `033be5c`,
`a86c8bc`, `6e91e0d`. Removido do CPPEM em `aeb6ced`, justamente por duplicar.

- **Visível no código.** É o mais fácil de auditar: procure `send_event` no site.

### Emissor 4 — Meta Pixel disparando Lead por conta própria

```js
fbq("track", "Lead", { content_name: "captura_cppem", page_url: location.href });
```

Presente no commit `2c06396`, junto com o Emissor 3 **e** com a regra de painel.
Eram três Leads por conversão.

- Se o painel da PixelX também encaminha conversões para o Meta, o Lead chega
  **duplicado dentro do Events Manager** — mesmo que o painel da PixelX mostre um
  número correto. Confira os dois painéis, não só um.

### Emissor 5 — PixelX carregada duas vezes

Não é um emissor "novo", e sim todos os anteriores contados em dobro. Ver
[§3.2](#32-existem-dois-jeitos-de-a-pixelx-entrar-na-página).

### Como isso vira 2× ou 3×

| Combinação ativa | Leads por envio |
|---|---|
| Regra de submit (só ela) | 1 ✅ |
| Regra de submit + `send_event` manual | 2 |
| Regra de submit + regra de clique por classe | 2 |
| Regra de submit + `send_event` + `fbq` | 3 |
| Regra de submit + PixelX carregada 2× | 2 |
| Regra de submit + regra de clique + PixelX 2× | 4 |

---

## 5. Escolha da arquitetura: Modelo A ou Modelo B

Escolha **um** e desligue tudo do outro. A escolha errada é o que gera os dois
modos de falha ao mesmo tempo em sites diferentes da mesma leva.

### Modelo A — Lead disparado pelo painel

O painel tem a regra de `submit` vinculada ao `id` do form. O site **não** chama
`send_event`. É o modelo do CPPEM hoje.

- ✅ Zero código de tracking no site.
- ❌ Frágil na replicação: depende do `id` casar com o painel, e do formulário
  emitir `submit` nativo. **É o modelo que produz a Falha A.**
- ❌ Não dá para adicionar guarda de idempotência — você não controla o disparo.

### Modelo B — Lead disparado pelo site (recomendado para replicar)

A regra de Lead no painel é **desligada**, e o site chama `send_event`
explicitamente, uma única vez, com guarda.

- ✅ **Resolve a Falha A:** não depende do `id` casar com o painel, nem de existir
  `submit` nativo. Funciona em Elementor, React, formulário AJAX, qualquer coisa —
  basta chamar a função no ponto de sucesso.
- ✅ **Resolve a Falha B:** um emissor único, no código, auditável, com guarda de
  idempotência que impede duplo disparo mesmo com duplo clique.
- ✅ Você controla exatamente *quando* conta (só após validar / só após a API
  responder 200).
- ❌ Exige desligar a regra no painel. **Se esquecer disso, duplica.** Este é o
  único risco do Modelo B, e é um risco de checklist, não de arquitetura.

| Situação | Modelo |
|---|---|
| Site novo, formulário HTML próprio, você controla o painel | **B** |
| Formulário de terceiro (Elementor, RD, HubSpot) sem `submit` nativo | **B** (A não funciona) |
| Você não tem acesso ao painel para desligar a regra | **A** |
| Site legado já funcionando com o painel, sem queixa de duplicidade | **A**, não mexa |

> **Nunca os dois.** Se o painel dispara e o site também, são dois Leads. Não
> existe configuração em que ter os dois seja correto.

---

## 6. Como a PixelX identifica os campos

Isto define os atributos que o HTML **precisa** ter. De `input_has_type()`:

```js
const keywords = {
    phone: ['tel', 'phone', 'ph', 'cel', 'mobile', 'fone', 'whats'],
    mail:  ['mail', 'email', 'em'],
    name:  ['nome', 'nombre', 'name', 'nm'],
    doc:   ['document', 'doc', 'cpf', 'cnpj'],
};
```

Ela testa se o atributo **contém** (não "é igual a") alguma dessas palavras.

**Armadilha importante — a fonte do nome muda conforme a função:**

| Função | O que ela lê |
|---|---|
| `monitor_forms()` | `field.name \|\| field.id` — o `id` serve de reserva |
| `mask()` (máscara de telefone) | **apenas `el.name`** — sem reserva |

Ou seja: um campo só com `id="lead_phone"` e sem `name` é monitorado, mas **não
recebe a máscara**. Sempre defina os dois.

### HTML de referência

```html
<form name="lead_form" id="ID_DO_FORM_NO_PAINEL" novalidate>
  <input type="text"  id="lead_name"  name="name"                        required />
  <input type="email" id="lead_email" name="email"                       required />
  <input type="text"  id="lead_phone" name="phone" class="pxa_mask_phone" required />
  <button type="submit" id="lead_submit" class="cta">ENVIAR</button>
</form>
```

Regras que valem para qualquer site:

- O `id` do `<form>` é o identificador usado no painel da PixelX. **Ele tem que
  ser único na página** e **específico daquele site** — ver [§8.1](#81-valores-que-são-específicos-de-cada-site).
- O botão precisa de `id` próprio e `type="submit"`.
- A classe `pxa_mask_phone` (ou `pxa-mask-phone`, ou os mesmos como `id`) marca
  qual campo recebe a máscara. **O formato em si vem do painel**, não do HTML —
  `mask_load()` sai logo no início se `data.phone_mask` não estiver configurado.

---

## 7. Defeitos originais corrigidos no CPPEM

Os oito defeitos encontrados na primeira rodada. Continuam valendo como
referência: qualquer um deles reaparece ao copiar o código pela metade.

### 7.1 `id` duplicado entre o `<form>` e o `<button>`

```html
<!-- ERRADO -->
<form id="IPEyzyfmJhKQEYIXAlZH">
  <button type="submit" id="IPEyzyfmJhKQEYIXAlZH">Enviar</button>
</form>
```

`document.getElementById()` retorna o **primeiro** match, que é o `<form>`. Então
`submitBtn` apontava para o formulário, e esta linha apagava a página inteira do
formulário ao clicar:

```js
submitBtn.textContent = "ENVIANDO..."; // destruía todos os filhos do <form>
```

**Correção:** `id` único no form, `id` próprio no botão.

### 7.2 `name` do campo divergente do `data-error-for`

O e-mail tinha `name="mail"` e `data-error-for="mail"`, mas o JS chamava
`setError("email", ...)`. As mensagens de erro de e-mail simplesmente nunca
apareciam. **Correção:** padronizar tudo em `email`.

### 7.3 `name="submit"` no botão quebra `form.submit()`

`HTMLFormElement` é declarado com `[LegacyOverrideBuiltIns]` na spec: um controle
chamado `submit` **sobrescreve o método** `form.submit()`, que deixa de ser
função. Se a PixelX (ou qualquer script) chamar `form.submit()`, estoura.

**Correção:** nunca usar `name="submit"`, `name="reset"` ou `name="action"` em
controles de formulário.

### 7.4 `preventDefault()` no clique mata o evento `submit`

```js
// ERRADO — a PixelX nunca vê o submit
submitBtn.addEventListener("click", (e) => {
  e.preventDefault();
  enviar();
});
```

Cancelar a ação padrão do clique faz o navegador **não gerar** o evento `submit`.
A PixelX escuta exatamente esse evento, então o Lead nunca era registrado.

**Correção:** escutar o `submit` do formulário e dar `preventDefault()` **lá** — o
evento já foi disparado (a PixelX recebeu) e só a navegação é bloqueada. De
quebra, o Enter passa a funcionar de graça, via submissão implícita.

### 7.5 Evento `Lead` duplicado

Adicionamos manualmente `send_event({ event_name: 'Lead' })` enquanto o painel já
disparava o Lead no submit. Resultado: dois eventos por conversão.

**Fato que esclarece a confusão:** `monitor_forms()` **não dispara evento de
conversão nenhum.** Ela só percorre os inputs, identifica o tipo e chama
`input_monitor()`, que adiciona um listener de `blur` → `input_save()` →
`debounce_send_lead_data()`. Isso é **captura de dados do lead**, não Lead.

Quem dispara o Lead no submit é a regra de evento configurada no painel
(mecanismo do `monitor_forms_dynamic`, listener de `submit` com debounce de
1500 ms).

Ver o inventário completo de emissores em [§4](#4-inventário-dos-5-emissores-de-lead).

### 7.6 `form.reset()` e redirecionamento cedo demais

O handler da PixelX roda no submit, mas a requisição é assíncrona (e com debounce
de 1500 ms). Duas coisas atropelavam isso:

- `form.reset()` logo após o submit → risco de a PixelX ler campos já vazios.
  **Correção:** removido. O usuário sai da página em seguida mesmo.
- `setTimeout(redirect, 700)` → em conexão móvel lenta, a navegação cancelava a
  requisição do evento. **Correção:** 1500 ms, alinhado ao debounce da PixelX.

```js
const REDIRECT_DELAY_MS = 1500; // abaixo de ~1s começa a perder eventos
```

### 7.7 Validar o telefone pelo `length` da string — o erro mais traiçoeiro

Tentativas que **falharam**, e por quê:

| Regra | Por que quebra |
|---|---|
| `tel.length < 1` | aceita qualquer coisa |
| `tel.length < 13` | `(81) 97310-5354` mascarado tem 15 chars, mas `81973105354` cru tem 11 e seria **rejeitado**; e `(81) 97310-53`, incompleto, tem 13 e **passava** |
| `digitos.length === 11` | **o `+55` da máscara conta como 2 dígitos** |

O último merece atenção porque é o que enganou de verdade. O padrão da máscara é
`+{55} (00) [9]0000-0000`, onde `{55}` é **texto fixo**: aparece na tela desde o
primeiro caractere digitado, mas não é número que o visitante informou. Então:

```text
+55 (81) 9996-741  →  55 81 9996 741  →  11 dígitos  →  passava!
```

Um número completo tem 13 dígitos com o país. Exigir 11 estava, na prática,
pedindo apenas 7 dígitos do usuário.

**Correção:** remover o prefixo do país pelo `+` literal antes de contar. Tanto a
máscara quanto o `phone_valid()` da PixelX sempre escrevem esse `+`, o que faz
dele um marcador confiável — diferente de remover pelos dígitos, que seria
ambíguo, já que **o DDD 55 existe** (Santa Maria/RS).

```js
const isPhone = (v) => {
  const nacional = v.trim().replace(/^\+\s*55\s*/, "");
  const d = nacional.replace(/\D/g, "");

  return d.length === 11 && d[2] === "9";
};
```

| Entrada | Nacional | Dígitos | Resultado |
|---|---|---|---|
| `+55 (81) 9996-741` | `(81) 9996-741` | 9 | rejeita |
| `+55 (81) 99967-412` | `(81) 99967-412` | 10 | rejeita |
| `+55 (81) 99967-4123` | `(81) 99967-4123` | 11 | aceita |
| `81999674123` (sem máscara) | — | 11 | aceita |
| `+5581999674123` (`phone_valid`) | `81999674123` | 11 | aceita |
| `(55) 99999-9999` (DDD 55) | — | 11 | aceita |

> ⚠️ Esta regra é **específica do Brasil e de celular**. Ao replicar em site que
> aceita telefone fixo, ou de outro país, `d[2] === "9"` rejeita números válidos.
> Ver [§8.6](#86-a-validação-de-telefone-não-é-universal).

### 7.8 Ordem de registro dos listeners de `submit`

A PixelX registra o listener dela **de dentro do `start()`, que é `async`**. Um
listener registrado no próprio `<form>` dispara por ordem de registro, então não
havia garantia de que o nosso viesse antes do dela — se o dela rodasse primeiro,
gravava o Lead antes de descobrirmos que o formulário era inválido.

**Correção:** capturar o `submit` no `document`, em **fase de captura**. Um
listener de captura no `document` roda **sempre** antes de qualquer listener
registrado no elemento-alvo, independente de quem registrou primeiro.

```js
document.addEventListener("submit", (e) => {
  if (e.target !== form) return;

  e.preventDefault();               // nunca recarregar a página

  if (!validate()) {
    e.stopImmediatePropagation();   // o evento morre aqui; PixelX não vê
    return;
  }

  enviar();                         // válido → propaga → PixelX registra o Lead
}, true);
```

`stopImmediatePropagation()` (e não `stopPropagation()`) é o correto: precisamos
impedir também os listeners registrados no `<form>`, que é um nó adiante no
caminho de propagação.

---

## 8. Defeitos de replicação: o que quebra ao copiar

Esta seção é sobre o que quebra **especificamente ao levar o código para outro
site** — mesmo com o original funcionando perfeitamente.

### 8.1 Valores que são específicos de cada site

**Todo item desta tabela precisa ser trocado. Nenhum sobrevive ao copiar/colar.**
Esquecer o primeiro é a causa nº 1 da Falha A.

| Valor | Exemplo no CPPEM | Onde vive | O que acontece se não trocar |
|---|---|---|---|
| **`id` do `<form>`** | `IPEyzyfmJhKQEYIXAlZH` | [index.html](index.html) e `script.js` | **Lead nunca dispara** — id não existe no painel do novo site |
| Domínio + path do loader sGTM | `sgtm.cppem.com.br/metrics/` | `<head>` | Eventos vão para a conta do CPPEM |
| ID do container no `noscript` | `GTM-PJ379FLQ` | [index.html](index.html) | Só afeta visitantes sem JS |
| Domínio do loader direto PixelX | `pxa.cppem.com.br` | `<head>`, se presente | Idem — conta errada |
| Classe de conversão por clique | `xrmmmmzdllmckwinbxuh` | `script.js`, se presente | Classe morta, ou conversão em conta errada |
| URL de redirecionamento | `wa.me/5581973105354` | `script.js` | Leads do cliente novo caem no WhatsApp do CPPEM |
| Regra de Lead no painel | — | Painel PixelX | Precisa ser criada na conta nova |

> **Cuidado especial com o `id` do form:** ele aparece em **dois lugares** — no
> HTML e no `document.getElementById(...)` do `script.js`
> ([script.js:17](script.js#L17)). Trocar só um dos dois deixa `form === null`, e
> aí a barreira de submit nunca casa (`e.target !== form` sempre verdadeiro), o
> formulário submete nativamente e **a página recarrega com os dados na URL**.
> No [template portável](#9-template-portável) esse valor aparece uma vez só.

### 8.2 O `id` do form precisa existir no painel — e ser único

Duas condições, ambas obrigatórias:

1. O `id` do `<form>` no HTML é **exatamente** o mesmo cadastrado no painel da
   PixelX daquela conta.
2. Esse `id` aparece **uma única vez** na página.

A segunda falha silenciosamente em sites com formulário repetido — cabeçalho +
rodapé, ou um modal que duplica o form da página. Se o mesmo `id` aparece duas
vezes, `getElementById` pega o primeiro; se o visitante usar o segundo, nenhuma
barreira se aplica. Teste no console:

```js
document.querySelectorAll('[id="SEU_ID_AQUI"]').length   // tem que ser 1
```

### 8.3 Formulários que não emitem `submit` nativo

**Esta é a causa de Falha A que nenhum ajuste de `id` resolve.**

O Modelo A inteiro depende de o navegador disparar um evento `submit` nativo.
Vários construtores de página **não disparam**: interceptam o clique, montam a
requisição em JavaScript e enviam por `fetch`/XHR. Casos comuns: Elementor Forms,
formulários de React/Vue sem `<form>` real, RD Station, HubSpot, Typeform
embedado.

Nesses sites, o Lead **nunca** vai disparar pelo painel, por mais correto que
esteja o `id`. Não há evento para escutar.

**Detecção — cole no console e envie o formulário:**

```js
document.addEventListener('submit', e => console.log('SUBMIT NATIVO:', e.target), true);
```

Se nada aparecer no console ao enviar, o formulário não emite `submit`.

**Solução:** Modelo B. Chame `trackLead()` no callback de sucesso do próprio
construtor — ver [§9](#9-template-portável). Não tente forçar um `submit`
sintético: `form.dispatchEvent(new Event('submit'))` não aciona a validação nem a
submissão real, e cria um caminho paralelo fácil de duplicar depois.

### 8.4 A barreira de validação matando o Lead

A barreira de [§7.8](#78-ordem-de-registro-dos-listeners-de-submit) é uma faca de
dois gumes: ela existe para **impedir** que o Lead dispare com dados inválidos.
Se a validação do site novo for mais rígida que os dados reais dos visitantes, ela
bloqueia conversões legítimas — e o sintoma é idêntico ao de "Lead não dispara".

O caso concreto: a validação de telefone de [§7.7](#77-validar-o-telefone-pelo-length-da-string--o-erro-mais-traiçoeiro)
exige celular brasileiro com 9 na terceira posição. Em um site que aceita telefone
fixo, **todo** envio com fixo é bloqueado por `stopImmediatePropagation()`. O
visitante vê erro, o painel não vê nada.

**Como distinguir de um problema de `id`:** se o campo de erro aparece na tela
para o usuário, é a validação. Se o formulário parece enviar normalmente e mesmo
assim não chega Lead, é vínculo/`id`.

### 8.5 Corrida com o `start()` assíncrono

`window.pixel_x_app` é criado pelo GTM, e o `start()` dela é `async`. Num site
mais lento que o CPPEM — ou num visitante em 3G — o objeto pode **ainda não
existir** no momento em que o formulário é enviado. No Modelo B, `send_event`
simplesmente não é chamado, e o Lead se perde sem erro visível.

O `?.` mascara isso perfeitamente:

```js
await window.pixel_x_app?.send_event({ ... });  // pixel ausente → não faz nada, sem erro
```

**Solução:** esperar o pixel ficar pronto, com timeout. Implementado no
[template](#9-template-portável) como `waitForPixel()`.

### 8.6 A validação de telefone não é universal

A regra `d.length === 11 && d[2] === "9"` significa: **celular brasileiro, com
DDD, com o nono dígito**. Ao replicar, ajuste conforme o site:

| Site aceita | Regra |
|---|---|
| Só celular BR (padrão CPPEM) | `d.length === 11 && d[2] === "9"` |
| Celular **ou** fixo BR | `d.length === 10 \|\| d.length === 11` |
| Qualquer país | `d.length >= 8 && d.length <= 15` (faixa E.164) |

A remoção do prefixo `+55` antes de contar continua necessária em todos os casos
em que a máscara da PixelX estiver ativa.

---

## 9. Template portável

Script de referência para **Modelo B**, pensado para copiar e trocar apenas o
bloco `CONFIG`. Resolve, por construção, as Falhas A e B:

- Um único emissor de Lead, no código, auditável.
- Guarda de idempotência → duplo clique, duplo listener ou script incluído duas
  vezes não geram Lead duplicado.
- Espera o `pixel_x_app` ficar pronto antes de disparar.
- `trackLead()` exposto em `window` → funciona em formulário sem `submit` nativo.

```js
/* =========================================================
   Tracking de Lead — PixelX (Modelo B: o SITE dispara)
   Trocar SOMENTE o bloco CONFIG ao replicar.

   PRÉ-REQUISITO OBRIGATÓRIO:
   desligar a regra de Lead no painel da PixelX (submit E clique-por-classe).
   Se o painel também disparar, o Lead conta em dobro.
   ========================================================= */

const CONFIG = {
  formId:        "TROCAR_ID_DO_FORM",      // único na página; NÃO precisa casar com o painel no Modelo B
  submitBtnId:   "lead_submit",
  fields:        { name: "lead_name", email: "lead_email", phone: "lead_phone" },
  redirectUrl:   "https://wa.me/5599999999999?text=Ol%C3%A1",
  redirectDelay: 1500,                     // ≥ debounce da PixelX; abaixo de ~1s perde evento
  phoneMode:     "celular_br",             // "celular_br" | "celular_ou_fixo_br" | "internacional"
};

/* --- Elementos --- */
const form        = document.getElementById(CONFIG.formId);
const submitBtn   = document.getElementById(CONFIG.submitBtnId);
const nomeInput   = document.getElementById(CONFIG.fields.name);
const emailInput  = document.getElementById(CONFIG.fields.email);
const telefoneInput = document.getElementById(CONFIG.fields.phone);

/* Falha barulhenta em vez de silenciosa: o erro nº 1 da replicação é o id do
   form não bater. Sem isto, a página só "recarrega sozinha" e ninguém entende. */
if (!form) {
  console.error(`[tracking] Formulário "${CONFIG.formId}" não encontrado. ` +
                `Confira CONFIG.formId e o id no HTML.`);
}
if (document.querySelectorAll(`[id="${CONFIG.formId}"]`).length > 1) {
  console.error(`[tracking] id "${CONFIG.formId}" duplicado na página.`);
}

/* --- Validação --- */
function setError(key, input, msg) {
  const el = document.querySelector(`[data-error-for="${key}"]`);
  if (input) input.classList.add("is-invalid");
  if (el) el.textContent = msg;
}

function clearError(key, input) {
  const el = document.querySelector(`[data-error-for="${key}"]`);
  if (input) input.classList.remove("is-invalid");
  if (el) el.textContent = "";
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* Conta DÍGITOS, não caracteres — e remove o "+55" da máscara antes de contar,
   pelo "+" literal (remover pelos dígitos seria ambíguo: o DDD 55 existe). */
const isPhone = (v) => {
  const d = v.trim().replace(/^\+\s*55\s*/, "").replace(/\D/g, "");

  if (CONFIG.phoneMode === "celular_ou_fixo_br") return d.length === 10 || d.length === 11;
  if (CONFIG.phoneMode === "internacional")      return d.length >= 8 && d.length <= 15;

  return d.length === 11 && d[2] === "9";     // celular_br (padrão)
};

function validate() {
  let ok = true;

  const nome  = nomeInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";
  const tel   = telefoneInput?.value.trim() || "";

  clearError("name", nomeInput);
  clearError("email", emailInput);
  clearError("phone", telefoneInput);

  if (nome.length < 2)  { setError("name", nomeInput, "Informe seu nome completo."); ok = false; }
  if (!isEmail(email))  { setError("email", emailInput, "Informe um e-mail válido."); ok = false; }
  if (!isPhone(tel))    { setError("phone", telefoneInput, "Informe seu WhatsApp com DDD."); ok = false; }

  return ok;
}

/* --- Espera o pixel ficar pronto ---
   pixel_x_app é criado pelo GTM e o start() dela é async. Em conexão lenta o
   objeto pode não existir na hora do envio; sem esta espera o Lead some sem erro. */
function waitForPixel(timeoutMs = 3000) {
  return new Promise((resolve) => {
    const pronto = () => typeof window.pixel_x_app?.send_event === "function";

    if (pronto()) return resolve(true);

    const inicio = Date.now();
    const t = setInterval(() => {
      if (pronto())                      { clearInterval(t); resolve(true); }
      else if (Date.now() - inicio > timeoutMs) {
        clearInterval(t);
        console.warn("[tracking] pixel_x_app não ficou pronto a tempo; Lead não enviado.");
        resolve(false);
      }
    }, 100);
  });
}

/* --- Emissor ÚNICO de Lead ---
   A guarda cobre duplo clique, script incluído duas vezes e listener duplicado.
   Só o painel pode duplicar a partir daqui — por isso a regra de lá tem que
   estar desligada. */
let leadEnviado = false;

async function trackLead() {
  if (leadEnviado) {
    console.warn("[tracking] Lead já enviado nesta página; ignorando.");
    return false;
  }
  leadEnviado = true;

  if (!(await waitForPixel())) return false;

  try {
    await window.pixel_x_app.send_event({
      event_name: "Lead",
      lead_name:  nomeInput?.value.trim() || "",
      lead_email: emailInput?.value.trim() || "",
      lead_phone: telefoneInput?.value.trim() || "",
    });

    console.log("[tracking] Lead enviado.");
    return true;
  } catch (err) {
    console.error("[tracking] send_event falhou:", err);
    leadEnviado = false;              // libera para nova tentativa
    return false;
  }
}

/* Exposto para formulários SEM submit nativo (Elementor, React, AJAX):
   chame window.trackLead() no callback de sucesso do próprio construtor. */
window.trackLead = trackLead;

/* --- Fluxo de envio --- */
async function enviar() {
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "ENVIANDO...";
  }

  await trackLead();

  const successEl = document.getElementById("form-success");
  if (successEl) {
    successEl.hidden = false;
    successEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* NÃO chamar form.reset() antes daqui: a PixelX lê os campos no blur e o
     reset pode fazê-la gravar valores vazios. */
  if (CONFIG.redirectUrl) {
    setTimeout(() => { window.location.href = CONFIG.redirectUrl; }, CONFIG.redirectDelay);
  }
}

/* --- Barreira única: submit capturado no DOCUMENT, em fase de captura ---
   Roda SEMPRE antes de qualquer listener registrado no próprio <form>,
   independente de quem registrou primeiro (a PixelX registra o dela de dentro
   de um start() async, então a ordem não é garantida de outro jeito). */
document.addEventListener("submit", (e) => {
  if (!form || e.target !== form) return;

  e.preventDefault();                  // nunca recarregar a página

  if (!validate()) {
    e.stopImmediatePropagation();      // inválido → evento morre aqui
    return;
  }

  enviar();
}, true);
```

### Adaptação para Modelo A

Se você **precisa** manter o disparo pelo painel (sem acesso para desligar a
regra), use o mesmo template com duas mudanças:

1. Remova a função `trackLead()` e a chamada `await trackLead()` em `enviar()`.
2. `CONFIG.formId` passa a ser **obrigatoriamente** o id cadastrado no painel.

O resto — barreira de captura, validação, delay de redirecionamento — continua
igual e continua necessário.

---

## 10. Protocolo de diagnóstico

Execute na ordem. Cada passo elimina uma camada.

### 10.1 O container está carregando?

```js
typeof window.pixel_x_app                 // "object" = carregou
window.pixel_x_app?.data                  // config vinda do painel
window.pixel_x_app?.data?.phone_mask      // se undefined, a máscara nem carrega
window.dataLayer?.length                  // GTM presente?
```

- `undefined` → problema de **container**. Confira o loader, o domínio, bloqueio
  por adblock e a aba Network (o script do loader retornou 200?).
- `object` → container OK. **Pare de mexer no loader.** Vá ao 10.2.

### 10.2 Detectar PixelX carregada duas vezes

A causa de duplicação mais invisível ([§3.2](#32-existem-dois-jeitos-de-a-pixelx-entrar-na-página)):

```js
// 1. Quantos scripts da PixelX entraram na página?
performance.getEntriesByType("resource")
  .filter(r => /pxa|pixel/i.test(r.name))
  .map(r => r.name);
```

Se aparecer mais de um script de origem PixelX (por exemplo um `/remote?url=` do
HTML **e** outro carregado pela tag do GTM), está carregando em dobro. Remova o
loader direto do `<head>` e deixe só o do GTM — ou o contrário, mas **só um**.

```js
// 2. Loader direto sobrando no HTML?
document.documentElement.innerHTML.includes("/remote?url=");   // true = loader direto presente
```

### 10.3 Auditoria de emissores duplicados

Rode **todos** os testes. É o passo que resolve a Falha B.

```js
/* --- Emissor 3: send_event manual no código do site --- */
// Procure "send_event" no fonte do site (Ctrl+Shift+F no editor, ou Sources no DevTools).

/* --- Emissor 4: Meta Pixel disparando Lead por conta própria --- */
typeof fbq;                        // "function" = Meta Pixel presente
// Procure fbq('track', 'Lead') no fonte.

/* --- Emissor 2: conversão por classe (hash opaco no botão) --- */
document.getElementById("lead_submit")?.className;
// Uma classe que parece hash aleatório (ex: "xrmmmmzdllmckwinbxuh") É uma
// regra de clique configurada no painel. Some com as regras de submit.

/* --- Quantos listeners de submit existem de fato --- */
// DevTools → aba Elements → selecione o <form> → painel "Event Listeners"
// → marque "Ancestors". Mais de um listener de submit vindo da PixelX = duplicado.
```

E no **painel da PixelX**, confira se existe mais de uma regra de conversão ativa
para o mesmo formulário — uma de `submit` e uma de clique convivendo é o caso
clássico de duplicação sem nenhuma pista no código.

### 10.4 O formulário emite `submit` nativo?

```js
document.addEventListener('submit', e => console.log('SUBMIT NATIVO:', e.target), true);
```

Envie o formulário. Silêncio no console = [§8.3](#83-formulários-que-não-emitem-submit-nativo),
e o Modelo A é inviável nesse site.

### 10.5 O vínculo com o formulário está certo?

```js
const ID = "SEU_ID_DO_FORM";
document.querySelectorAll(`[id="${ID}"]`).length;    // tem que ser exatamente 1
document.getElementById(ID)?.tagName;                // tem que ser "FORM"

// Todo campo precisa de name E id:
[...document.getElementById(ID).elements]
  .map(el => ({ tag: el.tagName, id: el.id, name: el.name, classe: el.className }));
```

Confirme que o `id` é **o mesmo cadastrado no painel daquela conta** — no Modelo
A isso é obrigatório, e é a causa nº 1 da Falha A.

### 10.6 Contagem ponta a ponta

Em **aba anônima** (o `form_auto_fill` da PixelX preenche campos sozinho e
contamina o teste — ver [§13](#13-o-que-não-dá-para-controlar-pelo-site)):

1. Abra a página, aguarde ~10 s.
2. Preencha e envie **uma vez**.
3. Na aba Network, filtre pelo domínio do loader e conte as requisições de evento
   disparadas no envio.
4. Confira o painel: **1 envio deve virar exatamente 1 Lead.**

> Se o número no painel crescer conforme o tempo que a página ficou aberta antes
> do envio (1 Lead enviando rápido, 2–3 enviando depois de um minuto), suspeite de
> acumulação de listeners por `setInterval` — ver [§13](#13-o-que-não-dá-para-controlar-pelo-site).
> **Hipótese a confirmar caso a caso**, não é comportamento verificado no fonte
> para o listener de submit.

---

## 11. Checklist de replicação

### A. Trocar (nenhum destes sobrevive ao copiar/colar)

- [ ] `id` do `<form>` — **nos dois lugares**: HTML e `script.js`
- [ ] Domínio + path do loader sGTM
- [ ] ID do container no `noscript` (e sem espaço depois de `id=`)
- [ ] Domínio do loader direto da PixelX, **se** for usá-lo
- [ ] URL de redirecionamento (WhatsApp/obrigado)
- [ ] Classe de conversão por clique, se o site usar esse mecanismo
- [ ] `CONFIG.phoneMode` conforme o site aceite celular, fixo ou internacional

### B. HTML

- [ ] `id` do `<form>` único na página (`querySelectorAll('[id="..."]').length === 1`)
- [ ] Botão com `id` próprio, `type="submit"`, e **sem** `name="submit"`
- [ ] Todo campo com `id` **e** `name` (o `name` é obrigatório para a máscara)
- [ ] `name` casando com as keywords: `name`, `email`, `phone`
- [ ] Classe `pxa_mask_phone` no campo de telefone
- [ ] `novalidate` no form (a validação é nossa)
- [ ] Nenhum `id` repetido entre form e botão

### C. JavaScript

- [ ] Listener de `submit` no `document` em **fase de captura** — nunca `click`
      com `preventDefault`
- [ ] `stopImmediatePropagation()` quando inválido
- [ ] Validação de telefone por **dígitos**, removendo o `+55` antes de contar
- [ ] Sem `form.reset()` antes do redirecionamento
- [ ] Atraso de redirecionamento ≥ 1500 ms
- [ ] Guarda de idempotência no disparo do Lead
- [ ] `waitForPixel()` antes de `send_event` (Modelo B)
- [ ] Script incluído **uma única vez** na página

### D. Emissor único — o passo que impede a Falha B

- [ ] Modelo escolhido explicitamente: **A** (painel) **ou** **B** (site)
- [ ] Modelo B → regra de Lead no painel **desligada** (submit **e** clique)
- [ ] Modelo A → **nenhum** `send_event('Lead')` no código do site
- [ ] Nenhum `fbq('track', 'Lead')` concorrente (ou ciente de que é outra
      plataforma, e conferido nos dois painéis)
- [ ] Nenhuma classe-hash de conversão sobrando em botão
- [ ] PixelX carregada por **um** caminho só — GTM **ou** loader direto
- [ ] Teste de [§10.6](#106-contagem-ponta-a-ponta): 1 envio = 1 Lead

### E. Painel da PixelX

- [ ] Formulário cadastrado com o `id` correto **daquela conta** (Modelo A)
- [ ] `phone_mask` configurado (senão a máscara nem carrega)
- [ ] Uma única regra de conversão ativa por formulário
- [ ] Conferido se `power_ups.form_auto_fill` está ligado (afeta os testes)

---

## 12. Tabela sintoma → causa

| Sintoma | Causa provável | Onde ler |
|---|---|---|
| **Só pageview e general event; Lead nunca chega** | `id` do form copiado do site anterior — não existe no painel desta conta | [§8.1](#81-valores-que-são-específicos-de-cada-site) |
| Idem, e o `id` está correto | Formulário não emite `submit` nativo | [§8.3](#83-formulários-que-não-emitem-submit-nativo) |
| Idem, e usuário vê mensagem de erro no campo | Validação bloqueando envios legítimos | [§8.4](#84-a-barreira-de-validação-matando-o-lead) |
| Lead chega em desktop mas some em mobile/3G | Corrida com o `start()` async, ou redirect antes do envio | [§8.5](#85-corrida-com-o-start-assíncrono), [§7.6](#76-formreset-e-redirecionamento-cedo-demais) |
| **Lead duplicado (2×)** | Dois emissores ativos — quase sempre painel + `send_event` manual | [§4](#4-inventário-dos-5-emissores-de-lead) |
| **Lead triplicado (3×)** | Painel + `send_event` + `fbq`, ou painel + clique-por-classe + `send_event` | [§4](#4-inventário-dos-5-emissores-de-lead) |
| Tudo duplicado, inclusive pageview | PixelX carregada duas vezes | [§3.2](#32-existem-dois-jeitos-de-a-pixelx-entrar-na-página), [§10.2](#102-detectar-pixelx-carregada-duas-vezes) |
| Duplica só às vezes | Duplo clique sem guarda de idempotência | [§9](#9-template-portável) |
| Página recarrega / URL ganha `?name=...` | `form === null` (id trocado só no HTML), ou erro de JS antes do listener | [§8.1](#81-valores-que-são-específicos-de-cada-site) |
| Sucesso e redirect com campo inválido | `validate()` retornando `true` — quase sempre a contagem do `+55` | [§7.7](#77-validar-o-telefone-pelo-length-da-string--o-erro-mais-traiçoeiro) |
| Botão some / form fica em branco ao clicar | `id` duplicado entre `<form>` e `<button>` | [§7.1](#71-id-duplicado-entre-o-form-e-o-button) |
| Máscara não aplica | `name` ausente no input, ou `phone_mask` não configurado no painel | [§6](#6-como-a-pixelx-identifica-os-campos) |
| Campo se preenche sozinho | `power_ups.form_auto_fill` — teste em aba anônima | [§13](#13-o-que-não-dá-para-controlar-pelo-site) |
| Telefone válido é rejeitado | `phoneMode` errado — site aceita fixo ou outro país | [§8.6](#86-a-validação-de-telefone-não-é-universal) |
| Chegam leads sem envio nenhum | Captura no `blur` — comportamento normal da PixelX, não é Lead | [§13](#13-o-que-não-dá-para-controlar-pelo-site) |

---

## 13. O que não dá para controlar pelo site

A PixelX grava dados do lead no **`blur` de cada campo**, sem nenhuma relação com
submit:

```js
async input_monitor(field) {
    field.addEventListener('blur', async event => {
        await this.input_save(event.target.name, event.target.value, field);
        this.debounce_send_lead_data()
    })
}
```

Consequência: **dados parciais chegam ao painel mesmo sem envio nenhum.** Nenhuma
validação no site impede isso. O que as correções garantem é que o **evento de
conversão** só dispare com os dados completos.

Não confunda os dois ao auditar: "apareceu um lead pela metade no painel" é este
mecanismo, e é esperado. Só conte **eventos de Lead**.

Dois comportamentos do vendor que vale conhecer ao depurar:

- `monitor_forms()` roda em `setInterval(..., 5000)` e chama `input_monitor()` de
  novo a cada volta, **sem guarda contra listener duplicado** (diferente do
  `monitor_forms_dynamic`, que usa a classe `pxa_tracked`). Os listeners de
  `blur` se acumulam enquanto a página estiver aberta. Isso multiplica requisições
  de **captura de dados**; se você observar o **Lead** também escalando com o
  tempo de página aberta, investigue por qual das duas funções a regra daquele
  painel está vinculada.
- `power_ups.form_auto_fill` preenche campos **vazios** a cada 5 s com dados de
  leads anteriores guardados em cookie/localStorage. Ao testar, isso pode fazer
  um campo "se preencher sozinho". Use uma aba anônima.

E o `phone_valid()` reescreve o campo no blur quando `power_ups.phone_update`
está ligado, **promovendo 10 dígitos para 11** ao inserir o nono dígito:

```js
if (phone.length === 10) { phone = `55${phone.substring(0,2)}9${phone.substring(2)}` }
```

Por isso a validação do site precisa aguentar receber o campo em qualquer um dos
três formatos: mascarado, cru ou já normalizado com `+55`.

---

## 14. Estado atual deste projeto

**Modelo em uso: B** (o site dispara o Lead). Configurado no topo do
[script.js](script.js):

```js
const LEAD_MODE = "site";   // "site" (Modelo B) | "painel" (Modelo A)
```

### Por que Modelo B aqui

Auditoria feita no código: **nenhum** `send_event`, **nenhum** `fbq`, **nenhum**
loader direto da PixelX. Ou seja, o site não tinha emissor de Lead algum — o
único possível era o painel.

E o id opaco `IPEyzyfmJhKQEYIXAlZH` está no **`<button>`**, não no `<form>`
(o form é `id="lead-form"`). Pelo [§6](#6-como-a-pixelx-identifica-os-campos),
esse id é o identificador do **formulário** no painel. No botão, uma regra de
submit não encontra formulário nenhum para vincular — **é a Falha A**, e explica
o Lead não estar sendo captado.

O Modelo B não depende desse casamento, então resolve sem tocar no painel.

### Como a duplicação fica impedida

A barreira de submit ([§7.8](#78-ordem-de-registro-dos-listeners-de-submit)) corta
a propagação em fase de captura no `document`. Consequência prática:

| Emissor | Situação |
|---|---|
| Regra de **submit** no painel | **Inerte** — o evento nunca chega ao `<form>` |
| `send_event` do site | Único ativo, com guarda de idempotência |
| `fbq('track','Lead')` | Não existe no projeto |
| Loader direto da PixelX | Não existe no projeto |
| Regra de **clique** no painel | ⚠️ **Não dá para neutralizar pelo site** — ver abaixo |

> ⚠️ **O único risco remanescente.** Uma regra de conversão **por clique** no
> painel dispararia junto com a nossa e duplicaria. O site não tem como impedir,
> porque o clique acontece antes do submit. Confira no painel se existe regra de
> clique ativa para este formulário e desligue — teste de
> [§10.3](#103-auditoria-de-emissores-duplicados).

### Sobre o id no botão

Ele foi **deixado onde está** de propósito: no Modelo B é inerte, e movê-lo
poderia mexer numa regra de painel que não temos como inspecionar.

> Se algum dia trocar para `LEAD_MODE = "painel"`, o id `IPEyzyfmJhKQEYIXAlZH`
> **precisa** ser movido do `<button>` para o `<form>`, senão a Falha A volta.

### Os dois formulários

Esta página tem **dois** formulários. Só um é Lead:

| Formulário | id | Dispara Lead? | Evento próprio |
|---|---|---|---|
| Captação principal | `lead-form` | **Sim** — é a conversão de venda | — |
| Popup de saída (comunidade) | `exit-form` | **Não** | `exit_popup_submit` no dataLayer |

O popup capta para a comunidade gratuita — intenção muito menor que a do
formulário de venda. Contar os dois como `Lead` degradaria a otimização das
campanhas. O submit dele também é cortado na barreira, então nenhuma regra de
painel o alcança.

Para mudar essa decisão, uma linha:

```js
const EXIT_POPUP_ENVIA_LEAD = false;   // true → o popup também vira Lead
```

> **Limitação conhecida ([§13](#13-o-que-não-dá-para-controlar-pelo-site)):** os
> campos do popup usam `name="nome|email|telefone"`, que casam com as keywords da
> PixelX. Ela captura esses valores no `blur`, como faz com qualquer formulário.
> Isso é **captura de dados**, não evento de Lead — e não há como impedir pelo
> site sem dar nomes sem significado aos campos.

### Normalização do telefone (E.164)

Verificado no GTM Preview: a PixelX só prefixava `+` ao valor do campo, então
`81999967415` virava **`+81999967415`** — código do **Japão**. Match avançado do
Meta e Enhanced Conversions do Google falham calados com isso.

Correção: o site normaliza antes de enviar, e o campo recebeu a classe
`pxa_mask_phone` do [§6](#6-como-a-pixelx-identifica-os-campos) para que a
captura por `blur` também pegue o valor já com país.

```js
lead_phone: toE164(telefone)   // 81999967415 → +5581999967415
lead_email: email.trim().toLowerCase()
```

> A máscara só aparece de fato se `phone_mask` estiver configurado no painel
> ([§6](#6-como-a-pixelx-identifica-os-campos)). Sem isso a classe é inofensiva,
> e a normalização no `send_event` continua valendo.

### Verificação automatizada

O comportamento acima é coberto por **25 testes** rodando em Chrome real, com uma
PixelX falsa que conta cada Lead recebido e um espião no listener do `<form>`
simulando a regra do painel:

- telefone: rejeita incompleto, rejeita a contagem enganosa do `+55`, aceita
  mascarado / cru / DDD 55, rejeita fixo em modo `celular_br`
- E.164: adiciona `+55`, não duplica país, preserva DDD 55, vazio segue vazio
- submit inválido → **zero** Lead, e o evento não chega ao `<form>`
- submit válido → **exatamente 1** Lead, com nome, e-mail e telefone
- envio repetido → continua **1** Lead (guarda de idempotência)
- regra de submit do painel → **não dispara** (barreira funcionando)
- campos **não** são limpos antes do redirecionamento
- popup de saída → **zero** Lead, e emite seu próprio evento

### Arquivos

- [index.html](index.html) — loader do GTM no `<head>`, `#lead-form` e
  `#exit-form` no fim do `<body>`
- [script.js](script.js) — `CONFIG` de tracking no topo, `trackLead()`,
  `waitForPixel()` e a barreira única de submit no fim
- [EXIT-POPUP.md](EXIT-POPUP.md) — arquitetura do popup de saída
- [README.md](README.md) — visão geral da landing page

Para replicar em outro site, **não copie o `script.js` deste projeto** — ele tem
o `id` do form e a URL de redirecionamento do CPPEM embutidos. Use o
[template portável de §9](#9-template-portável).
