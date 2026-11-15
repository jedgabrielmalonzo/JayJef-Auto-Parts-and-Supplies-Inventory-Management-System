import 'dotenv/config';
import { app } from './app.js';
import { connectMongo } from './db/mongo.js';

const port = process.env.PORT || 4000;

async function start() {
  try {
    await connectMongo();
    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
