"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mockData_1 = require("../lib/mockData");
const router = (0, express_1.Router)();
router.get('/', async (_req, res) => {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    try {
        const response = await fetch(`${backendUrl}/api/alerts`);
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
exports.default = router;
