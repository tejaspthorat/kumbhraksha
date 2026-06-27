"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../lib/mockData");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    try {
        const response = await fetch(`${backendUrl}/api/cameras`);
        if (!response.ok) {
            console.warn('Python backend fetch failed, using mock data');
            return res.json(mockData_1.cameras);
        }
        const data = await response.json();
        return res.json(data);
    }
    catch (error) {
        console.warn('Camera fetch error, using mock data:', error);
        return res.json(mockData_1.cameras);
    }
});
router.post('/', async (req, res) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    try {
        const body = req.body;
        const response = await fetch(`${backendUrl}/api/cameras`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        return res.status(response.status).json(data);
    }
    catch (error) {
        console.error('Camera creation error:', error);
        return res.status(500).json({ error: 'Failed to create camera on backend' });
    }
});
exports.default = router;
