"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
exports.requireMobileAuth = requireMobileAuth;
const mobileAuth_1 = require("../lib/mobileAuth");
/**
 * Middleware that extracts user context from headers passed by the Next.js API Gateway.
 */
function requireAdminAuth(req, res, next) {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
        return;
    }
    req.user = {
        id: userId,
        email: req.headers['x-user-email'],
        name: req.headers['x-user-name'],
        role: req.headers['x-user-role'],
    };
    next();
}
/**
 * Middleware that validates the mobile coordinator's JWT.
 */
function requireMobileAuth(req, res, next) {
    const payload = (0, mobileAuth_1.verifyMobileToken)(req);
    if (!payload) {
        res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
        return;
    }
    req.user = {
        id: String(payload.staffId),
        role: payload.role,
    };
    next();
}
