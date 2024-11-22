document.addEventListener("DOMContentLoaded", loadAnalytics);

async function loadAnalytics() {
  try {
    const response = await fetch("/api/analytics");
    const data = await response.json();

    updateStorageOverview(data.storage);
    updateFileTypesDistribution(data.fileTypes);
    updateRecentFiles(data.recentFiles);
    updateStorageTrends(data.storageTrends);
  } catch (error) {
    console.error("Error loading analytics:", error);
  }
}

function updateStorageOverview(storage) {
  // Update storage numbers
  document.getElementById("usedSpace").textContent = formatSize(storage.used);
  document.getElementById("freeSpace").textContent = formatSize(storage.free);
  document.getElementById("totalSpace").textContent = formatSize(storage.total);

  // Update storage chart
  const ctx = document.getElementById("storageChart").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Used", "Free"],
      datasets: [
        {
          data: [storage.used, storage.free],
          backgroundColor: ["#6366f1", "#e2e8f0"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      cutout: "75%",
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

function updateFileTypesDistribution(fileTypes) {
  const ctx = document.getElementById("fileTypesChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(fileTypes),
      datasets: [
        {
          label: "Storage Used",
          data: Object.values(fileTypes).map((type) => type.size),
          backgroundColor: "#6366f1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatSize(value),
          },
        },
      },
    },
  });
}

function updateRecentFiles(files) {
  const container = document.getElementById("recentFilesList");
  container.innerHTML = files
    .map(
      (file) => `
        <div class="recent-file">
            <div class="file-icon">
                <i class="fas ${getFileIcon(file.name)}"></i>
            </div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">
                    <span>${formatSize(file.size)}</span>
                    <span>•</span>
                    <span>${formatDate(file.modifiedDate)}</span>
                </div>
            </div>
        </div>
    `
    )
    .join("");
}

function updateStorageTrends(trends) {
  const ctx = document.getElementById("storageTrendsChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: trends.map((t) => t.date),
      datasets: [
        {
          label: "Storage Used",
          data: trends.map((t) => t.used),
          borderColor: "#6366f1",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatSize(value),
          },
        },
      },
    },
  });
}

// Helper functions
function formatSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
