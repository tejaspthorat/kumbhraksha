import { Router, Request, Response } from 'express';
import { cameras as mockCameras } from '../lib/mockData';

const router = Router();

function pythonBackendUrl() {
  return (
    process.env.FASTAPI_URL ||
    process.env.PYTHON_BACKEND_URL ||
    process.env.BACKEND_URL ||
    'http://localhost:5000'
  ).replace(/\/$/, '');
}

async function proxyImage(path: string, res: Response) {
  const response = await fetch(`${pythonBackendUrl()}${path}`);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const cacheControl =
    response.headers.get('cache-control') || 'no-cache, no-store, must-revalidate';
  const bytes = Buffer.from(await response.arrayBuffer());

  res.status(response.status);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', cacheControl);
  return res.send(bytes);
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/cameras`);
    if (!response.ok) {
      console.warn('Python backend fetch failed, using mock data');
      return res.json(mockCameras);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.warn('Camera fetch error, using mock data:', error);
    return res.json(mockCameras);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const response = await fetch(`${pythonBackendUrl()}/api/cameras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Camera creation error:', error);
    return res.status(500).json({ error: 'Failed to create camera on backend' });
  }
});

router.delete('/:cameraId', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/cameras/${req.params.cameraId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Camera delete error:', error);
    return res.status(500).json({ error: 'Failed to delete camera on backend' });
  }
});

router.get('/:cameraId/stats', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${pythonBackendUrl()}/api/cameras/${req.params.cameraId}/stats`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.warn('Camera stats fetch error:', error);
    return res.json({
      count: 0,
      density: 'Low',
      zone_a: 0,
      zone_b: 0,
      fps: 0,
      timestamp: new Date().toISOString(),
    });
  }
});

router.get('/:cameraId/frame', async (req: Request, res: Response) => {
  try {
    return await proxyImage(`/api/cameras/${req.params.cameraId}/frame`, res);
  } catch (error) {
    console.error('Camera frame proxy error:', error);
    return res.status(502).json({ error: 'Failed to fetch camera frame' });
  }
});

router.get('/:cameraId/heatmap', async (req: Request, res: Response) => {
  try {
    return await proxyImage(`/api/cameras/${req.params.cameraId}/heatmap`, res);
  } catch (error) {
    console.error('Camera heatmap proxy error:', error);
    return res.status(502).json({ error: 'Failed to fetch camera heatmap' });
  }
});

export default router;
