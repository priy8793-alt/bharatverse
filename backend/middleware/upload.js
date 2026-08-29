const multer = require("multer");
const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = /^\.[a-z0-9]{2,5}$/.test(ext) ? ext : "";
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (file.fieldname === "image" || file.fieldname === "images") {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported image type: ${file.mimetype}`));
    }
  } else if (file.fieldname === "audio") {
    if (!ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported audio type: ${file.mimetype}`));
    }
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: Math.max(MAX_IMAGE_BYTES, MAX_AUDIO_BYTES) },
});

module.exports = { upload, UPLOAD_DIR, MAX_IMAGE_BYTES, MAX_AUDIO_BYTES };
