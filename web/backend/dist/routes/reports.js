"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    const date = req.query.date;
    const days = req.query.days || '7';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    try {
        let url = `${backendUrl}/api/reports/daily`;
        if (date) {
            url += `?date=${date}`;
        }
        else {
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
    }
    catch (error) {
        console.error('Reports fetch error:', error);
        return res.status(500).json({
            success: false,
            error: 'Network error'
        });
    }
});
exports.default = router;
