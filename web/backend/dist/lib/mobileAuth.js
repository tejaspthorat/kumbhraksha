"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMobileToken = verifyMobileToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function verifyMobileToken(req) {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer '))
            return null;
        const token = authHeader.split(' ')[1];
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    }
    catch {
        return null;
    }
}
