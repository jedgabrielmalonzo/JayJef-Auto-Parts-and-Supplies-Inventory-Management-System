import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';

export const productUploadsDir = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join('/tmp', 'uploads', 'products')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads', 'products');

try {
  if (!existsSync(productUploadsDir)) mkdirSync(productUploadsDir, { recursive: true });
} catch (err) {
  console.warn('[ProductUploads] Temp dir initialization:', err.message);
}

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
