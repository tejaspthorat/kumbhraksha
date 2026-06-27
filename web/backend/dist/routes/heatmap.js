"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
function pythonBackendUrl() {
    return (process.env.FASTAPI_URL ||
        process.env.PYTHON_BACKEND_URL ||
        process.env.BACKEND_URL ||
        'http://localhost:5000').replace(/\/$/, '');
}
router.get('/data', async (_req, res) => {
    try {
        const response = await fetch(`${pythonBackendUrl()}/api/heatmap/data`);
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.warn('Heatmap data fetch error:', error);
        return res.json({
            cameras: {},
            grid: Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => 0)),
            total_people: 0,
            timestamp: new Date().toISOString(),
        });
    }
});
router.get('/grid', async (req, res) => {
    try {
        const query = new URLSearchParams();
        if (typeof req.query.rows === 'string')
            query.set('rows', req.query.rows);
        if (typeof req.query.cols === 'string')
            query.set('cols', req.query.cols);
        const suffix = query.toString() ? `?${query.toString()}` : '';
        const response = await fetch(`${pythonBackendUrl()}/api/heatmap/grid${suffix}`);
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.warn('Heatmap grid fetch error:', error);
        return res.json({
            grid: Array.from({ length: 20 }, () => Array.from({ length: 20 }, () => 0)),
            rows: 20,
            cols: 20,
            total_people: 0,
            active_cameras: 0,
            timestamp: new Date().toISOString(),
        });
    }
});
exports.default = router;
