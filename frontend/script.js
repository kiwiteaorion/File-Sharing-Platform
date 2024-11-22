document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  const uploadButton = document.querySelector(".upload-button");
  if (uploadButton) {
    uploadButton.addEventListener("click", () => {
      fileInput.click();
    });
  }

  // File input change handler
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Show file name in upload modal
    document.getElementById("selectedFileName").textContent = file.name;
    showModal("uploadModal");

    // Handle upload confirmation
    const confirmButton = document.querySelector("#uploadModal .confirm");
    const cancelButton = document.querySelector("#uploadModal .cancel");

    confirmButton.onclick = async () => {
      hideModal("uploadModal");
      await handleFileUpload(file);
    };

    cancelButton.onclick = () => {
      hideModal("uploadModal");
      fileInput.value = ""; // Clear the file input
    };
  });

  // File upload handler
  async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("File uploaded successfully");
        loadFiles(); // Refresh the file list
      } else {
        const error = await response.json();
        console.error("Upload failed:", error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      fileInput.value = ""; // Clear the file input
    }
  }

  // Load and display files
  async function loadFiles() {
    try {
      const response = await fetch("/api/files");
      const files = await response.json();

      const filesContainer = document.querySelector(".files-container");
      const uploadButton = document.querySelector(".upload-button");
      if (!filesContainer) return;

      // Create the file explorer header
      const explorerHTML = `
          <div class="file-explorer">
              <div class="explorer-header">
                  <div class="header-item">
                      <input type="checkbox" id="selectAll" />
                      <span>Name</span>
                  </div>
                  <div class="header-item sortable" data-sort="size">Size</div>
                  <div class="header-item sortable" data-sort="date">Date modified</div>
                  <div class="header-item">Actions</div>
              </div>
              <div class="explorer-body">
                  ${
                    files.length === 0
                      ? '<div class="no-files">No files uploaded yet</div>'
                      : files
                          .map(
                            (file) => `
                          <div class="file-row" data-filename="${file.name}">
                              <div class="file-cell">
                                  <input type="checkbox" class="file-checkbox" />
                                  <i class="fas ${getFileIcon(file.name)}"></i>
                                  <span>${file.name}</span>
                              </div>
                              <div class="file-cell">${formatFileSize(
                                file.size
                              )}</div>
                              <div class="file-cell">${formatDate(
                                file.modifiedDate
                              )}</div>
                              <div class="file-cell actions">
                                  <button onclick="downloadFile('${
                                    file.name
                                  }')" title="Download">
                                      <i class="fas fa-download"></i>
                                  </button>
                                  <button onclick="deleteFile('${
                                    file.name
                                  }')" title="Delete">
                                      <i class="fas fa-trash"></i>
                                  </button>
                              </div>
                          </div>
                      `
                          )
                          .join("")
                  }
              </div>
          </div>
          ${
            files.length > 0
              ? `
              <div class="bulk-actions">
                  <span class="selected-count">0 selected</span>
                  <button class="bulk-delete" disabled>
                      <i class="fas fa-trash"></i> Delete Selected
                  </button>
              </div>
          `
              : ""
          }
      `;

      filesContainer.innerHTML = explorerHTML;

      // Handle visibility of upload button
      const isHomePage =
        window.location.pathname === "/" ||
        window.location.pathname === "/index.html";
      if (uploadButton) {
        uploadButton.style.display =
          !isHomePage || files.length === 0 ? "inline-flex" : "none";
      }

      // Add event listeners for the new functionality
      setupFileExplorerListeners();
    } catch (error) {
      console.error("Error loading files:", error);
    }
  }

  // Helper functions
  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  function getFileIcon(filename) {
    const extension = filename.split(".").pop().toLowerCase();
    const iconMap = {
      pdf: "fa-file-pdf",
      doc: "fa-file-word",
      docx: "fa-file-word",
      xls: "fa-file-excel",
      xlsx: "fa-file-excel",
      jpg: "fa-file-image",
      jpeg: "fa-file-image",
      png: "fa-file-image",
      gif: "fa-file-image",
    };
    return iconMap[extension] || "fa-file";
  }

  // Initial load
  loadFiles();
});

