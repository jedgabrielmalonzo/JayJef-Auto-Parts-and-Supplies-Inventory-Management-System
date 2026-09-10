import 'dotenv/config';
import { app } from './app.js';
import { initHotFolderWatcher } from './services/hotFolderWatcher.js';

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  try {
    initHotFolderWatcher();
  } catch (err) {
    console.warn(`[HotFolderWatcher] Deferred initialization: ${err.message}`);
  }
});

