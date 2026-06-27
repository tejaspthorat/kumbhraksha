import { Router, Request, Response } from 'express';
import { allAlerts } from '../lib/mockData';

const router = Router();

function pythonBackendUrl() {
  return (
    process.env.FASTAPI_URL ||
    process.env.PYTHON_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '');
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/alerts`);
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

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/alerts/stats`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.warn('Alert stats fetch error:', error);
    return res.json({
      total: allAlerts.length,
      active: allAlerts.filter((alert) => !alert.resolved).length,
      critical: allAlerts.filter((alert) => alert.level === 'danger').length,
      warning: allAlerts.filter((alert) => alert.level === 'warning').length,
      by_type: {},
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Alert creation error:', error);
    return res.status(500).json({ error: 'Failed to create alert on backend' });
  }
});

async function resolveAlert(req: Request, res: Response) {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/alerts/${req.params.alertId}/resolve`, {
      method: 'PUT',
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Alert resolve error:', error);
    return res.status(500).json({ error: 'Failed to resolve alert on backend' });
  }
}

router.put('/:alertId/resolve', resolveAlert);
router.patch('/:alertId/resolve', resolveAlert);

export default router;
