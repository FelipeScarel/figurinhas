// Phone mask and form submission
document.addEventListener("DOMContentLoaded", () => {
  const whatsappInput = document.getElementById("customer_whatsapp");
  const form = document.getElementById("quote-form-el");
  const submitBtn = document.getElementById("submit-btn");
  const refProductId = document.getElementById("ref-product-id");

  // Phone mask: (XX) XXXXX-XXXX
  if (whatsappInput) {
    whatsappInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 11) value = value.slice(0, 11);

      if (value.length > 0) {
        value = value.replace(/^(\d{2})(\d)/, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
      }
      e.target.value = value;
    });
  }

  // Form submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Disable button
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<span class="spinner inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span> Enviando...';

      const formData = new FormData(form);

      // Set reference product from modal if set
      if (
        refProductId &&
        refProductId.dataset.modalId &&
        !formData.get("reference_product_id")
      ) {
        formData.set("reference_product_id", refProductId.dataset.modalId);
      }

      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to WhatsApp
          window.open(data.whatsapp_link, "_blank");

          // Reset form
          form.reset();
          document
            .getElementById("drop-content")
            ?.classList.remove("hidden");
          document
            .getElementById("preview-container")
            ?.classList.add("hidden");
          if (refProductId) {
            refProductId.value = "";
            refProductId.dataset.modalId = "";
          }

          showToast("Pedido enviado! Redirecionando para o WhatsApp...", "success");
        } else {
          const errors = data.errors || ["Erro ao enviar pedido."];
          showToast(errors.join("<br>"), "error");
        }
      } catch (err) {
        showToast("Erro de conexão. Tente novamente.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> Enviar Pedido via WhatsApp';
      }
    });
  }
});

// Toast notification
function showToast(message, type) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className =
    "toast-msg fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center transition-all duration-300 " +
    (type === "success"
      ? "bg-emerald-600 text-white"
      : "bg-red-600 text-white");
  toast.innerHTML = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
