import { Router } from 'express';
import { processChatQuery } from '../services/aiAssistant.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    const result = await processChatQuery(message);
    res.json(result);
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      reply: 'Sorry, I encountered an error checking the inventory database.',
      products: [],
      error: error.message,
    });
  }
});

export default router;
