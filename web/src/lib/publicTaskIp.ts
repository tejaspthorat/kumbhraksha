import crypto from "crypto";
import type { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    return fwd.split(",")[0]?.trim() || null;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return null;
}

export function hashClientIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.PUBLIC_TASK_IP_SALT || "dev-public-task-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`, "utf8").digest("hex");
}
