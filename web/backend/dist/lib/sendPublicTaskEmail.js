"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPublicTaskConfirmationEmail = sendPublicTaskConfirmationEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
function getTransport() {
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });
}
async function sendPublicTaskConfirmationEmail(params) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("[public-task-email] SMTP not configured; skipping creator email");
        return;
    }
    const html = `
    <!DOCTYPE html>
    <html><body style="font-family:system-ui,sans-serif;background:#0a0a0c;color:#e4e4e7;padding:24px;">
      <p>Your task request was received: <strong>${escapeHtml(params.taskTitle)}</strong></p>
      <p>You can review or update the description using this private link (do not share):</p>
      <p><a href="${params.editUrl}" style="color:#34d399;">Open task link</a></p>
      <p style="font-size:12px;color:#71717a;">Reference: ${escapeHtml(params.taskId)}</p>
    </body></html>`;
    await getTransport().sendMail({
        from: `"Crowd CMS" <${process.env.SMTP_USER}>`,
        to: params.to,
        subject: `Task request received: ${params.taskTitle.slice(0, 60)}`,
        html,
    });
}
function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
