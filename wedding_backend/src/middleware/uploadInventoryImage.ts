import fs from "fs";
import path from "path";
import multer from "multer";
import { Request } from "express";

const inventoryUploadDir = path.join(process.cwd(), "uploads", "inventory");

if (!fs.existsSync(inventoryUploadDir)) {
  fs.mkdirSync(inventoryUploadDir, { recursive: true });
}

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, inventoryUploadDir);
  },
  filename: (_req: Request, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "inventory", ext);
    const safeBase = sanitizeFileName(base || "inventory");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error("Only image files are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadInventoryImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
