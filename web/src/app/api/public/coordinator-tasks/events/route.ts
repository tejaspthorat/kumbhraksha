import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publicTaskRateLimit } from "@/lib/publicTaskRateLimit";
import { getClientIp, hashClientIp } from "@/lib/publicTaskIp";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const ipHash = hashClientIp(ip);
  if (!publicTaskRateLimit(`public:events:${ipHash ?? "unknown"}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 });
  }

  const events = await prisma.event.findMany({
    where: { allowPublicTasks: true },
    select: {
      id: true,
      name: true,
      location: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: events });
}
