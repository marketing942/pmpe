# Exit Popup (Exit Intent) — PMPE / CPPEM

Documento de arquitetura. Escrito **antes** da implementação, para validação.

---

## 1. Objetivo

Recuperar o visitante que está saindo da landing sem converter, oferecendo uma
**segunda porta de menor atrito**: a comunidade gratuita no WhatsApp.

Não substitui e não compete com o formulário principal (`#lead-modal`), que continua
sendo a oferta de vendas. O exit popup só entra em cena quando o visitante já desistiu.

### Conteúdo (copy definitiva)

```
[eyebrow]  ESPERA UM POUCO
[título]   NÃO DESISTA DO SEU SONHO DE SER PMPE!
[sub]      Inscreva-se abaixo para receber:
[benefício] ✓ Comunidade com notícias diárias, materiais gratuitos,
             questões e descontos!
[form]     Nome completo  ·  Seu WhatsApp (com DDD)
[cta]      QUERO ENTRAR NA COMUNIDADE
[nota]     Cadastro gratuito • Seus dados estão seguros.
[recusa]   Não, quero continuar sem ajuda
```

---

## 2. Decisões tomadas

| # | Decisão | Escolha | Motivo |
|---|---------|---------|--------|
| 1 | Campos do formulário | **Nome + WhatsApp** (sem e-mail) | Quem está saindo não tolera 3 campos. 2 campos já sustentam CRM e remarketing. |
| 2 | Back-button trap (mobile) | **Desligado** por padrão, atrás de flag | Gatilho mais eficaz e mais invasivo. Fica pronto para ligar e medir depois. |
| 3 | Destino da planilha | Aba **`PMPE_COMUNIDADE`** | Separa o funil de comunidade do funil de vendas no relatório. |
| 4 | Destino do lead | Constante `COMMUNITY_URL` | Link do grupo/canal ainda não existe no projeto. Placeholder com fallback para o WhatsApp atual; troca de 1 linha. |
| 5 | Botão / cores / cards | Reaproveitar `.cta`, `.modal`, `.field`, `.eyebrow` | Zero divergência visual com o site. |

---

## 3. Arquitetura

### 3.1 Visão geral

```
                        ┌──────────────────────────┐
   eventos do usuário → │   ExitIntent (detector)  │
   (mouse/scroll/idle)  └───────────┬──────────────┘
                                    │ pode abrir?
                        ┌───────────▼──────────────┐
                        │   ModalManager (core)    │ ← único dono do estado
                        └───────┬──────────┬───────┘
                                │          │
                   #lead-modal ─┘          └─ #exit-modal
                        │                        │
                  submitLead()            submitCommunity()
                        │                        │
             Sheets aba=PMPE           Sheets aba=PMPE_COMUNIDADE
                        │                        │
              WhatsApp comercial        Grupo da comunidade
```

### 3.2 `ModalManager` — o núcleo compartilhado

Hoje `script.js` tem `openModal()` / `closeModal()` amarrados a um único modal.
Vira um gerenciador genérico, dono do estado:

```js
const ModalManager = {
  current: null,              // id do modal aberto ou null
  open(id),                   // fecha o atual, abre o novo, trava scroll, foca 1º input
  close(),                    // destrava scroll, devolve foco ao gatilho
  isOpen()                    // usado pelo ExitIntent como trava
}
```

Responsabilidades: **scroll lock**, **focus trap** (Tab circula dentro do box),
**ESC**, **clique no overlay**, **devolução de foco**. Ganho colateral: o modal
principal, que hoje não prende foco, passa a prender.

**Garantia:** nunca dois modais abertos ao mesmo tempo.

### 3.3 `ExitIntent` — o detector

```js
const ExitIntent = {
  armed: false,               // só arma após ARM_DELAY
  fire(trigger),              // consulta as travas e chama ModalManager.open()
  disarm()                    // desliga tudo permanentemente na sessão
}
```

**Gatilhos:**

