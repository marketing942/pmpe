/* =========================================================
   CPPEM · Landing PMPE — Formulário → Google Sheets + WhatsApp
   ========================================================= */

const SHEET_BASE = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec";

const SHEET_URL = `${SHEET_BASE}?aba=PMPE`;

const WHATSAPP_REDIRECT = "https://wa.me/5581973105354?text=Quero%20come%C3%A7ar%20minha%20prepara%C3%A7%C3%A3o%20para%20PMPE!%20%F0%9F%94%A5%F0%9F%92%80";

/* =========================================================
   Configuração do Exit Popup
   ========================================================= */
const EXIT_POPUP_ENABLED  = true;   // kill switch — false desliga tudo
const ENABLE_BACK_TRAP    = false;  // intercepta o botão "voltar" no mobile
const ARM_DELAY           = 8000;   // ms mínimos na página antes de armar
const IDLE_DELAY          = 25000;  // ms de inatividade no mobile
const SNOOZE_DAYS         = 3;      // dias de silêncio após fechar/enviar
const COMMUNITY_SHEET_TAB = "PMPE_COMUNIDADE";

/* Gatilho mobile: "push" bruto de volta ao topo.
   Só dispara no gesto inteiro — arremesso longo, sem pausa, terminando no topo. */
const SCROLL_UP_MIN_PX  = 1200;  // subida mínima acumulada, em px
const SCROLL_UP_MIN_VH  = 2;     // ...ou 2 telas cheias, o que for maior
const SCROLL_UP_SPEED   = 1.2;   // px/ms médios (~1200 px/s) — separa arremesso de rolagem
const SCROLL_UP_GAP     = 400;   // ms de pausa que quebram o gesto
const SCROLL_UP_JITTER  = 60;    // px de descida tolerados sem zerar o gesto
const SCROLL_UP_TOP     = 200;   // precisa terminar a até 200px do topo

// Link do grupo/canal da comunidade. Vazio = cai no WhatsApp da equipe.
const COMMUNITY_URL = "https://chat.whatsapp.com/BxOuisctuqV3UWT9ldASe4";

const COMMUNITY_SHEET_URL = `${SHEET_BASE}?aba=${COMMUNITY_SHEET_TAB}`;

/* =========================================================
   Tracking de Lead — PixelX / GTM   (ver TRACKING.md)

   REGRA DE OURO: deve existir EXATAMENTE UM emissor de Lead.

   LEAD_MODE = "site"   → Modelo B (§5): o site dispara o Lead.
     A barreira de submit corta a propagação, então a regra de submit
     do painel fica inerte e não há como duplicar por ali.
     ⚠ Uma regra de CLIQUE no painel ainda duplicaria — ver §10.3.

   LEAD_MODE = "painel" → Modelo A: o painel dispara, o site não.
     Exige que o id do <form> seja o cadastrado no painel.
   ========================================================= */
const LEAD_MODE   = "site";        // "site" (Modelo B) | "painel" (Modelo A)
const PHONE_MODE  = "celular_br";  // "celular_br" | "celular_ou_fixo_br" | "internacional"
const REDIRECT_DELAY_MS = 1500;    // §7.6 — abaixo de ~1s começa a perder eventos
const PIXEL_TIMEOUT_MS  = 3000;    // §8.5 — espera o pixel_x_app ficar pronto

/* O popup de saída capta para a COMUNIDADE, não é lead de venda.
   Mantenha false para não contaminar a otimização das campanhas. */
const EXIT_POPUP_ENVIA_LEAD = false;

/* --- Elementos --- */
const form = document.getElementById("lead-form");
const telefoneInput = document.getElementById("telefone");

/* =========================================================
   Utilitários — storage tolerante e dataLayer
   ========================================================= */
const Store = {
  get(k)    { try { return localStorage.getItem(k); }   catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); }       catch (e) {} },
  sGet(k)   { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  sSet(k, v){ try { sessionStorage.setItem(k, v); }     catch (e) {} }
};

