/* =========================================================
   CPPEM — Formulário → Google Sheets + WhatsApp
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

// Link do grupo/canal da comunidade. Vazio = cai no WhatsApp da equipe.
const COMMUNITY_URL = "https://chat.whatsapp.com/BxOuisctuqV3UWT9ldASe4";

const COMMUNITY_SHEET_URL = `${SHEET_BASE}?aba=${COMMUNITY_SHEET_TAB}`;

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

  /* Mobile: inatividade + scroll-up brusco */
  watchMobile() {
    let idleTimer = null;

    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => this.fire("inatividade"), IDLE_DELAY);
    };

    let refY = window.scrollY;
    let refT = Date.now();
    let maxY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const t = Date.now();

      if (y > maxY) maxY = y;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const passouMetade = scrollable > 0 && maxY > scrollable * 0.4;

      if (t - refT > 500) {
        refY = y;
        refT = t;
      } else if (passouMetade && refY - y > 380) {
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

  if (tel.length < 1) {
    setError("telefone", "Informe seu WhatsApp.");
    ok = false;
  }

  return ok;
}

/* --- Envio --- */
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const btn = form.querySelector("button[type='submit']");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "ENVIANDO...";
    }

    const payload = {
      nome: document.getElementById("nome").value.trim(),
      email: document.getElementById("email").value.trim(),
      telefone: telefoneInput.value.trim(),
      origem: "pagina_captura_cppem",
      pagina: window.location.href,
      data_envio: new Date().toISOString()
    };

    try {
      // 1. Envia primeiro para o Google Sheets
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      // 2. Mostra sucesso
      form.reset();
      markConverted();

      const successEl = document.getElementById("form-success");

      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      // 3. Redireciona para o WhatsApp

      setTimeout(() => {
        window.location.href = `${WHATSAPP_REDIRECT}`;
      }, 700);

    } catch (err) {
      console.error("[Form] Erro ao enviar:", err);

      setError("telefone", "Erro ao enviar. Tente novamente.");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "QUERO VESTIR A FARDA";
      }
    }
  });
}

/* =========================================================
   Envio do Exit Popup → aba da comunidade
   ========================================================= */
const exitForm = document.getElementById("exit-form");

function validateCommunity() {
  let ok = true;

  const nome = document.getElementById("exit-nome")?.value.trim() || "";
  const tel = document.getElementById("exit-telefone")?.value.trim() || "";

  ["exit-nome", "exit-telefone"].forEach(clearError);

  if (nome.length < 2) {
    setError("exit-nome", "Informe seu nome completo.");
    ok = false;
  }

  if (tel.replace(/\D/g, "").length < 10) {
    setError("exit-telefone", "Informe seu WhatsApp com DDD.");
    ok = false;
  }

  return ok;
}

if (exitForm) {
  exitForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateCommunity()) return;

    const btn = exitForm.querySelector("button[type='submit']");

    if (btn) {
      btn.disabled = true;
      btn.textContent = "ENVIANDO...";
    }

    const payload = {
      nome: document.getElementById("exit-nome").value.trim(),
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
      exitForm.reset();
      markConverted();
      snooze();
      track("exit_popup_submit", { trigger: ExitIntent.trigger });

      const successEl = document.getElementById("exit-success");
      if (successEl) successEl.hidden = false;

      setTimeout(() => {
        window.location.href = COMMUNITY_URL || WHATSAPP_REDIRECT;
      }, 700);

    } catch (err) {
      console.error("[ExitPopup] Erro ao enviar:", err);

      setError("exit-telefone", "Erro ao enviar. Tente novamente.");

      if (btn) {
        btn.disabled = false;
        btn.textContent = "QUERO ENTRAR NA COMUNIDADE";
      }
    }
  });
}

ExitIntent.init();
