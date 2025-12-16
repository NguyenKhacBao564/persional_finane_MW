import { Router } from 'express';
import { openaiClient } from '../../services/openaiClient.js';

// AI module bridges business data with OpenAI for categorization + insights.
const router = Router();

router.get('/insights', async (_req, res) => {
  // Placeholder to show where AI prompts/results will live.
  const mockInsight = await openaiClient.mockInsight();
  res.json(mockInsight);
});

export default { router };
