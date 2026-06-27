"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../lib/mockData");
const router = (0, express_1.Router)();
function pythonBackendUrl() {
    return (process.env.FASTAPI_URL ||
        process.env.PYTHON_BACKEND_URL ||
        process.env.BACKEND_URL ||
        'http://localhost:5000').replace(/\/$/, '');
}
router.get('/', async (_req, res) => {
    try {
        const response = await fetch(`${pythonBackendUrl()}/api/alerts`);
        if (!response.ok) {
            console.warn('Python backend fetch failed, using mock data');
            return res.json(mockData_1.allAlerts);
        }
        const data = await response.json();
        return res.json(data);
    }
    catch (error) {
        console.warn('Alert fetch error, using mock data:', error);
        return res.json(mockData_1.allAlerts);
    }
});
router.get('/stats', async (_req, res) => {
    try {
        const response = await fetch(`${pythonBackendUrl()}/api/alerts/stats`);
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.warn('Alert stats fetch error:', error);
        return res.json({
            total: mockData_1.allAlerts.length,
            active: mockData_1.allAlerts.filter((alert) => !alert.resolved).length,
            critical: mockData_1.allAlerts.filter((alert) => alert.level === 'danger').length,
            warning: mockData_1.allAlerts.filter((alert) => alert.level === 'warning').length,
            by_type: {},
        });
    }
});
router.post('/', async (req, res) => {
    try {
        const response = await fetch(`${pythonBackendUrl()}/api/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error('Alert creation error:', error);
        return res.status(500).json({ error: 'Failed to create alert on backend' });
    }
});
async function resolveAlert(req, res) {
    try {
        const response = await fetch(`${pythonBackendUrl()}/api/alerts/${req.params.alertId}/resolve`, {
            method: 'PUT',
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error('Alert resolve error:', error);
        return res.status(500).json({ error: 'Failed to resolve alert on backend' });
    }
}
router.put('/:alertId/resolve', resolveAlert);
router.patch('/:alertId/resolve', resolveAlert);
exports.default = router;
