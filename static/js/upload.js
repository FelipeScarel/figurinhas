// Multi-file Drag & Drop upload with previews
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("artwork-input");
  const dropContent = document.getElementById("drop-content");
  const previewContainer = document.getElementById("preview-container");
  const previewGrid = document.getElementById("preview-grid");
  const previewCount = document.getElementById("preview-count");

  if (!dropZone || !fileInput) return;

  const MAX_FILES = 5;
  let selectedFiles = [];

  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add("border-brand-500", "bg-brand-500/5");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove("border-brand-500", "bg-brand-500/5");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  });

  fileInput.addEventListener("change", () => {
    const files = Array.from(fileInput.files);
    addFiles(files);
  });

  function addFiles(newFiles) {
    const allowed = ["png", "jpg", "jpeg", "pdf", "svg", "webp"];

    newFiles.forEach((file) => {
      if (selectedFiles.length >= MAX_FILES) {
        alert(`Máximo de ${MAX_FILES} arquivos.`);
        return;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      if (!allowed.includes(ext)) {
        alert(`Formato "${ext}" não permitido. Use PNG, JPG, PDF, SVG ou WebP.`);
        return;
      }
      if (file.size > 16 * 1024 * 1024) {
        alert(`Arquivo "${file.name}" excede 16MB.`);
        return;
      }
      selectedFiles.push(file);
    });

    updateFileInput();
    renderPreviews();
  }

  function updateFileInput() {
    const dt = new DataTransfer();
    selectedFiles.forEach((f) => dt.items.add(f));
    fileInput.files = dt.files;
  }

  function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileInput();
    renderPreviews();
    if (selectedFiles.length === 0) {
      previewContainer.classList.add("hidden");
      dropContent.classList.remove("hidden");
    }
  }

  function renderPreviews() {
    if (selectedFiles.length === 0) return;

    dropContent.classList.add("hidden");
    previewContainer.classList.remove("hidden");
    previewCount.textContent = `${selectedFiles.length} de ${MAX_FILES} arquivo(s) selecionado(s)`;

    previewGrid.innerHTML = selectedFiles
      .map((file, i) => {
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext === "pdf" || ext === "svg") {
          return `<div class="relative w-20 h-20 bg-surface-700 rounded-lg flex items-center justify-center text-[10px] text-surface-400 uppercase border border-surface-600">
                    ${ext}
                    <button type="button" onclick="this.parentElement.remove();" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-400">x</button>
                  </div>`;
        }
        return `<div class="relative w-20 h-20 rounded-lg overflow-hidden border border-surface-600">
                  <img src="${URL.createObjectURL(file)}" alt="" class="w-full h-full object-cover">
                  <button type="button" onclick="event.stopPropagation(); document.querySelectorAll('#preview-grid > div')[${i}].remove();" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center hover:bg-red-400" data-remove="${i}">x</button>
                </div>`;
      })
      .join("");

    // Attach remove handlers
    previewGrid.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.remove);
        removeFile(idx);
      });
    });
  }
});
