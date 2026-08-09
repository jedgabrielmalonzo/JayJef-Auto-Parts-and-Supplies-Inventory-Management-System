import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';

export const productUploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads', 'products');

if (!existsSync(productUploadsDir)) mkdirSync(productUploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: productUploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});
