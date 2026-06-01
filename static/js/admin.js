document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("orders-tbody");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  loadOrders();

  searchBtn?.addEventListener("click", () => loadOrders(searchInput.value.trim()));
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadOrders(searchInput.value.trim());
  });

  async function loadOrders(search) {
    if (!tbody) return;

    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-12 text-surface-500"><span class="spinner inline-block w-5 h-5 border-2 border-surface-600 border-t-brand-500 rounded-full"></span></td></tr>';

    try {
      let url = "/admin/api/pedidos";
      if (search) url += "?search=" + encodeURIComponent(search);

      const res = await fetch(url);
      const orders = await res.json();

      if (orders.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        updateStats([]);
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");
      renderOrders(orders);
      updateStats(orders);
    } catch (err) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center py-12 text-red-400">Erro ao carregar pedidos.</td></tr>';
    }
  }

  function renderOrders(orders) {
    tbody.innerHTML = orders
      .map((order) => {
        const date = new Date(order.created_at + "Z");
        const dateStr = date.toLocaleDateString("pt-BR", {
          day: "2-digit", month: "2-digit", year: "2-digit",
          hour: "2-digit", minute: "2-digit",
        });

        const statusClass = getStatusClass(order.status);
        const isUrgent = order.urgencia && (
          order.urgencia.includes("Urgente") || order.urgencia.includes("Urgentíssimo")
        );
        const urgencyBadge = isUrgent
          ? `<span class="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/20 text-red-400 border border-red-600/30 animate-pulse">
               <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
               ${order.urgencia}
             </span>`
          : "";

        const arquivosHtml = order.arquivos && order.arquivos.length > 0
          ? order.arquivos.map(a =>
              `<a href="/static/${a.arquivo_path}" target="_blank" class="inline-block text-brand-400 hover:text-brand-300 text-xs ml-1" title="${escapeHtml(a.nome_original || '')}">&#128206;</a>`
            ).join("")
          : '<span class="text-surface-600 text-xs">—</span>';

        const refTitle = order.referencia_titulo
          ? `<span class="text-surface-500 text-xs">${escapeHtml(order.referencia_titulo)}</span>`
          : "";

        const qtdUrgencia = order.urgencia
          ? `<span class="text-surface-400 text-[10px]">${escapeHtml(order.urgencia)}</span>`
          : "";

        return `
          <tr class="hover:bg-surface-850/50 transition-colors">
            <td class="px-4 py-3 text-surface-400 font-mono text-xs">#${order.id}${urgencyBadge}</td>
            <td class="px-4 py-3 text-surface-300 text-xs whitespace-nowrap">${dateStr}</td>
            <td class="px-4 py-3">
              <p class="text-white text-sm font-medium">${escapeHtml(order.cliente_nome)}</p>
              ${refTitle}
            </td>
            <td class="px-4 py-3">
              <p class="text-surface-300 text-xs">${escapeHtml(order.cliente_whatsapp)}</p>
              <p class="text-surface-300 text-xs">Qtd: <span class="text-white font-semibold">${order.quantidade}</span> | ${escapeHtml(order.tipo_acabamento)}</p>
              ${qtdUrgencia}
            </td>
            <td class="px-4 py-3 text-center">${arquivosHtml}</td>
            <td class="px-4 py-3 text-center">
              <select data-order-id="${order.id}" class="status-select text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-all appearance-none text-center ${statusClass}"
                      style="background-image:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22><path stroke=%22%2394a3b8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M6 8l4 4 4-4%22/></svg>');background-size:14px;background-repeat:no-repeat;background-position:right 6px center;padding-right:28px;">
                <option value="Pendente" ${order.status === "Pendente" ? "selected" : ""}>Pendente</option>
                <option value="Em Análise" ${order.status === "Em Análise" ? "selected" : ""}>Em Análise</option>
                <option value="Orçamento Enviado" ${order.status === "Orçamento Enviado" ? "selected" : ""}>Orçamento Enviado</option>
                <option value="Em Produção" ${order.status === "Em Produção" ? "selected" : ""}>Em Produção</option>
                <option value="Finalizado" ${order.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
              </select>
            </td>
            <td class="px-4 py-3 text-center">
              <button onclick='openOrderModal(${JSON.stringify(order).replace(/'/g, "&#39;")})'
                      class="text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors">
                Detalhes
              </button>
            </td>
          </tr>`;
      })
      .join("");

    // Attach status change handlers
    tbody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const orderId = select.dataset.orderId;
        const newStatus = select.value;

        try {
          const res = await fetch("/admin/api/pedidos/" + orderId + "/status", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          if (res.ok) {
            select.className = select.className.replace(/status-\S+/g, "");
            select.className += " " + getStatusClass(newStatus);
            loadOrders(searchInput.value.trim());
          }
        } catch (err) { /* ignore */ }
      });
    });
  }

  function updateStats(orders) {
    const total = orders.length;
    const counts = { "Pendente": 0, "Em Análise": 0, "Orçamento Enviado": 0, "Em Produção": 0, "Finalizado": 0 };
    let urgents = 0;

    orders.forEach((o) => {
      if (counts.hasOwnProperty(o.status)) counts[o.status]++;
      if (o.urgencia && (o.urgencia.includes("Urgente") || o.urgencia.includes("Urgentíssimo"))) urgents++;
    });

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-pending").textContent = counts["Pendente"];
    document.getElementById("stat-analysis").textContent = counts["Em Análise"];
    document.getElementById("stat-production").textContent = counts["Em Produção"];
    document.getElementById("stat-finished").textContent = counts["Finalizado"];
    document.getElementById("stat-urgent").textContent = urgents;
  }

  function getStatusClass(status) {
    const map = {
      "Pendente": "status-Pendente",
      "Em Análise": "status-Em",
      "Orçamento Enviado": "status-Orçamento",
      "Em Produção": "status-Em-Produção",
      "Finalizado": "status-Finalizado",
    };
    return map[status] || "";
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});

