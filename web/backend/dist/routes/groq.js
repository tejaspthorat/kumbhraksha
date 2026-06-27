"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const groqService_1 = require("../lib/groqService");
const router = (0, express_1.Router)();
router.use(auth_1.requireAdminAuth);
router.post('/', async (req, res) => {
    try {
        const { type, payload } = req.body;
        if (!type || !payload) {
            return res.status(400).json({ error: 'Missing type or payload' });
        }
        if (type === 'predictions') {
            const result = await (0, groqService_1.generatePredictions)(payload);
            return res.json(result);
        }
        else if (type === 'suggestions') {
            const { densityData, predictions } = payload;
            if (!densityData || !predictions) {
                return res.status(400).json({ error: 'Missing densityData or predictions in payload' });
            }
            const result = await (0, groqService_1.generateSuggestions)(densityData, predictions);
            return res.json(result);
        }
        else if (type === 'decisions') {
            const { suggestions, densityData } = payload;
            if (!suggestions || !densityData) {
                return res.status(400).json({ error: 'Missing suggestions or densityData in payload' });
            }
            const result = await (0, groqService_1.generateDecisions)(suggestions, densityData);
            return res.json(result);
        }
        else {
            return res.status(400).json({ error: `Unknown type: ${type}` });
        }
    }
    catch (error) {
        console.error('Groq API Route Error:', error);
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});
exports.default = router;
