import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { publicTaskRateLimit } from "@/lib/publicTaskRateLimit";
import { getClientIp, hashClientIp } from "@/lib/publicTaskIp";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const ipHash = hashClientIp(ip);
  if (!publicTaskRateLimit(`public:coord:${ipHash ?? "unknown"}`, MAX_PER_WINDOW, WINDOW_MS)) {
    return NextResponse.json({ error: "Too many requests", code: "RATE_LIMITED" }, { status: 429 });
  }

  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return NextResponse.json(
      { error: "eventId query parameter required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, allowPublicTasks: true },
    select: { profileId: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const coordinators = await prisma.staff.findMany({
    where: {
      profileId: event.profileId,
      staffRole: "COORDINATOR",
      status: "active",
    },
    select: {
      id: true,
      name: true,
      avatar: true,
      zone: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({ data: coordinators });
}