// ── Order Detail Modal ──────────────────────────────────────

function openOrderModal(order) {
  const modal = document.getElementById("order-modal");
  document.getElementById("modal-order-title").textContent = `Pedido #${order.id}`;

  const date = new Date(order.created_at + "Z");
  const dateStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const arquivosList = order.arquivos && order.arquivos.length > 0
    ? order.arquivos.map(a =>
        `<div class="flex items-center justify-between bg-surface-800 rounded-lg px-3 py-2">
           <span class="text-surface-300 text-xs">${escapeHtml(a.nome_original || 'Arquivo')}</span>
           <a href="/static/${a.arquivo_path}" target="_blank" class="text-brand-400 hover:text-brand-300 text-xs font-medium">Download</a>
         </div>`
      ).join("")
    : '<p class="text-surface-500 text-xs">Nenhum arquivo enviado</p>';

  const urgencyLevel = order.urgencia
    ? `<span class="px-2 py-1 rounded-lg text-xs font-bold ${order.urgencia.includes('Urgente') ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-surface-800 text-surface-300'}">${escapeHtml(order.urgencia)}</span>`
    : '<span class="text-surface-500 text-xs">Normal</span>';

  document.getElementById("modal-order-body").innerHTML = `
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="bg-surface-800 rounded-xl p-3">
        <p class="text-surface-400 text-xs mb-1">Cliente</p>
        <p class="text-white font-medium">${escapeHtml(order.cliente_nome)}</p>
        <p class="text-surface-400 text-xs">${escapeHtml(order.cliente_whatsapp)}</p>
      </div>
      <div class="bg-surface-800 rounded-xl p-3">
        <p class="text-surface-400 text-xs mb-1">Pedido</p>
        <p class="text-white">${order.quantidade} un. | ${escapeHtml(order.tipo_acabamento)}</p>
        <p class="text-surface-400 text-xs">${escapeHtml(order.tamanho_estimado || 'Tamanho não informado')}</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="bg-surface-800 rounded-xl p-3">
        <p class="text-surface-400 text-xs mb-1">Status</p>
        <span class="px-2 py-1 rounded-lg text-xs font-semibold ${getStatusClassInline(order.status)}">${escapeHtml(order.status)}</span>
      </div>
      <div class="bg-surface-800 rounded-xl p-3">
        <p class="text-surface-400 text-xs mb-1">Urgência</p>
        ${urgencyLevel}
      </div>
    </div>

    <div class="bg-surface-800 rounded-xl p-3 text-sm">
      <p class="text-surface-400 text-xs mb-1">Data</p>
      <p class="text-white">${dateStr}</p>
      ${order.observacoes ? `<p class="text-surface-400 text-xs mt-1">Obs: ${escapeHtml(order.observacoes)}</p>` : ""}
    </div>

    <div class="bg-surface-800 rounded-xl p-3 text-sm">
      <p class="text-surface-400 text-xs mb-1">Arquivos Enviados</p>
      ${arquivosList}
    </div>

    <!-- Internal Notes -->
    <div class="bg-surface-800 rounded-xl p-3 text-sm">
      <p class="text-surface-400 text-xs mb-2">Anotações Internas</p>
      <textarea id="modal-anotacoes" rows="2"
                class="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
                placeholder="Ex: Usar vinil refletivo premium, enviar amostra antes...">${escapeHtml(order.anotacoes_internas || '')}</textarea>
    </div>

    <!-- Payment Link -->
    <div class="bg-surface-800 rounded-xl p-3 text-sm">
      <p class="text-surface-400 text-xs mb-2">Link de Pagamento (Mercado Pago/Pix)</p>
      <input type="text" id="modal-link-pagamento"
             class="w-full bg-surface-900 border border-surface-700 rounded-lg px-3 py-2 text-white text-xs placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
             placeholder="https://mpago.la/..."
             value="${escapeHtml(order.link_pagamento || '')}">
    </div>

    <button onclick="saveOrderNotes(${order.id})"
            class="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm active:scale-[0.98]">
      Salvar Anotações
    </button>

    ${order.link_pagamento ? `
    <button onclick="navigator.clipboard.writeText('${escapeHtml(order.link_pagamento)}');showToast('Link copiado!','success')"
            class="w-full bg-surface-700 hover:bg-surface-600 text-white font-medium py-2 rounded-xl text-sm transition-all">
      Copiar Link de Pagamento
    </button>` : ""}
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

document.getElementById("order-modal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeOrderModal();
});

async function saveOrderNotes(orderId) {
  const anotacoes = document.getElementById("modal-anotacoes")?.value || "";
  const linkPagamento = document.getElementById("modal-link-pagamento")?.value || "";

  try {
    const res = await fetch(`/admin/api/pedidos/${orderId}/notas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anotacoes_internas: anotacoes,
        link_pagamento: linkPagamento,
      }),
    });
    const data = await res.json();
    if (data.success) {
      showToast("Anotações salvas com sucesso!", "success");
      closeOrderModal();
    }
  } catch (err) {
    showToast("Erro ao salvar.", "error");
  }
}

function getStatusClassInline(status) {
  const map = {
    "Pendente": "bg-yellow-600/20 text-yellow-300 border border-yellow-600/30",
    "Em Análise": "bg-blue-600/20 text-blue-300 border border-blue-600/30",
    "Orçamento Enviado": "bg-cyan-600/20 text-cyan-300 border border-cyan-600/30",
    "Em Produção": "bg-purple-600/20 text-purple-300 border border-purple-600/30",
    "Finalizado": "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
  };
  return map[status] || "";
}

function showToast(message, type) {
  const existing = document.querySelector(".toast-msg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className =
    "toast-msg fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-2xl text-sm font-medium max-w-sm text-center transition-all duration-300 " +
    (type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white");
  toast.innerHTML = message;
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
