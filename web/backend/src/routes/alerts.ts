import { Router, Request, Response } from 'express';
import { allAlerts } from '../lib/mockData';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  try {
    const response = await fetch(`${backendUrl}/api/alerts`);
    if (!response.ok) {
      console.warn('Python backend fetch failed, using mock data');
      return res.json(allAlerts);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.warn('Alert fetch error, using mock data:', error);
    return res.json(allAlerts);
  }
});

export default router;
