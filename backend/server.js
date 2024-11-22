const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, "../frontend")));

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Configure multer with file filter
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowedTypes.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only images, PDFs, and documents are allowed"
        )
      );
    }
  },
});

// Routes for pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.get("/my-files", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/my-files.html"));
});

app.get("/shared", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/shared.html"));
});

// File upload endpoints
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({
    message: "File uploaded successfully",
    file: req.file,
  });
});

app.post("/upload-many", upload.array("files", 12), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  res.json({
    message: "Files uploaded successfully",
    files: req.files,
  });
});

// Get files endpoint
app.get("/api/files", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    return res.json([]); // Return empty array if directory was just created
  }

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).json({ error: "Failed to read files" });
    }

    const fileDetails = files.map((filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        modifiedDate: stats.mtime,
        path: `/uploads/${filename}`,
      };
    });

    res.json(fileDetails);
  });
});

// Delete file endpoint
app.delete("/api/files/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "uploads", filename);

  fs.unlink(filepath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
      return res.status(500).json({ error: "Failed to delete file" });
    }
    res.json({ message: "File deleted successfully" });
  });
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Add this new endpoint
app.get("/api/analytics", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  try {
    // Get all files
    const files = fs.readdirSync(uploadsDir).map((filename) => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        name: filename,
        size: stats.size,
        modifiedDate: stats.mtime,
      };
    });

    // Calculate storage metrics
    const totalSpace = 1024 * 1024 * 1024 * 10; // 10GB example limit
    const usedSpace = files.reduce((acc, file) => acc + file.size, 0);

    // Calculate file type distribution
    const fileTypes = files.reduce((acc, file) => {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!acc[ext]) {
        acc[ext] = { count: 0, size: 0 };
      }
      acc[ext].count++;
      acc[ext].size += file.size;
      return acc;
    }, {});

    // Get recent files (last 20)
    const recentFiles = files
      .sort((a, b) => b.modifiedDate - a.modifiedDate)
      .slice(0, 20);

    // Mock storage trends (you might want to implement actual tracking)
    const storageTrends = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
      used: usedSpace * (1 - i * 0.1), // Mock decreasing usage
    })).reverse();

    res.json({
      storage: {
        total: totalSpace,
        used: usedSpace,
        free: totalSpace - usedSpace,
      },
      fileTypes,
      recentFiles,
      storageTrends,
    });
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: err.message || "Something went wrong!",
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