const KEY_SEEN      = "cppem_exit_seen";
const KEY_SNOOZE    = "cppem_exit_snooze";
const KEY_CONVERTED = "cppem_lead_converted";

function track(event, data) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event: event }, data || {}));
}

function markConverted() {
  Store.set(KEY_CONVERTED, "1");
}

function snooze() {
  Store.set(KEY_SNOOZE, String(Date.now() + SNOOZE_DAYS * 86400000));
}

/* =========================================================
   ModalManager — dono único do estado dos modais
   ========================================================= */
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const ModalManager = {
  current: null,      // elemento do modal aberto
  lastFocused: null,

  isOpen() {
    return this.current !== null;
  },

  open(id) {
    const el = document.getElementById(id);
    if (!el || this.current === el) return;

    if (this.current) this.close();

    this.lastFocused = document.activeElement;
    this.current = el;

    el.hidden = false;
    document.body.style.overflow = "hidden";

    const firstInput = el.querySelector("input");
    if (firstInput) setTimeout(() => firstInput.focus(), 60);
  },

  close(method) {
    const el = this.current;
    if (!el) return;

    if (el.id === "exit-modal" && !ExitIntent.submitted) {
      track("exit_popup_close", { trigger: ExitIntent.trigger, method: method || "x" });
      snooze();
    }

    el.hidden = true;
    this.current = null;
    document.body.style.overflow = "";

    if (this.lastFocused && typeof this.lastFocused.focus === "function") {
      this.lastFocused.focus();
    }
    this.lastFocused = null;
  },

  // Mantém o Tab preso dentro do modal aberto
  trapFocus(e) {
    if (!this.current || e.key !== "Tab") return;

    const box = this.current.querySelector(".modal__box");
    if (!box) return;

    const items = Array.from(box.querySelectorAll(FOCUSABLE))
      .filter((n) => !n.disabled && n.offsetParent !== null);
    if (!items.length) return;

    const first = items[0];
    const last  = items[items.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
};

document.querySelectorAll("[data-open-modal]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    ModalManager.open("lead-modal");
  });
});

document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", () => {
    const method = el.hasAttribute("data-decline")        ? "recusa"
                 : el.classList.contains("modal__overlay") ? "overlay"
                 : "x";
    ModalManager.close(method);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && ModalManager.isOpen()) {
    ModalManager.close("esc");
    return;
  }
  ModalManager.trapFocus(e);
});

/* =========================================================
   ExitIntent — detecção de intenção de saída
   ========================================================= */
