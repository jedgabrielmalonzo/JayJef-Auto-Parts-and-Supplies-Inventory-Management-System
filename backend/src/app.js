import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import suppliersRouter from './routes/suppliers.js';
import usersRouter from './routes/users.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';
import ocrRouter from './routes/ocr.js';
import shopLayoutRouter from './routes/shopLayout.js';
import dashboardRouter from './routes/dashboard.js';
import reportsRouter from './routes/reports.js';
import shopSettingsRouter from './routes/shopSettings.js';
import { uploadsDir } from './services/uploads.js';
import { productUploadsDir } from './services/productUploads.js';

export const app = express();

app.use(cors());
app.use(express.json());
// Each resource's images live in their own uploads subdirectory; the mount
// prefix matches the stored image_path convention (/uploads/<resource>/...)
// exactly so served URLs and DB-stored paths never drift apart.
app.use('/uploads/receipts', express.static(uploadsDir));
app.use('/uploads/products', express.static(productUploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ocr', ocrRouter);
app.use('/api/shop-layout', shopLayoutRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/shop-settings', shopSettingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
