import crypto from "crypto";
import type { Request } from "express";

export function getClientIp(req: Request): string | null {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") {
    return fwd.split(",")[0]?.trim() || null;
  } else if (Array.isArray(fwd)) {
    return fwd[0]?.trim() || null;
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string") return realIp.trim();
  return null;
}

export function hashClientIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.PUBLIC_TASK_IP_SALT || "dev-public-task-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`, "utf8").digest("hex");
}