const ExitIntent = {
  armed: false,
  fired: false,
  submitted: false,
  trigger: null,
  cleanup: [],

  init() {
    if (!EXIT_POPUP_ENABLED) return;
    if (!document.getElementById("exit-modal")) return;
    if (this.isBlocked()) return;

    setTimeout(() => { this.armed = true; }, ARM_DELAY);

    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    if (isDesktop) this.watchPointer();
    else this.watchMobile();

    if (ENABLE_BACK_TRAP) this.watchBack();
  },

  // Travas permanentes, avaliadas uma vez na entrada
  isBlocked() {
    if (Store.get(KEY_CONVERTED)) return true;
    if (Store.sGet(KEY_SEEN)) return true;

    const until = parseInt(Store.get(KEY_SNOOZE) || "0", 10);
    if (until && Date.now() < until) return true;

    return false;
  },

  canFire() {
    return this.armed && !this.fired && !ModalManager.isOpen() && !this.isBlocked();
  },

  fire(trigger) {
    if (!this.canFire()) return;

    this.fired = true;
    this.trigger = trigger;
    Store.sSet(KEY_SEEN, "1");

    ModalManager.open("exit-modal");
    track("exit_popup_view", { trigger: trigger });

    this.teardown();
  },

  on(target, type, handler, opts) {
    target.addEventListener(type, handler, opts);
    this.cleanup.push(() => target.removeEventListener(type, handler, opts));
  },

  teardown() {
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  },

  /* Desktop: cursor saindo pelo topo da viewport */
  watchPointer() {
    this.on(document, "mouseout", (e) => {
      if (!e.relatedTarget && e.clientY <= 0) this.fire("desktop");
    });
  },

  /* Mobile: inatividade + "push" bruto de volta ao topo
     Não basta subir rápido. Tem que ser o gesto inteiro:
     um arremesso longo, contínuo e que termina no início da página. */
  watchMobile() {
    let idleTimer = null;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => this.fire("inatividade"), IDLE_DELAY);
    };

    let lastY = window.scrollY;
    let lastT = Date.now();
    let burstPx = 0;      // quanto já subiu neste arremesso
    let burstT = 0;       // quando o arremesso começou
    let burstN = 0;       // quantos eventos compõem o arremesso

    const onScroll = () => {
      const y = window.scrollY;
      const t = Date.now();
      const subiu = lastY - y;

      // Voltou a descer de verdade, ou parou no meio do caminho:
      // não é mais um gesto único — zera e recomeça a contar deste ponto.
      // Oscilações pequenas (layout shift de imagem carregando) são ignoradas,
      // senão um único evento espúrio mataria o arremesso inteiro.
      if (subiu <= -SCROLL_UP_JITTER) {
        burstPx = 0;                          // voltou a descer: anula o gesto
        burstT = t;
        burstN = 0;
      } else if (t - lastT > SCROLL_UP_GAP) {
        burstPx = Math.max(0, subiu);         // gesto novo começa aqui
        burstT = t;
        burstN = 1;
      } else if (subiu > 0) {
        burstPx += subiu;                     // mesmo gesto, continua somando
        burstN++;
      }

      lastY = y;
      lastT = t;

      const duracao = t - burstT;
      const distancia = Math.max(SCROLL_UP_MIN_PX, window.innerHeight * SCROLL_UP_MIN_VH);

      // burstN >= 2 é obrigatório: com um único evento a duração é ~0 e a
      // velocidade daria infinito, deixando passar rolagem lenta que o browser
      // entregou coalescida. Sem intervalo real medido, não dá para afirmar
      // que foi um arremesso — e aqui o falso negativo é preferível.
      if (burstN >= 2 && duracao > 0 &&
          burstPx >= distancia &&
          burstPx / duracao >= SCROLL_UP_SPEED &&
          y <= SCROLL_UP_TOP) {
        this.fire("scroll_up");
        return;
      }

      resetIdle();
    };

    this.on(window, "scroll", onScroll, { passive: true });
    this.on(document, "touchstart", resetIdle, { passive: true });
    this.on(document, "click", resetIdle);
    this.cleanup.push(() => clearTimeout(idleTimer));

    resetIdle();
  },

  /* Mobile (opcional): intercepta o primeiro "voltar" */
  watchBack() {
    try {
      history.pushState(null, "", location.href);
    } catch (e) {
      return;
    }

    this.on(window, "popstate", () => {
      if (this.canFire()) {
        try { history.pushState(null, "", location.href); } catch (e) {}
        this.fire("back");
      }
    });
  }
};

/* --- Validação --- */
function setError(id, msg) {
  const input = document.getElementById(id);
  const errorEl = document.querySelector(`[data-error-for="${id}"]`);

  if (input) input.classList.add("is-invalid");
  if (errorEl) errorEl.textContent = msg;
}

function clearError(id) {
  const input = document.getElementById(id);
  const errorEl = document.querySelector(`[data-error-for="${id}"]`);

  if (input) input.classList.remove("is-invalid");
  if (errorEl) errorEl.textContent = "";
}

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* §7.7 — conta DÍGITOS, não caracteres, e remove o "+55" da máscara antes de
   contar, pelo "+" literal. Remover pelos dígitos seria ambíguo: o DDD 55
   existe (Santa Maria/RS). */
const isPhone = (v) => {
  const d = v.trim().replace(/^\+\s*55\s*/, "").replace(/\D/g, "");

  if (PHONE_MODE === "celular_ou_fixo_br") return d.length === 10 || d.length === 11;
  if (PHONE_MODE === "internacional")      return d.length >= 8 && d.length <= 15;

  return d.length === 11 && d[2] === "9";   // celular_br (padrão)
};

