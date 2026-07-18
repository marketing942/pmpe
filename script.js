/* =========================================================
   CPPEM — Formulário → Google Sheets + Pixel + PixelX + WhatsApp
   ========================================================= */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=PMPE";

const PIXELX_WHATSAPP_REDIRECT = "https://wa.me/5581973105354?text=Quero%20come%C3%A7ar%20minha%20prepara%C3%A7%C3%A3o%20para%20PMPE!%20%F0%9F%94%A5%F0%9F%92%80";

/* --- Elementos --- */
const form = document.getElementById("lead-form");
const telefoneInput = document.getElementById("telefone");

/* =========================================================
   Modal / Popup do formulário
   ========================================================= */
const modal = document.getElementById("lead-modal");

function openModal() {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  const firstInput = modal.querySelector("input");
  if (firstInput) setTimeout(() => firstInput.focus(), 60);
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

document.querySelectorAll("[data-open-modal]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
});

document.querySelectorAll("[data-close-modal]").forEach((el) => {
  el.addEventListener("click", closeModal);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && !modal.hidden) closeModal();
});

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
  const tel = telefoneInput?.value.replace(/\D/g, "") || "";

  ["nome", "email", "telefone"].forEach(clearError);

  if (nome.length < 2) {
    setError("nome", "Informe seu nome completo.");
    ok = false;
  }

  if (!isEmail(email)) {
    setError("email", "Informe um e-mail válido.");
    ok = false;
  }

  if (tel.length < 11) {
    setError("telefone", "Informe o telefone com DDD.");
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

      // 2. Dispara evento Lead no Meta Pixel
      try {
        if (typeof fbq === "function") {
          fbq("track", "Lead", {
            content_name: "captura_cppem",
            page_url: window.location.href
          });

          console.log("[Pixel Meta] Lead disparado com sucesso.");
        } else {
          console.warn("[Pixel Meta] fbq não encontrado.");
        }
      } catch (pixelError) {
        console.warn("[Pixel Meta] Erro ao disparar Lead:", pixelError);
      }

      // 2b. Dispara o Lead no PixelX (API oficial) — antes de qualquer redirecionamento
      try {
        if (window.pixel_x_app && typeof window.pixel_x_app.send_event === "function") {
          await window.pixel_x_app.send_event({
            // Evento
            event_name: "Lead",

            // Lead
            lead_name: payload.nome,
            lead_email: payload.email,
            lead_phone: payload.telefone
          });

          console.log("[PixelX] Lead disparado com sucesso.");
        } else {
          console.warn("[PixelX] window.pixel_x_app.send_event não encontrado.");
        }
      } catch (pixelxError) {
        console.warn("[PixelX] Erro ao disparar Lead:", pixelxError);
      }

      // 3. Mostra sucesso
      form.reset();

      const successEl = document.getElementById("form-success");

      if (successEl) {
        successEl.hidden = false;
        successEl.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }

      // 4. Redireciona pelo link rastreável da PixelX

      setTimeout(() => {
        window.location.href = `${PIXELX_WHATSAPP_REDIRECT}`;
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
