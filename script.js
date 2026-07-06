/* =========================================================
   CPPEM — Formulário → Google Sheets + Pixel + PixelX + WhatsApp
   ========================================================= */

const SHEET_URL = "https://script.google.com/macros/s/AKfycbxdFplWVSfhTjvyIA7HIWb645xRjGNhBVhTdTf5UMjo0lSpW_A_jCuys0qB4uImKXPQ/exec?aba=PMPE";

const PIXELX_WHATSAPP_REDIRECT = "https://pxa.cppem.com.br/lt/grupo-pmpe";

/* --- Elementos --- */
const form = document.getElementById("lead-form");
const telefoneInput = document.getElementById("telefone");

/* --- Máscara: (00) 00000-0000 --- */
if (telefoneInput) {
  telefoneInput.addEventListener("input", () => {
    let d = telefoneInput.value.replace(/\D/g, "").slice(0, 11);
    let out = "";

    if (d.length > 0) out = "(" + d.slice(0, 2);
    if (d.length >= 2) out += ") ";
    if (d.length > 2) out += d.slice(2, 7);
    if (d.length > 7) out += "-" + d.slice(7, 11);

    telefoneInput.value = out;
  });
}

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
        btn.textContent = "QUERO PARTICIPAR DO LANÇAMENTO";
      }
    }
  });
}
