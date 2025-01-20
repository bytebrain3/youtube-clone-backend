import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define upload directory
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderId = req.folderId || "default"; // Use the folderId passed from `uploadVideo`
    const folderPath = path.join(uploadDir, folderId);

    // Create folder if it doesn't exist
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }

    cb(null, folderPath); // Set the upload destination
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Save with the original filename
  },
});

// File filter to only accept MP4 files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4" || file.mimetype === "video/mpeg" || file.mimetype === "video/quicktime") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only MP4, MPEG, and QuickTime files are allowed."), false);
  }
};


// Configure multer with storage and file filter
const upload = multer({ storage, fileFilter });

export { upload };