| Plataforma | Gatilho | Condição |
|---|---|---|
| Desktop | `mouseleave` no `document` | `clientY <= 0` e `!e.relatedTarget` |
| Mobile | Inatividade | 25s sem `scroll`/`touchstart`/`click`, após 20s na página |
| Mobile | Scroll-up rápido | subida > 380px em < 500ms, tendo passado de 40% da página |
| Mobile | Back-button (`pushState`) | **flag OFF** — `ENABLE_BACK_TRAP = false` |

Todos exigem `ARM_DELAY = 8000ms` de permanência mínima na página.

Detecção de plataforma por `matchMedia('(pointer: fine)')`, não por user-agent.

### 3.4 Travas de exibição (ordem de avaliação em `fire()`)

1. `EXIT_POPUP_ENABLED === true` — kill switch global
2. `ExitIntent.armed === true` — passou dos 8s
3. `ModalManager.isOpen() === false` — nenhum modal no ar
4. `sessionStorage['cppem_exit_seen']` ausente — 1x por sessão
5. `localStorage['cppem_exit_snooze']` expirado — silêncio de **3 dias** após fechar/enviar
6. `localStorage['cppem_lead_converted']` ausente — quem já converteu (em qualquer um dos 2 forms) nunca vê

Falhou qualquer uma → não abre. Passou todas → abre, marca `cppem_exit_seen` e
chama `disarm()`.

### 3.5 Envio

`submitCommunity()` reaproveita a validação existente (`setError` / `clearError`),
com regra própria: nome ≥ 2 caracteres, telefone ≥ 10 dígitos.

```js
payload = {
  nome, telefone,
  origem: "exit_popup_comunidade",
  gatilho: <desktop|inatividade|scroll_up|back>,
  pagina: location.href,
  data_envio: ISO
}
```

`POST no-cors` → `SHEET_URL` com `?aba=PMPE_COMUNIDADE` → sucesso → grava
`cppem_lead_converted` → redireciona para `COMMUNITY_URL` em 700ms.

Mesmo contrato do form atual. **O Apps Script não muda** — ele já lê o parâmetro
`aba`; basta a aba existir na planilha.

### 3.6 Tracking (GTM server-side já instalado)

| Evento `dataLayer` | Quando | Parâmetro |
|---|---|---|
| `exit_popup_view` | popup aparece | `trigger` |
| `exit_popup_submit` | envio com sucesso | `trigger` |
| `exit_popup_close` | fechou sem enviar | `trigger`, `method` (x / overlay / esc / recusa) |

Permite responder em uma semana: quanto recuperou **e** se canibalizou o form principal.

---

## 4. Design — 100% dentro do padrão do site

Nenhum token novo. Nenhuma fonte nova. Nenhuma cor fora da paleta.

| Elemento | Reaproveitado de |
|---|---|
| Overlay + caixa | `.modal`, `.modal__overlay`, `.modal__box` (borda superior `4px solid var(--red)`, blur, `modal-in`) |
| Selo superior | `.eyebrow` — pílula vermelha `--red-soft` + borda `rgba(225,23,51,.4)` |
| Título | `.modal__title` — Bebas Neue, uppercase, com `.hl` em `--red-bright` em "PMPE" |
| Subtítulo | `.modal__sub` — Montserrat, `--muted` |
| Inputs | `.field input` — foco vermelho `--red-bright`, estado `.is-invalid` |
| Botão | `.cta` — **mesmo gradiente verde** `#16C34A → #0E9E39` dos CTAs da página |
| Nota / sucesso | `.note`, `.success` |
| Fechar | `.modal__close` |

**Único bloco novo** — o card de benefício, construído com o mesmo vocabulário do
`.vagas__total` e do `.feat`:

```css
.exit__benefits{
  background:linear-gradient(180deg,rgba(200,16,46,.18),rgba(10,16,32,.6));
  border:1px solid rgba(225,23,51,.35);
  border-radius:14px; padding:1rem 1.1rem; margin-bottom:1.3rem;
}
.exit__benefits li{display:flex;gap:.6rem;color:var(--white);font-size:.92rem}
.exit__benefits li::before{content:"✓";color:var(--red-bright);font-weight:800}
```

