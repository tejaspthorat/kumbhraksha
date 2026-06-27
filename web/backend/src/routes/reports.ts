import { Router, Request, Response } from 'express';

const router = Router();

function pythonBackendUrl() {
  return (
    process.env.FASTAPI_URL ||
    process.env.PYTHON_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '');
}

router.get('/', async (req: Request, res: Response) => {
  const date = req.query.date as string | undefined;
  const days = req.query.days as string || '7';
  
  try {
    let url = `${pythonBackendUrl()}/api/reports/daily`;
    if (date) {
      url += `?date=${date}`;
    } else {
      url += `?days=${days}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn('Backend fetch failed');
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch reports from backend' 
      });
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Reports fetch error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Network error' 
    });
  }
});

export default router;
