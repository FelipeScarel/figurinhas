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
      '<tr><td colspan="8" class="text-center py-12 text-surface-500"><span class="spinner inline-block w-5 h-5 border-2 border-surface-600 border-t-brand-500 rounded-full"></span></td></tr>';

    try {
      let url = "/admin/api/orders";
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
        '<tr><td colspan="8" class="text-center py-12 text-red-400">Erro ao carregar pedidos.</td></tr>';
    }
  }

  function renderOrders(orders) {
    tbody.innerHTML = orders
      .map((order) => {
        const date = new Date(order.created_at + "Z");
        const dateStr = date.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });

        const statusClass = getStatusClass(order.status);
        const artworkCell = order.artwork_path
          ? `<a href="/static/${order.artwork_path}" target="_blank" class="inline-flex items-center gap-1.5 text-brand-400 hover:text-brand-300 text-xs font-medium transition-colors" title="Ver arte original">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Ver
             </a>`
          : '<span class="text-surface-600 text-xs">—</span>';

        const refTitle = order.reference_title
          ? `<span class="text-surface-500 text-xs">${escapeHtml(order.reference_title)}</span>`
          : "";

        return `
          <tr class="hover:bg-surface-850/50 transition-colors">
            <td class="px-4 py-3 text-surface-400 font-mono text-xs">#${order.id}</td>
            <td class="px-4 py-3 text-surface-300 text-xs whitespace-nowrap">${dateStr}</td>
            <td class="px-4 py-3">
              <p class="text-white text-sm font-medium">${escapeHtml(order.customer_name)}</p>
              ${refTitle}
            </td>
            <td class="px-4 py-3 text-surface-300 text-xs">${escapeHtml(order.customer_whatsapp)}</td>
            <td class="px-4 py-3 text-center text-white text-sm font-semibold">${order.quantity}</td>
            <td class="px-4 py-3 text-surface-300 text-xs">${escapeHtml(order.finish_type)}</td>
            <td class="px-4 py-3 text-center">${artworkCell}</td>
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
          </tr>`;
      })
      .join("");

    // Attach status change handlers
    tbody.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async (e) => {
        const orderId = select.dataset.orderId;
        const newStatus = select.value;

        try {
          const res = await fetch(
            "/admin/api/orders/" + orderId + "/status",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: newStatus }),
            }
          );

          if (res.ok) {
            select.className = select.className.replace(
              /status-\S+/g,
              ""
            );
            select.className += " " + getStatusClass(newStatus);
            loadOrders(searchInput.value.trim());
          }
        } catch (err) {
          select.value = select.dataset.previousValue || "Pendente";
        }
      });

      select.dataset.previousValue = select.value;
    });
  }

  function updateStats(orders) {
    const total = orders.length;
    const counts = { Pendente: 0, "Em Análise": 0, "Orçamento Enviado": 0, "Em Produção": 0, Finalizado: 0 };

    orders.forEach((o) => {
      if (counts.hasOwnProperty(o.status)) counts[o.status]++;
    });

    document.getElementById("stat-total").textContent = total;
    document.getElementById("stat-pending").textContent = counts["Pendente"];
    document.getElementById("stat-analysis").textContent = counts["Em Análise"];
    document.getElementById("stat-production").textContent = counts["Em Produção"];
    document.getElementById("stat-finished").textContent = counts["Finalizado"];

    // Update "Orçamento Enviado" stat if exists
    const sentEl = document.getElementById("stat-sent");
    if (sentEl) sentEl.textContent = counts["Orçamento Enviado"];
  }

  function getStatusClass(status) {
    const map = {
      Pendente: "status-Pendente",
      "Em Análise": "status-Em",
      "Orçamento Enviado": "status-Orçamento",
      "Em Produção": "status-Em-Produção",
      Finalizado: "status-Finalizado",
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