Mais `.exit__decline` — link discreto de recusa, no estilo do `.footer__support`
porém em `--muted`, para dar saída digna a quem não quer.

Responsivo e acessível já vêm de graça: `.modal` é fluido, e o
`@media (prefers-reduced-motion:reduce)` existente já desliga a animação da caixa.

---

## 5. Passos de produção — **7 passos**

| # | Passo | Arquivo | Entrega |
|---|-------|---------|---------|
| **1** | Markup do `#exit-modal` | `index.html` | Modal com eyebrow, título, card de benefícios, form de 2 campos, CTA, nota, recusa. ~30 linhas. |
| **2** | Estilos | `styles.css` | `.exit__benefits`, `.exit__decline` e ajustes finos. ~35 linhas, zero token novo. |
| **3** | Refatorar núcleo de modais | `script.js` | `ModalManager` com scroll lock, focus trap, ESC, overlay, devolução de foco. Modal atual migrado sem mudar comportamento. |
| **4** | Motor de exit intent | `script.js` | `ExitIntent` com os 3 gatilhos ativos + back-trap atrás de flag. |
| **5** | Travas e persistência | `script.js` | `cppem_exit_seen`, `cppem_exit_snooze` (3 dias), `cppem_lead_converted` gravado pelos **dois** formulários. |
| **6** | Envio da comunidade | `script.js` | `submitCommunity()` → aba `PMPE_COMUNIDADE` → `COMMUNITY_URL`. |
| **7** | Tracking + QA | `script.js` | 3 eventos `dataLayer` + checklist da seção 7 executado. |

Sem dependências externas, sem build, sem requisição extra. Peso adicionado: **~4KB**.

---

## 6. Configuração (topo do `script.js`)

```js
const EXIT_POPUP_ENABLED = true;    // kill switch — false desliga tudo
const ENABLE_BACK_TRAP   = false;   // back-button no mobile
const ARM_DELAY          = 8000;    // ms mínimos na página
const IDLE_DELAY         = 25000;   // ms de inatividade (mobile)
const SNOOZE_DAYS        = 3;       // silêncio após fechar/enviar
const COMMUNITY_URL      = "";      // ← link do grupo. Vazio = usa o WhatsApp atual
const COMMUNITY_SHEET_TAB = "PMPE_COMUNIDADE";
```

Qualquer ajuste de comportamento é uma linha, sem tocar na lógica.

---

## 7. Checklist de QA

- [ ] Desktop: sair com o mouse pelo topo abre o popup **uma vez**
- [ ] Desktop: não abre nos primeiros 8s
- [ ] Mobile: 25s parado abre o popup
- [ ] Mobile: scroll-up rápido abre o popup
- [ ] Popup **não** abre com o modal principal aberto
- [ ] Fechar e recarregar: não reabre (snooze de 3 dias)
- [ ] Após converter em qualquer form: nunca mais aparece
- [ ] `ESC`, X e overlay fecham
- [ ] `Tab` circula dentro do popup (focus trap)
- [ ] Scroll do body travado com popup aberto, destravado ao fechar
- [ ] Envio grava na aba `PMPE_COMUNIDADE` e redireciona
- [ ] Validação de nome e telefone dispara mensagens de erro
- [ ] 3 eventos aparecem no preview do GTM
- [ ] iPhone / Android / 360px de largura sem quebra
- [ ] `EXIT_POPUP_ENABLED = false` desliga tudo

---

## 8. Riscos assumidos

- **Exit intent real não existe no mobile.** Inatividade e scroll-up são
  aproximações de comportamento, não leitura de intenção. Parte do tráfego mobile
  não será alcançada — é uma limitação da plataforma, não da implementação.
- **Canibalização parcial** do formulário principal é possível. As travas reduzem,
  o tracking mede. Se os números piorarem: `EXIT_POPUP_ENABLED = false`.
- **Lead de comunidade é mais frio** que lead de vendas. Por isso a aba separada:
  o time não deve tratar os dois do mesmo jeito.