// Modal functions
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add("active");
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove("active");
}

// Global functions for file actions
function downloadFile(filename) {
  window.open(`/uploads/${filename}`, "_blank");
}

async function deleteFile(filename) {
  document.getElementById("deleteFileName").textContent = filename;
  showModal("deleteModal");

  const deleteButton = document.querySelector("#deleteModal .delete");
  const cancelButton = document.querySelector("#deleteModal .cancel");

  deleteButton.onclick = async () => {
    hideModal("deleteModal");
    try {
      const response = await fetch(`/api/files/${filename}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadFiles(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  cancelButton.onclick = () => {
    hideModal("deleteModal");
  };
}

// Close modals when clicking outside
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
};

// Add these new functions
function setupFileExplorerListeners() {
  const selectAll = document.getElementById("selectAll");
  const fileCheckboxes = document.querySelectorAll(".file-checkbox");
  const bulkDelete = document.querySelector(".bulk-delete");
  const selectedCount = document.querySelector(".selected-count");
  const sortableHeaders = document.querySelectorAll(".sortable");

  if (selectAll) {
    selectAll.addEventListener("change", (e) => {
      fileCheckboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked;
      });
      updateBulkActions();
    });
  }

  fileCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", updateBulkActions);
  });

  sortableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const sortBy = header.dataset.sort;
      sortFiles(sortBy);
    });
  });
}

function updateBulkActions() {
  const selectedFiles = document.querySelectorAll(".file-checkbox:checked");
  const bulkDelete = document.querySelector(".bulk-delete");
  const selectedCount = document.querySelector(".selected-count");
  const selectAll = document.getElementById("selectAll");

  if (bulkDelete && selectedCount) {
    const count = selectedFiles.length;
    selectedCount.textContent = `${count} selected`;
    bulkDelete.disabled = count === 0;

    // Update select all checkbox state
    if (selectAll) {
      const totalFiles = document.querySelectorAll(".file-checkbox").length;
      selectAll.checked = count === totalFiles && count !== 0;
      selectAll.indeterminate = count > 0 && count < totalFiles;
    }
  }
}

async function deleteSelectedFiles() {
  const selectedFiles = document.querySelectorAll(".file-checkbox:checked");
  const fileNames = Array.from(selectedFiles).map(
    (checkbox) => checkbox.closest(".file-row").dataset.filename
  );

  if (confirm(`Are you sure you want to delete ${fileNames.length} files?`)) {
    for (const filename of fileNames) {
      try {
        const response = await fetch(`/api/files/${filename}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          console.error(`Failed to delete ${filename}`);
        }
      } catch (error) {
        console.error(`Error deleting ${filename}:`, error);
      }
    }
    loadFiles(); // Refresh the list
  }
}

function sortFiles(sortBy) {
  const fileRows = Array.from(document.querySelectorAll(".file-row"));
  const container = document.querySelector(".explorer-body");

  if (!container) return;

  fileRows.sort((a, b) => {
    const aValue = a.querySelector(
      `.file-cell:nth-child(${sortBy === "size" ? 2 : 3})`
    ).textContent;
    const bValue = b.querySelector(
      `.file-cell:nth-child(${sortBy === "size" ? 2 : 3})`
    ).textContent;

    if (sortBy === "size") {
      return parseFileSize(bValue) - parseFileSize(aValue);
    }
    return new Date(bValue) - new Date(aValue);
  });

  container.innerHTML = "";
  fileRows.forEach((row) => container.appendChild(row));
}

function parseFileSize(size) {
  const units = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 };
  const [value, unit] = size.split(" ");
  return parseFloat(value) * units[unit];
}
