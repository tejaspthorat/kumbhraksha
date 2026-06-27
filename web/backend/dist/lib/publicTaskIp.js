"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.hashClientIp = hashClientIp;
const crypto_1 = __importDefault(require("crypto"));
function getClientIp(req) {
    const fwd = req.headers["x-forwarded-for"];
    if (typeof fwd === "string") {
        return fwd.split(",")[0]?.trim() || null;
    }
    else if (Array.isArray(fwd)) {
        return fwd[0]?.trim() || null;
    }
    const realIp = req.headers["x-real-ip"];
    if (typeof realIp === "string")
        return realIp.trim();
    return null;
}
function hashClientIp(ip) {
    if (!ip)
        return null;
    const salt = process.env.PUBLIC_TASK_IP_SALT || "dev-public-task-salt";
    return crypto_1.default.createHash("sha256").update(`${salt}:${ip}`, "utf8").digest("hex");
}
