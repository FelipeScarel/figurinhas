document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("vitrine-grid");
  const empty = document.getElementById("vitrine-empty");
  const filterBtns = document.querySelectorAll(".vitrine-filter-btn");
  const modal = document.getElementById("vitrine-modal");
  const form = document.getElementById("vitrine-form");
  const dropZone = document.getElementById("vitrine-drop-zone");
  const imgInput = document.getElementById("vitrine-imagem-input");
  const previewImg = document.getElementById("vitrine-preview-img");

  let currentFilter = "all";

  // Filter buttons
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active", "bg-brand-600", "text-white"));
      btn.classList.add("active", "bg-brand-600", "text-white");
      currentFilter = btn.dataset.vitrineFilter;
      loadVitrine();
    });
  });

  // Image preview for vitrine form
  if (imgInput && previewImg) {
    imgInput.addEventListener("change", () => {
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

    // Drag & drop for vitrine form
    ["dragenter", "dragover", "dragleave", "drop"].forEach((ev) => {
      dropZone.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); });
    });
    dropZone.addEventListener("drop", (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        imgInput.files = files;
        imgInput.dispatchEvent(new Event("change"));
      }
    });
  }

  // Vitrine form submit
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
        showToast(isEdit ? "Figurinha atualizada!" : "Figurinha criada!", "success");
        closeVitrineForm();
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

  // Close modal on backdrop click
  modal?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeVitrineForm();
  });

  // Initial load
  loadVitrine();
});

async function loadVitrine() {
  const grid = document.getElementById("vitrine-grid");
  const empty = document.getElementById("vitrine-empty");

  let url = "/admin/api/vitrine";
  if (currentFilter && currentFilter !== "all") {
    url += "?categoria=" + encodeURIComponent(currentFilter);
  }

  try {
    const res = await fetch(url);
    const figurinhas = await res.json();

    if (figurinhas.length === 0) {
      grid.innerHTML = "";
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");

    grid.innerHTML = figurinhas
      .map((fig) => {
        const precoStr = fig.preco
          ? `<span class="px-2 py-0.5 rounded-lg bg-emerald-950/50 text-emerald-300 text-xs font-bold border border-emerald-800/30">R$ ${parseFloat(fig.preco).toFixed(2)}</span>`
          : `<span class="px-2 py-0.5 rounded-lg bg-surface-700 text-surface-400 text-xs">Sem preço</span>`;

        const activeBadge = fig.is_active
          ? '<span class="px-2 py-0.5 rounded text-[10px] bg-emerald-600/20 text-emerald-400">Ativo</span>'
          : '<span class="px-2 py-0.5 rounded text-[10px] bg-red-600/20 text-red-400">Inativo</span>';

        const catBadge = fig.categoria_nome
          ? `<span class="px-2 py-0.5 rounded text-[10px] bg-surface-800 text-surface-300 border border-surface-700">${escapeHtml(fig.categoria_nome)}</span>`
          : "";

        return `
          <div class="bg-surface-900 border border-surface-800 rounded-2xl overflow-hidden hover:border-surface-700 transition-all group">
            <div class="aspect-[4/3] bg-surface-800 flex items-center justify-center overflow-hidden">
              ${fig.url_imagem
                ? `<img src="/static/${fig.url_imagem}" alt="${escapeHtml(fig.titulo)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">`
                : '<span class="text-surface-600 text-xs">Sem imagem</span>'}
            </div>
            <div class="p-4 space-y-2">
              <div class="flex items-start justify-between gap-2">
                <h3 class="font-semibold text-white text-sm truncate flex-1">${escapeHtml(fig.titulo)}</h3>
                ${activeBadge}
              </div>
              ${fig.descricao ? `<p class="text-surface-400 text-xs line-clamp-2">${escapeHtml(fig.descricao)}</p>` : ""}
              <div class="flex items-center gap-2">
                ${precoStr}
                ${catBadge}
              </div>
              <div class="flex gap-2 pt-1">
                <button onclick='editVitrine(${JSON.stringify(fig).replace(/'/g, "&#39;")})'
                        class="flex-1 bg-surface-800 hover:bg-surface-700 text-white text-xs font-medium py-2 rounded-lg transition-all">
                  Editar
                </button>
                <button onclick="deleteVitrine(${fig.id}, '${escapeHtml(fig.titulo)}')"
                        class="bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-medium px-3 py-2 rounded-lg transition-all border border-red-700/30 hover:border-red-600">
                  Excluir
                </button>
              </div>
            </div>
          </div>`;
      })
      .join("");
  } catch (err) {
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-red-400">Erro ao carregar vitrine.</div>';
  }
}

function openVitrineForm(figData) {
  const modal = document.getElementById("vitrine-modal");
  document.getElementById("vitrine-modal-title").textContent = figData ? "Editar Figurinha" : "Nova Figurinha";
  document.getElementById("vitrine-edit-id").value = figData ? figData.id : "";
  document.getElementById("vitrine-titulo").value = figData ? figData.titulo : "";
  document.getElementById("vitrine-descricao").value = figData ? (figData.descricao || "") : "";
  document.getElementById("vitrine-preco").value = figData && figData.preco ? figData.preco : "";

  if (figData && figData.categoria_id) {
    document.getElementById("vitrine-categoria").value = figData.categoria_id;
  } else {
    document.getElementById("vitrine-categoria").value = "";
  }

  if (figData) {
    document.getElementById("vitrine-active-field").classList.remove("hidden");
    document.getElementById("vitrine-is-active").checked = !!figData.is_active;
  } else {
    document.getElementById("vitrine-active-field").classList.add("hidden");
  }

  // Reset image upload
  document.getElementById("vitrine-imagem-input").value = "";
  const previewImg = document.getElementById("vitrine-preview-img");
  previewImg.classList.add("hidden");
  document.getElementById("vitrine-drop-content").classList.remove("hidden");

  if (figData && figData.url_imagem) {
    previewImg.src = "/static/" + figData.url_imagem;
    previewImg.classList.remove("hidden");
    document.getElementById("vitrine-drop-content").classList.add("hidden");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function editVitrine(fig) {
  openVitrineForm(fig);
}

function closeVitrineForm() {
  const modal = document.getElementById("vitrine-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

async function deleteVitrine(id, titulo) {
  if (!confirm(`Excluir "${titulo}"?\nEsta ação não pode ser desfeita.`)) return;

  try {
    const res = await fetch(`/admin/api/vitrine/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showToast("Figurinha excluída.", "success");
      loadVitrine();
    } else {
      showToast(data.error || "Erro ao excluir.", "error");
    }
  } catch (err) {
    showToast("Erro de conexão.", "error");
  }
}

function showToast(message, type) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className =
    "toast-msg fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center transition-all duration-300 " +
    (type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, 10px)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
