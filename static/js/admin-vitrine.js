document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("vitrine-grid");
  const empty = document.getElementById("vitrine-empty");
  const modal = document.getElementById("vitrine-modal");
  const form = document.getElementById("vitrine-form");
  const dropZone = document.getElementById("vitrine-drop-zone");
  const imgInput = document.getElementById("vitrine-imagem-input");
  const previewImg = document.getElementById("vitrine-preview-img");

  // Show file input on click
  dropZone?.addEventListener("click", () => imgInput?.click());

  // Image preview
  imgInput?.addEventListener("change", () => {
    const file = imgInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.classList.remove("hidden");
        document.getElementById("vitrine-drop-content").classList.add("hidden");
      };
      reader.readAsDataURL(file);
    }
  });

  // Drag & drop
  ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => {
    dropZone?.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });
  });
  dropZone?.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      imgInput.files = files;
      imgInput.dispatchEvent(new Event("change"));
    }
  });

  // Form submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editId = document.getElementById("vitrine-edit-id").value;
    const formData = new FormData(form);
    const isEdit = !!editId;
    const url = isEdit ? `/admin/api/vitrine/${editId}` : "/admin/api/vitrine";
    const method = isEdit ? "PUT" : "POST";

    document.getElementById("vitrine-submit-btn").disabled = true;
    document.getElementById("vitrine-submit-btn").textContent = "Salvando...";

    try {
      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (data.success) {
        showToast(isEdit ? "Atualizado!" : "Criado!", "success");
        closeForm();
        loadVitrine();
      } else {
        showToast(data.error || "Erro ao salvar.", "error");
      }
    } catch (err) {
      showToast("Erro de conexão.", "error");
    } finally {
      document.getElementById("vitrine-submit-btn").disabled = false;
      document.getElementById("vitrine-submit-btn").textContent = "Salvar";
    }
  });

  modal?.addEventListener("click", (e) => { if (e.target === e.currentTarget) closeForm(); });
  loadVitrine();
});

async function loadVitrine() {
  const grid = document.getElementById("vitrine-grid");
  const empty = document.getElementById("vitrine-empty");

  try {
    const res = await fetch("/admin/api/vitrine");
    const figurinhas = await res.json();

    if (figurinhas.length === 0) {
      grid.innerHTML = "";
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    grid.innerHTML = figurinhas.map((fig) => {
      const precoStr = fig.preco
        ? `<span class="text-amber-700 font-bold text-sm">R$ ${parseFloat(fig.preco).toFixed(2).replace(".", ",")}</span>`
        : `<span class="text-gray-400 text-xs">Sob Consulta</span>`;

      const activeBadge = fig.is_active
        ? '<span class="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">Ativo</span>'
        : '<span class="px-2 py-0.5 rounded text-xs bg-red-50 text-red-600 border border-red-200">Inativo</span>';

      return `
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-amber-300 transition-colors">
          <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
            ${fig.url_imagem
              ? `<img src="/static/${fig.url_imagem}" alt="${esc(fig.titulo)}" class="w-full h-full object-cover" loading="lazy">`
              : '<span class="text-gray-400 text-xs">Sem imagem</span>'}
          </div>
          <div class="p-4 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <h3 class="font-semibold text-gray-900 text-sm truncate flex-1">${esc(fig.titulo)}</h3>
              ${activeBadge}
            </div>
            ${fig.descricao ? `<p class="text-gray-500 text-xs line-clamp-2">${esc(fig.descricao)}</p>` : ""}
            <div class="flex items-center gap-2">${precoStr}</div>
            <div class="flex gap-2 pt-1">
              <button onclick='editVitrine(${JSON.stringify(fig).replace(/'/g, "&#39;")})' class="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium py-2 rounded-lg">Editar</button>
              <button onclick="deleteVitrine(${fig.id}, '${esc(fig.titulo)}')" class="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-lg border border-red-200">Excluir</button>
            </div>
          </div>
        </div>`;
    }).join("");
  } catch (err) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-500">Erro ao carregar.</div>';
  }
}

function openForm(figData) {
  document.getElementById("vitrine-modal-title").textContent = figData ? "Editar Modelo" : "Novo Modelo";
  document.getElementById("vitrine-edit-id").value = figData ? figData.id : "";
  document.getElementById("vitrine-titulo").value = figData ? figData.titulo : "";
  document.getElementById("vitrine-descricao").value = figData ? (figData.descricao || "") : "";
  document.getElementById("vitrine-preco").value = figData && figData.preco ? figData.preco : "";

  if (figData) {
    document.getElementById("vitrine-active-field").classList.remove("hidden");
    document.getElementById("vitrine-is-active").checked = !!figData.is_active;
  } else {
    document.getElementById("vitrine-active-field").classList.add("hidden");
  }

  // Reset image
  imgInput = document.getElementById("vitrine-imagem-input");
  if (imgInput) imgInput.value = "";
  const previewImg = document.getElementById("vitrine-preview-img");
  previewImg.classList.add("hidden");
  document.getElementById("vitrine-drop-content").classList.remove("hidden");

  if (figData && figData.url_imagem) {
    previewImg.src = "/static/" + figData.url_imagem;
    previewImg.classList.remove("hidden");
    document.getElementById("vitrine-drop-content").classList.add("hidden");
  }

  const modal = document.getElementById("vitrine-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function editVitrine(fig) { openForm(fig); }

function closeForm() {
  const modal = document.getElementById("vitrine-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

async function deleteVitrine(id, titulo) {
  if (!confirm(`Excluir "${titulo}"?`)) return;
  try {
    const res = await fetch(`/admin/api/vitrine/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { showToast("Excluído!", "success"); loadVitrine(); }
    else showToast(data.error || "Erro.", "error");
  } catch (err) { showToast("Erro de conexão.", "error"); }
}

function showToast(msg, type) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();
  const t = document.createElement("div");
  t.className = "toast-msg fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-lg text-sm font-medium " + (type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = "0"; t.style.transform = "translate(-50%, 10px)"; setTimeout(() => t.remove(), 300); }, 3000);
}

function esc(str) { if (!str) return ""; const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }
