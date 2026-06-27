import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';
import { generatePredictions, generateSuggestions, generateDecisions } from '../lib/groqService';

const router = Router();

router.use(requireAdminAuth);

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'Missing type or payload' });
    }

    if (type === 'predictions') {
      const result = await generatePredictions(payload);
      return res.json(result);
    } 
    else if (type === 'suggestions') {
      const { densityData, predictions } = payload;
      if (!densityData || !predictions) {
        return res.status(400).json({ error: 'Missing densityData or predictions in payload' });
      }
      const result = await generateSuggestions(densityData, predictions);
      return res.json(result);
    } 
    else if (type === 'decisions') {
      const { suggestions, densityData } = payload;
      if (!suggestions || !densityData) {
        return res.status(400).json({ error: 'Missing suggestions or densityData in payload' });
      }
      const result = await generateDecisions(suggestions, densityData);
      return res.json(result);
    } 
    else {
      return res.status(400).json({ error: `Unknown type: ${type}` });
    }

  } catch (error: any) {
    console.error('Groq API Route Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