/* Normaliza para E.164 brasileiro: +55 + DDD + número.
   Meta e Google casam telefone por E.164. Sem o código do país,
   "81999967415" vira "+81999967415" — que é Japão — e o match falha. */
function toE164(v) {
  let d = String(v || "").trim().replace(/^\+\s*55\s*/, "").replace(/\D/g, "");

  // já veio com o país embutido, sem o "+"
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);

  return d ? `+55${d}` : "";
}

/* =========================================================
   Emissor ÚNICO de Lead (§9)
   ========================================================= */

/* §8.5 — pixel_x_app é criado pelo GTM e o start() dela é async. Em conexão
   lenta o objeto pode não existir na hora do envio; sem esta espera o Lead
   some sem erro nenhum. */
function waitForPixel(timeoutMs = PIXEL_TIMEOUT_MS) {
  return new Promise((resolve) => {
    const pronto = () => typeof window.pixel_x_app?.send_event === "function";

    if (pronto()) return resolve(true);

    const inicio = Date.now();
    const t = setInterval(() => {
      if (pronto()) {
        clearInterval(t);
        resolve(true);
      } else if (Date.now() - inicio > timeoutMs) {
        clearInterval(t);
        console.warn("[tracking] pixel_x_app não ficou pronto a tempo; Lead não enviado.");
        resolve(false);
      }
    }, 100);
  });
}

/* A guarda cobre duplo clique, listener duplicado e script incluído duas vezes. */
let leadEnviado = false;

async function trackLead({ nome, email, telefone }) {
  if (LEAD_MODE !== "site") return false;

  if (leadEnviado) {
    console.warn("[tracking] Lead já enviado nesta página; ignorando.");
    return false;
  }
  leadEnviado = true;

  if (!(await waitForPixel())) return false;

  try {
    await window.pixel_x_app.send_event({
      event_name: "Lead",
      lead_name:  nome || "",
      lead_email: (email || "").trim().toLowerCase(),
      lead_phone: toE164(telefone)
    });

    console.log("[tracking] Lead enviado.");
    return true;
  } catch (err) {
    console.error("[tracking] send_event falhou:", err);
    leadEnviado = false;          // libera para nova tentativa
    return false;
  }
}

/* Exposto para formulários sem submit nativo (§8.3) e para diagnóstico. */
window.trackLead = trackLead;

function validate() {
  let ok = true;

  const nome = document.getElementById("nome")?.value.trim() || "";
  const email = document.getElementById("email")?.value.trim() || "";
  const tel = telefoneInput?.value.trim() || "";

  ["nome", "email", "telefone"].forEach(clearError);

  if (nome.length < 2) {
    setError("nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (!isPhone(tel)) {
    setError("telefone", "Informe seu WhatsApp com DDD.");
    ok = false;
  }

  return ok;
}

/* --- Envio do formulário principal --- */
async function enviarLead() {
    const btn = form.querySelector("button[type='submit']");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "ENVIANDO...";
    }

    const payload = {
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim(),
      telefone: telefoneInput.value.trim(),
      origem: "pagina_captura_pmpe",
      pagina: window.location.href,
      data_envio: new Date().toISOString()
    };

    try {
      // 1. Dispara o Lead antes de qualquer coisa que possa tirar o
      //    visitante da página (§7.6). No modo "painel" isto não faz nada.
      await trackLead({
        nome: payload.nome,
        email: payload.email,
        telefone: payload.telefone
      });

      // 2. Envia para o Google Sheets
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // 3. Mostra sucesso
      //    §7.6 — NÃO chamar form.reset() aqui: a PixelX lê os campos no blur
      //    e o reset pode fazê-la gravar valores vazios.
      markConverted();

      const successEl = document.getElementById("form-success");

      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      // 4. Redireciona para o WhatsApp
      setTimeout(() => {
        window.location.href = `${WHATSAPP_REDIRECT}`;
      }, REDIRECT_DELAY_MS);

    } catch (err) {
      console.error("[Form] Erro ao enviar:", err);

      setError("telefone", "Erro ao enviar. Tente novamente.");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "QUERO VESTIR A FARDA";
      }
    }
}

