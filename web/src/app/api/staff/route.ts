import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

/**
 * POST /api/staff — Create a new coordinator account (admin action).
 * Hashes password server-side before storing.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, zoneId, profileId, role, avatar } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'name, email and password are required' },
        { status: 400 }
      );
    }

    if (!zoneId || !profileId) {
      return NextResponse.json(
        { error: 'zoneId and profileId are required' },
        { status: 400 }
      );
    }

    // Guard: reject if email already exists
    const existing = await prisma.staff.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        password: hashedPassword,
        staffRole: 'COORDINATOR',
        role: role || 'Coordinator',
        status: 'active',
        avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        lastSeen: new Date().toISOString(),
        zoneId: Number(zoneId),
        profileId,
      },
      // Never return the password hash to the client
      select: {
        id: true,
        name: true,
        email: true,
        staffRole: true,
        zoneId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (err) {
    console.error('[POST /api/staff]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/staff — List coordinators for task-assignment dropdowns.
 */
export async function GET() {
  try {
    const coordinators = await prisma.staff.findMany({
      where: { staffRole: 'COORDINATOR' },
      select: {
        id: true,
        name: true,
        email: true,
        zoneId: true,
        staffRole: true,
        status: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(coordinators);
  } catch (err) {
    console.error('[GET /api/staff]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
