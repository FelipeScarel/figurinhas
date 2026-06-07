document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("orders-tbody");
  const emptyState = document.getElementById("empty-state");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  loadOrders();

  searchBtn?.addEventListener("click", () => loadOrders(searchInput.value.trim()));
  searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") loadOrders(searchInput.value.trim()); });

  async function loadOrders(search) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-gray-400"><span class="spinner inline-block w-5 h-5 border-2 border-gray-300 border-t-amber-500 rounded-full"></span></td></tr>';

    try {
      let url = "/admin/api/pedidos";
      if (search) url += "?search=" + encodeURIComponent(search);
      const res = await fetch(url);
      const orders = await res.json();

      if (orders.length === 0) { tbody.innerHTML = ""; emptyState.classList.remove("hidden"); updateStats([]); return; }
      emptyState.classList.add("hidden");
      renderOrders(orders);
      updateStats(orders);
    } catch (err) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-red-500">Erro ao carregar.</td></tr>';
    }
  }

  function renderOrders(orders) {
    tbody.innerHTML = orders.map((order) => {
      const date = new Date(order.created_at + "Z");
      const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

      const statusClass = getStatusClass(order.status);
      const isUrgent = order.urgencia && (order.urgencia.includes("Urgente") || order.urgencia.includes("Urgentíssimo"));
      const urgencyBadge = isUrgent
        ? `<span class="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-200">⚡ ${esc(order.urgencia)}</span>` : "";

      const arquivosHtml = order.arquivos && order.arquivos.length > 0
        ? order.arquivos.map(a => `<a href="/static/${a.arquivo_path}" target="_blank" class="inline-block text-amber-600 hover:text-amber-500 text-xs ml-1">📎</a>`).join("")
        : '<span class="text-gray-400 text-xs">—</span>';

      const refTitle = order.referencia_titulo ? `<span class="text-gray-500 text-xs">${esc(order.referencia_titulo)}</span>` : "";

      return `<tr class="hover:bg-gray-50 transition-colors">
        <td class="px-4 py-3 text-gray-500 font-mono text-xs">#${order.id}${urgencyBadge}</td>
        <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">${dateStr}</td>
        <td class="px-4 py-3"><p class="text-gray-900 text-sm font-medium">${esc(order.cliente_nome)}</p>${refTitle}</td>
        <td class="px-4 py-3"><p class="text-gray-500 text-xs">${esc(order.cliente_whatsapp)}</p><p class="text-gray-500 text-xs">Qtd: <span class="font-semibold text-gray-900">${order.quantidade}</span> | ${esc(order.tipo_acabamento)}</p></td>
        <td class="px-4 py-3 text-center">${arquivosHtml}</td>
        <td class="px-4 py-3 text-center"><select data-order-id="${order.id}" class="status-select text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${statusClass}">${["Pendente","Em Análise","Orçamento Enviado","Em Produção","Finalizado"].map(s => `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`).join("")}</select></td>
        <td class="px-4 py-3 text-center"><button onclick='openOrderModal(${JSON.stringify(order).replace(/'/g, "&#39;")})' class="text-amber-600 hover:text-amber-500 text-xs font-medium">Detalhes</button></td>
      </tr>`;
    }).join("");

    tbody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const orderId = select.dataset.orderId;
        const newStatus = select.value;
        try {
          const res = await fetch(`/admin/api/pedidos/${orderId}/status`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
          if (res.ok) loadOrders(searchInput.value.trim());
        } catch (err) { /* ignore */ }
      });
    });
  }

  function updateStats(orders) {
    const counts = { "Pendente": 0, "Em Análise": 0, "Orçamento Enviado": 0, "Em Produção": 0, "Finalizado": 0 };
    let urgents = 0;
    orders.forEach((o) => {
      if (counts.hasOwnProperty(o.status)) counts[o.status]++;
      if (o.urgencia && (o.urgencia.includes("Urgente") || o.urgencia.includes("Urgentíssimo"))) urgents++;
    });
    document.getElementById("stat-total").textContent = orders.length;
    document.getElementById("stat-pending").textContent = counts["Pendente"];
    document.getElementById("stat-analysis").textContent = counts["Em Análise"];
    document.getElementById("stat-production").textContent = counts["Em Produção"];
    document.getElementById("stat-finished").textContent = counts["Finalizado"];
    document.getElementById("stat-urgent").textContent = urgents;
  }

  function getStatusClass(status) {
    const map = { "Pendente": "bg-amber-50 text-amber-700 border-amber-200", "Em Análise": "bg-blue-50 text-blue-700 border-blue-200", "Orçamento Enviado": "bg-cyan-50 text-cyan-700 border-cyan-200", "Em Produção": "bg-purple-50 text-purple-700 border-purple-200", "Finalizado": "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return map[status] || "";
  }

  function esc(str) { if (!str) return ""; const d = document.createElement("div"); d.textContent = str; return d.innerHTML; }
});

