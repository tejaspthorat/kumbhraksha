"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTurnstileToken = verifyTurnstileToken;
/**
 * Cloudflare Turnstile server-side verification.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
async function verifyTurnstileToken(token, remoteip) {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            console.error("[turnstile] TURNSTILE_SECRET_KEY missing in production");
            return false;
        }
        console.warn("[turnstile] TURNSTILE_SECRET_KEY missing; allowing request (dev only)");
        return true;
    }
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (remoteip)
        body.set("remoteip", remoteip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });
    const data = (await res.json());
    return data.success === true;
}
