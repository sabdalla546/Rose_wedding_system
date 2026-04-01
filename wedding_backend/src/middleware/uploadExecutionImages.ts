import fs from "fs";
import path from "path";
import multer from "multer";
import { Request } from "express";

const baseUploadDir = path.join(process.cwd(), "uploads", "execution-details");

if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, baseUploadDir);
  },
  filename: (_req: Request, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path.basename(file.originalname || "file", ext);
    const safeBase = sanitizeFileName(base || "file");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${safeBase}${ext}`);
  },
});

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    cb(new Error("Only JPG, JPEG, PNG, and WEBP images are allowed"));
    return;
  }

  cb(null, true);
};

export const uploadExecutionImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