// ── Order Detail Modal ──────────────────────────────────────
function openOrderModal(order) {
  const modal = document.getElementById("order-modal");
  document.getElementById("modal-order-title").textContent = `Pedido #${order.id}`;
  const date = new Date(order.created_at + "Z");
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const arquivosList = order.arquivos && order.arquivos.length > 0
    ? order.arquivos.map(a => `<div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"><span class="text-gray-600 text-xs">${esc(a.nome_original || 'Arquivo')}</span><a href="/static/${a.arquivo_path}" target="_blank" class="text-amber-600 hover:text-amber-500 text-xs font-medium">Download</a></div>`).join("")
    : '<p class="text-gray-400 text-xs">Nenhum arquivo</p>';

  document.getElementById("modal-order-body").innerHTML = `
    <div class="grid grid-cols-2 gap-3 text-sm">
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-1">Cliente</p><p class="text-gray-900 font-medium">${esc(order.cliente_nome)}</p><p class="text-gray-500 text-xs">${esc(order.cliente_whatsapp)}</p></div>
      <div class="bg-gray-50 rounded-xl p-3"><p class="text-gray-400 text-xs mb-1">Pedido</p><p class="text-gray-900">${order.quantidade} un. | ${esc(order.tipo_acabamento)}</p><p class="text-gray-500 text-xs">${esc(order.tamanho_estimado || '—')}</p></div>
    </div>
    <div class="bg-gray-50 rounded-xl p-3 text-sm"><p class="text-gray-400 text-xs mb-1">Status</p><span class="px-2 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">${esc(order.status)}</span></div>
    <div class="bg-gray-50 rounded-xl p-3 text-sm"><p class="text-gray-400 text-xs mb-1">Data</p><p class="text-gray-900">${dateStr}</p>${order.observacoes ? `<p class="text-gray-500 text-xs mt-1">Obs: ${esc(order.observacoes)}</p>` : ""}</div>
    <div class="bg-gray-50 rounded-xl p-3 text-sm"><p class="text-gray-400 text-xs mb-1">Arquivos</p>${arquivosList}</div>
    <div class="bg-gray-50 rounded-xl p-3 text-sm"><p class="text-gray-400 text-xs mb-2">Anotações</p><textarea id="modal-anotacoes" rows="2" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="Anotações internas...">${esc(order.anotacoes_internas || '')}</textarea></div>
    <div class="bg-gray-50 rounded-xl p-3 text-sm"><p class="text-gray-400 text-xs mb-2">Link de Pagamento</p><input type="text" id="modal-link-pagamento" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" placeholder="https://mpago.la/..." value="${esc(order.link_pagamento || '')}"></div>
    <button onclick="saveOrderNotes(${order.id})" class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-sm">Salvar</button>
    ${order.link_pagamento ? `<button onclick="navigator.clipboard.writeText('${esc(order.link_pagamento)}');showToast('Link copiado!','success')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm mt-2">Copiar Link</button>` : ""}
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
document.getElementById("order-modal")?.addEventListener("click", (e) => { if (e.target === e.currentTarget) closeOrderModal(); });

async function saveOrderNotes(orderId) {
  const anotacoes = document.getElementById("modal-anotacoes")?.value || "";
  const linkPagamento = document.getElementById("modal-link-pagamento")?.value || "";
  try {
    const res = await fetch(`/admin/api/pedidos/${orderId}/notas`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ anotacoes_internas: anotacoes, link_pagamento: linkPagamento }) });
    const data = await res.json();
    if (data.success) { showToast("Salvo!", "success"); closeOrderModal(); }
  } catch (err) { showToast("Erro.", "error"); }
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