/* =========================================================
   Envio do Exit Popup → aba da comunidade
   ========================================================= */
const exitForm = document.getElementById("exit-form");

function validateCommunity() {
  let ok = true;

  const nome = document.getElementById("exit-nome")?.value.trim() || "";
  const email = document.getElementById("exit-email")?.value.trim() || "";
  const tel = document.getElementById("exit-telefone")?.value.trim() || "";

  ["exit-nome", "exit-email", "exit-telefone"].forEach(clearError);

  if (nome.length < 2) {
    setError("exit-nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("exit-email", "Informe um e-mail válido.");
    ok = false;
  }

  if (!isPhone(tel)) {
    setError("exit-telefone", "Informe seu WhatsApp com DDD.");
    ok = false;
  }

  return ok;
}

async function enviarComunidade() {
    const btn = exitForm.querySelector("button[type='submit']");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "ENVIANDO...";
    }

    const payload = {
      nome: document.getElementById("exit-nome").value.trim(),
      email: document.getElementById("exit-email").value.trim(),
      telefone: document.getElementById("exit-telefone").value.trim(),
      origem: "exit_popup_comunidade",
      gatilho: ExitIntent.trigger || "",
      pagina: window.location.href,
      data_envio: new Date().toISOString()
    };

    try {
      await fetch(COMMUNITY_SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      ExitIntent.submitted = true;
      markConverted();          // §7.6 — sem reset() antes do redirecionamento
      snooze();
      track("exit_popup_submit", { trigger: ExitIntent.trigger });

      const successEl = document.getElementById("exit-success");
      if (successEl) successEl.hidden = false;

      setTimeout(() => {
        window.location.href = COMMUNITY_URL || WHATSAPP_REDIRECT;
      }, REDIRECT_DELAY_MS);

    } catch (err) {
      console.error("[ExitPopup] Erro ao enviar:", err);

      setError("exit-telefone", "Erro ao enviar. Tente novamente.");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "QUERO ENTRAR NA COMUNIDADE";
      }
    }
}

/* =========================================================
   Barreira única de submit (§7.8)

   Captura no DOCUMENT, em fase de captura: roda SEMPRE antes de qualquer
   listener registrado no <form>, independente de quem registrou primeiro
   (a PixelX registra o dela de dentro de um start() async).

   É este bloco que garante "exatamente um emissor":
   · inválido            → o evento morre aqui, a PixelX não vê nada
   · válido, modo "site" → morre aqui também; quem dispara o Lead somos nós
   · válido, modo painel → propaga, e só a regra do painel dispara
   · popup de saída      → nunca propaga (não é lead de venda)
   ========================================================= */
document.addEventListener("submit", (e) => {
  /* --- Formulário principal: este SIM é Lead --- */
  if (form && e.target === form) {
    e.preventDefault();                 // nunca recarregar a página

    if (!validate()) {
      e.stopImmediatePropagation();     // inválido → nenhum Lead
      return;
    }

    if (LEAD_MODE === "site") e.stopImmediatePropagation();

    enviarLead();
    return;
  }

  /* --- Popup de saída: comunidade, não é lead de venda --- */
  if (exitForm && e.target === exitForm) {
    e.preventDefault();

    if (!validateCommunity()) {
      e.stopImmediatePropagation();
      return;
    }

    if (!EXIT_POPUP_ENVIA_LEAD || LEAD_MODE === "site") {
      e.stopImmediatePropagation();
    }

    if (EXIT_POPUP_ENVIA_LEAD && LEAD_MODE === "site") {
      trackLead({
        nome: document.getElementById("exit-nome").value.trim(),
        email: document.getElementById("exit-email").value.trim(),
        telefone: document.getElementById("exit-telefone").value.trim()
      });
    }

    enviarComunidade();
  }
}, true);

ExitIntent.init();
