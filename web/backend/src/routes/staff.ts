import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';
import { sendStaffWelcomeEmail } from '../lib/sendStaffEmail';

const router = Router();

const STAFF_PASSWORD_SALT_ROUNDS = 12;

// Apply auth middleware to protect staff endpoints
router.use(requireAdminAuth);

/** Cryptographically secure temporary password (no modulo bias). */
function generatePassword(length = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[crypto.randomInt(0, charset.length)];
  }
  return password;
}

/**
 * POST /api/staff — Create a new coordinator account (admin action).
 * Generates a temporary password, provisions a Profile + Staff record in a
 * transaction, and emails the new coordinator their credentials.
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, role, staffRole, zoneId, avatar } = req.body;
    const adminId = req.user!.id;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }
    if (!zoneId) {
      return res.status(400).json({ error: 'zoneId is required' });
    }

    // Guard: reject if email already exists in Profile (matches prior behaviour)
    const existingProfile = await prisma.profile.findUnique({ where: { email } });
    if (existingProfile) {
      return res.status(409).json({ error: `Email ${email} is already registered in the system.` });
    }

    const password = generatePassword(8);
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(password, STAFF_PASSWORD_SALT_ROUNDS);

    await prisma.$transaction([
      prisma.profile.upsert({
        where: { email },
        update: { name, role: 'STAFF' },
        create: { id: userId, email, name, role: 'STAFF' },
      }),
      prisma.staff.create({
        data: {
          userId,
          email,
          name,
          role: role || 'Coordinator',
          staffRole: (staffRole as any) || 'COORDINATOR',
          zoneId: Number(zoneId),
          profileId: adminId,
          avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          password: hashedPassword,
          lastSeen: 'Just now',
          status: 'active',
          tasks: 0,
        },
      }),
    ]);

    // Welcome email is best-effort — never fail staff creation on email errors.
    try {
      const zone = await prisma.zone.findUnique({ where: { id: Number(zoneId) } });
      await sendStaffWelcomeEmail({
        email,
        password,
        role: role || 'Coordinator',
        zone: zone?.name || 'Unassigned',
      });
    } catch (emailError) {
      console.error('[POST /api/staff] Staff created but email failed to send:', emailError);
    }

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('[POST /api/staff]', err);
    return res.status(500).json({ error: 'Failed to create staff record in database.' });
  }
});

/**
 * GET /api/staff — List coordinators.
 */
router.get('/', async (_req: AuthenticatedRequest, res: Response) => {
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
    return res.json(coordinators);
  } catch (err) {
    console.error('[GET /api/staff]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/staff/:id — Update a staff member (and mirror name/email to Profile).
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, email, role, staffRole, zoneId, avatar } = req.body;

    // Only forward fields that were provided, preserving prior partial-update semantics.
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (staffRole !== undefined) data.staffRole = staffRole;
    if (zoneId !== undefined) data.zoneId = Number(zoneId);
    if (avatar !== undefined) data.avatar = avatar;

    const updated = await prisma.staff.update({ where: { id }, data });

    if (updated.userId && (name || email)) {
      await prisma.profile.update({
        where: { id: updated.userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('[PUT /api/staff/:id]', err);
    return res.status(500).json({ error: 'Failed to update staff.' });
  }
});

/**
 * DELETE /api/staff/:id — Remove a staff member, their Profile and their tasks.
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);

    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { userId: true, email: true, name: true },
    });

    if (staff) {
      if (staff.email) {
        await prisma.profile.deleteMany({ where: { email: staff.email } });
      }
      if (staff.name) {
        await prisma.staffTask.deleteMany({ where: { assignee: staff.name } });
      }
    }

    await prisma.staff.delete({ where: { id } });

    return res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/staff/:id]', err);
    return res.status(500).json({ error: 'Failed to delete staff.' });
  }
});

export default router;
