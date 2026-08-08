import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products.js';
import suppliersRouter from './routes/suppliers.js';
import usersRouter from './routes/users.js';
import inventoryRouter from './routes/inventory.js';
import ordersRouter from './routes/orders.js';
import ocrRouter from './routes/ocr.js';
import { uploadsDir } from './services/uploads.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/users', usersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/ocr', ocrRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
