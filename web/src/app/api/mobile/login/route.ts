import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

/**
 * POST /api/mobile/login — Coordinator mobile login.
 * Returns a signed JWT containing staffId and role.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff) {
      return NextResponse.json({ error: 'Coordinator not found' }, { status: 404 });
    }

    if (staff.staffRole !== 'COORDINATOR') {
      return NextResponse.json(
        { error: 'Access restricted to coordinators' },
        { status: 403 }
      );
    }

    if (!staff.password) {
      return NextResponse.json(
        { error: 'No password set for this account' },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, staff.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = jwt.sign(
      { staffId: staff.id, role: staff.staffRole },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        staffRole: staff.staffRole,
        zoneId: staff.zoneId,
      },
    });
  } catch (err) {
    console.error('[POST /api/mobile/login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
