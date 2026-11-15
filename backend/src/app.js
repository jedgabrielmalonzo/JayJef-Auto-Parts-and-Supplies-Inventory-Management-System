import express from 'express';
import cors from 'cors';
import { connectMongo } from './db/mongo.js';
import productsRouter from './routes/products.js';
import inventoryRouter from './routes/inventory.js';
import dashboardRouter from './routes/dashboard.js';
import shopSettingsRouter from './routes/shopSettings.js';
import { productUploadsDir } from './services/productUploads.js';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads/products', express.static(productUploadsDir));

// Ensure MongoDB is connected before handling requests (crucial for Vercel/serverless live hosting)
app.use(async (req, res, next) => {
  try {
    await connectMongo();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({
      error: `Database connection error: ${err.message}. Please verify MONGODB_URI is configured in your live host environment variables.`,
    });
  }
});

const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

apiRouter.use('/products', productsRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/shop-settings', shopSettingsRouter);

// Support both /api/path and /path
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});
