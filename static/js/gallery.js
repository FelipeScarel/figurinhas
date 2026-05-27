// Gallery filtering
document.addEventListener("DOMContentLoaded", () => {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".gallery-card");
  const empty = document.getElementById("gallery-empty");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      let visible = 0;

      cards.forEach((card) => {
        const cat = card.dataset.category;
        if (filter === "all" || cat === filter) {
          card.style.display = "";
          visible++;
        } else {
          card.style.display = "none";
        }
      });

      if (empty) {
        empty.classList.toggle("hidden", visible > 0);
      }
    });
  });
});

// Quote modal
function openQuoteModal(productId, productTitle, imagePath) {
  const modal = document.getElementById("quote-modal");
  document.getElementById("modal-title").textContent =
    "Orçamento: " + productTitle;
  document.getElementById("modal-product-name").textContent = productTitle;
  document.getElementById("ref-product-id").dataset.modalId = productId;

  const thumb = document.getElementById("modal-thumb");
  if (imagePath) {
    thumb.innerHTML =
      '<img src="/static/' +
      imagePath +
      '" alt="" class="w-full h-full object-cover">';
  } else {
    thumb.innerHTML =
      '<span class="text-surface-500 text-xs flex items-center justify-center h-full">Sem imagem</span>';
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeQuoteModal() {
  const modal = document.getElementById("quote-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
}

document.getElementById("quote-modal")?.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeQuoteModal();
});
