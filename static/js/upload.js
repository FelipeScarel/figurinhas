// Drag & Drop file upload with preview
document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("artwork-input");
  const dropContent = document.getElementById("drop-content");
  const previewContainer = document.getElementById("preview-container");
  const previewImg = document.getElementById("preview-img");
  const previewName = document.getElementById("preview-name");

  if (!dropZone || !fileInput) return;

  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Highlight drop zone on drag over
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

  // Handle dropped files
  dropZone.addEventListener("drop", (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFileSelect(files[0]);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      handleFileSelect(fileInput.files[0]);
    }
  });

  function handleFileSelect(file) {
    const allowed = ["png", "jpg", "jpeg", "pdf", "svg", "webp"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!allowed.includes(ext)) {
      alert("Formato não permitido. Use PNG, JPG, PDF, SVG ou WebP.");
      fileInput.value = "";
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 16MB.");
      fileInput.value = "";
      return;
    }

    previewName.textContent = file.name;

    if (ext === "pdf" || ext === "svg") {
      previewImg.src = "";
      previewImg.style.display = "none";
      dropContent.querySelector("p").textContent = "Arquivo " + ext.toUpperCase() + " selecionado";
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "";
      };
      reader.readAsDataURL(file);
    }

    dropContent.classList.add("hidden");
    previewContainer.classList.remove("hidden");
  }
});
