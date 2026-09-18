import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';

export const uploadsDir = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
  ? path.join('/tmp', 'uploads', 'receipts')
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads', 'receipts');

try {
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn('[Uploads] Temp dir initialization:', err.message);
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

export const uploadReceiptImage = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});
