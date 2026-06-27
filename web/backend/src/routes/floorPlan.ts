import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { AuthenticatedRequest, requireAdminAuth } from '../middleware/auth';

const router = Router();

// Apply admin auth middleware
router.use(requireAdminAuth);

// ─── Room type mappings ──────────────────────────────────────────────────────

const ROOM_TYPE_TO_PRISMA: Record<string, string> = {
  'General Area': 'GeneralArea',
  'Meeting Room': 'MeetingRoom',
  'Restroom': 'Restroom',
  'Kitchen / Pantry': 'KitchenPantry',
  'Storage': 'Storage',
  'Emergency Exit': 'EmergencyExit',
  'Reception / Lobby': 'ReceptionLobby',
  'Server Room': 'ServerRoom',
  'Open Workspace': 'OpenWorkspace',
  'Auditorium / Hall': 'AuditoriumHall',
};

const PRISMA_TO_ROOM_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(ROOM_TYPE_TO_PRISMA).map(([k, v]) => [v, k])
);

const USER_STATUS_TO_PRISMA: Record<string, string> = {
  available: 'available',
  assigned: 'assigned',
  'checked-in': 'checked_in',
};

const PRISMA_TO_USER_STATUS: Record<string, string> = {
  available: 'available',
  assigned: 'assigned',
  checked_in: 'checked-in',
};

// ─── GET: Load floor plan ────────────────────────────────────────────────────

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const planId = req.query.id as string | undefined;

    if (planId) {
      // Load specific floor plan
      const plan = await (prisma as any).floorPlan.findUnique({
        where: { id: planId },
        include: {
          floors: {
            orderBy: { order: 'asc' },
            include: {
              rooms: true,
              entryPoints: true,
              corridors: true,
              evacuationRoutes: true,
            },
          },
          users: true,
          assets: true,
        },
      });

      if (!plan) {
        return res.status(404).json({ error: 'Floor plan not found' });
      }

      // Map from Prisma to store format
      const storeData = {
        id: plan.id,
        name: plan.name,
        floors: plan.floors.map((floor: any) => ({
          id: floor.id,
          name: floor.name,
          order: floor.order,
          scale: floor.scale,
          backgroundImage: floor.backgroundImage ?? undefined,
          rooms: floor.rooms.map((room: any) => ({
            id: room.id,
            name: room.name,
            type: PRISMA_TO_ROOM_TYPE[room.type] ?? 'General Area',
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            color: room.color,
            notes: room.notes ?? undefined,
            alertThreshold: room.alertThreshold,
            currentOccupancy: room.currentOccupancy,
            capacity: room.capacity,
            assignedUserIds: room.assignedUserIds,
            assetIds: [] as string[],
            floorId: floor.id,
          })),
          entryPoints: floor.entryPoints.map((ep: any) => ({
            id: ep.id,
            x: ep.x,
            y: ep.y,
            label: ep.label ?? undefined,
          })),
          corridors: floor.corridors.map((c: any) => ({
            id: c.id,
            fromRoomId: c.fromRoomId,
            toRoomId: c.toRoomId,
            width: c.width,
            type: c.type,
            fromX: c.fromX,
            fromY: c.fromY,
            toX: c.toX,
            toY: c.toY,
          })),
          evacuationRoutes: floor.evacuationRoutes.map((er: any) => ({
            id: er.id,
            points: er.points,
          })),
        })),
        users: plan.users.map((u: any) => ({
          id: u.id,
          name: u.name,
          role: u.role,
          email: u.email ?? undefined,
          status: PRISMA_TO_USER_STATUS[u.status] ?? 'available',
          assignedRoomId: u.assignedRoomId ?? undefined,
          assignedFloorId: u.assignedFloorId ?? undefined,
          staffId: u.staffId ?? undefined,
        })),
        assets: plan.assets.map((a: any) => ({
          id: a.id,
          type: a.type,
          x: a.x,
          y: a.y,
          rotation: a.rotation,
          roomId: a.roomId,
          floorId: a.floorLevelId,
          reducesArea: a.reducesArea,
          areaReduction: a.areaReduction,
        })),
        note: plan.note ?? undefined,
        totalCapacity: plan.totalCapacity,
        totalCheckedIn: plan.totalCheckedIn,
        totalAlerts: plan.totalAlerts,
      };

      return res.json(storeData);
    }

    // List floor plans for the user
    const plans = await (prisma as any).floorPlan.findMany({
      where: { profileId: req.user?.id },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { floors: true, users: true } },
      },
    });

    return res.json(plans);
  } catch (error) {
    console.error('Floor plan GET error:', error);
    return res.status(500).json({ error: 'Failed to load floor plan' });
  }
});

// ─── POST: Create new floor plan ─────────────────────────────────────────────

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, floors, users, assets } = req.body;

    // Generate mapping of old IDs to new UUIDs to avoid collisions
    const idMap = new Map<string, string>();
    const getNewId = (oldId: string | null | undefined) => {
      if (!oldId) return null;
      if (!idMap.has(oldId)) idMap.set(oldId, crypto.randomUUID());
      return idMap.get(oldId)!;
    };

    const plan = await (prisma as any).floorPlan.create({
      data: {
        profileId: userId,
        name: name ?? 'My Floor Plan',
        description: description ?? null,
        floors: {
          create: (floors ?? []).map((floor: any, idx: number) => ({
            id: getNewId(floor.id),
            name: floor.name ?? `Floor ${idx + 1}`,
            order: floor.order ?? idx + 1,
            scale: floor.scale ?? 1,
            backgroundImage: floor.backgroundImage ?? null,
            rooms: {
              create: (floor.rooms ?? []).map((room: any) => ({
                id: getNewId(room.id),
                name: room.name,
                type: ROOM_TYPE_TO_PRISMA[room.type] ?? 'GeneralArea',
                x: room.x,
                y: room.y,
                width: room.width,
                height: room.height,
                color: room.color,
                notes: room.notes ?? null,
                alertThreshold: room.alertThreshold ?? 85,
                currentOccupancy: room.currentOccupancy ?? 0,
                capacity: room.capacity ?? 0,
                assignedUserIds: (room.assignedUserIds ?? []).map((uid: string) => getNewId(uid)),
              })),
            },
            entryPoints: {
              create: (floor.entryPoints ?? []).map((ep: any) => ({
                id: getNewId(ep.id),
                x: ep.x,
                y: ep.y,
                label: ep.label ?? null,
              })),
            },
            corridors: {
              create: (floor.corridors ?? []).map((c: any) => ({
                id: getNewId(c.id),
                fromRoomId: getNewId(c.fromRoomId)!,
                toRoomId: getNewId(c.toRoomId)!,
                width: c.width ?? 1,
                type: c.type ?? 'general',
                fromX: c.fromX ?? 0,
                fromY: c.fromY ?? 0,
                toX: c.toX ?? 0,
                toY: c.toY ?? 0,
              })),
            },
            evacuationRoutes: {
              create: (floor.evacuationRoutes ?? []).map((er: any) => ({
                id: getNewId(er.id),
                points: er.points ?? [],
              })),
            },
          })),
        },
        users: {
          create: (users ?? []).map((u: any) => ({
            id: getNewId(u.id),
            name: u.name,
            role: u.role ?? 'Staff',
            email: u.email ?? null,
            status: USER_STATUS_TO_PRISMA[u.status] ?? 'available',
            assignedRoomId: getNewId(u.assignedRoomId),
            assignedFloorId: getNewId(u.assignedFloorId),
            staffId: u.staffId ? Number(u.staffId) : null,
          })),
        },
        assets: {
          create: (assets ?? []).map((a: any) => ({
            id: getNewId(a.id),
            type: a.type,
            x: a.x,
            y: a.y,
            rotation: a.rotation ?? 0,
            roomId: getNewId(a.roomId)!,
            floorLevelId: getNewId(a.floorId)!,
            reducesArea: a.reducesArea ?? false,
            areaReduction: a.areaReduction ?? 0,
          })),
        },
        // Store aggregates if provided
        note: req.body.note ?? null,
        totalCapacity: req.body.totalCapacity ?? 0,
        totalCheckedIn: req.body.totalCheckedIn ?? 0,
        totalAlerts: req.body.totalAlerts ?? 0,
      },
      select: { id: true, name: true, createdAt: true },
    });

    return res.status(201).json(plan);
  } catch (error) {
    console.error('Floor plan POST error:', error);
    return res.status(500).json({ error: 'Failed to create floor plan' });
  }
});

// ─── PUT: Full save (delete + recreate children for simplicity) ──────────────

router.put('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, name, description, floors, users, assets } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Missing floor plan id' });
    }

    // Use transaction to atomically replace all children
    const result = await prisma.$transaction(async (tx) => {
      // Delete all children first
      await (tx as any).floorPlanEvacuationRoute.deleteMany({ where: { floorLevel: { floorPlanId: id } } });
      await (tx as any).floorPlanCorridor.deleteMany({ where: { floorLevel: { floorPlanId: id } } });
      await (tx as any).floorPlanEntryPoint.deleteMany({ where: { floorLevel: { floorPlanId: id } } });
      await (tx as any).floorPlanRoom.deleteMany({ where: { floorLevel: { floorPlanId: id } } });
      await (tx as any).floorLevel.deleteMany({ where: { floorPlanId: id } });
      await (tx as any).floorPlanUser.deleteMany({ where: { floorPlanId: id } });
      await (tx as any).floorPlanAsset.deleteMany({ where: { floorPlanId: id } });

      // Update the plan and recreate children
      return (tx as any).floorPlan.update({
        where: { id },
        data: {
          profileId: userId,
          name: name ?? undefined,
          description: description ?? undefined,
          floors: {
            create: (floors ?? []).map((floor: any, idx: number) => ({
              id: floor.id,
              name: floor.name ?? `Floor ${idx + 1}`,
              order: floor.order ?? idx + 1,
              scale: floor.scale ?? 1,
              backgroundImage: floor.backgroundImage ?? null,
              rooms: {
                create: (floor.rooms ?? []).map((room: any) => ({
                  id: room.id,
                  name: room.name,
                  type: ROOM_TYPE_TO_PRISMA[room.type] ?? 'GeneralArea',
                  x: room.x,
                  y: room.y,
                  width: room.width,
                  height: room.height,
                  color: room.color,
                  notes: room.notes ?? null,
                  alertThreshold: room.alertThreshold ?? 85,
                  currentOccupancy: room.currentOccupancy ?? 0,
                  assignedUserIds: room.assignedUserIds ?? [],
                  capacity: room.capacity ?? 0,
                })),
              },
              entryPoints: {
                create: (floor.entryPoints ?? []).map((ep: any) => ({
                  id: ep.id,
                  x: ep.x,
                  y: ep.y,
                  label: ep.label ?? null,
                })),
              },
              corridors: {
                create: (floor.corridors ?? []).map((c: any) => ({
                  id: c.id,
                  fromRoomId: c.fromRoomId,
                  toRoomId: c.toRoomId,
                  width: c.width ?? 1,
                  type: c.type ?? 'general',
                  fromX: c.fromX ?? 0,
                  fromY: c.fromY ?? 0,
                  toX: c.toX ?? 0,
                  toY: c.toY ?? 0,
                })),
              },
              evacuationRoutes: {
                create: (floor.evacuationRoutes ?? []).map((er: any) => ({
                  id: er.id,
                  points: er.points ?? [],
                })),
              },
            })),
          },
          users: {
            create: (users ?? []).map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role ?? 'Staff',
              email: u.email ?? null,
              status: USER_STATUS_TO_PRISMA[u.status] ?? 'available',
              assignedRoomId: u.assignedRoomId ?? null,
              assignedFloorId: u.assignedFloorId ?? null,
              staffId: u.staffId ? Number(u.staffId) : null,
            })),
          },
          assets: {
            create: (assets ?? []).map((a: any) => ({
              id: a.id,
              type: a.type,
              x: a.x,
              y: a.y,
              rotation: a.rotation ?? 0,
              roomId: a.roomId,
              floorLevelId: a.floorId,
              reducesArea: a.reducesArea ?? false,
              areaReduction: a.areaReduction ?? 0,
            })),
          },
          // Update aggregates
          note: req.body.note ?? undefined,
          totalCapacity: req.body.totalCapacity ?? 0,
          totalCheckedIn: req.body.totalCheckedIn ?? 0,
          totalAlerts: req.body.totalAlerts ?? 0,
        },
        select: { id: true, name: true, updatedAt: true },
      });
    });

    return res.json(result);
  } catch (error) {
    console.error('Floor plan PUT error:', error);
    return res.status(500).json({ error: 'Failed to save floor plan' });
  }
});

// ─── DELETE: Remove floor plan ───────────────────────────────────────────────

router.delete('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.query.id as string | undefined;

    if (!id) {
      return res.status(400).json({ error: 'Missing floor plan id' });
    }

    await (prisma as any).floorPlan.delete({ where: { id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Floor plan DELETE error:', error);
    return res.status(500).json({ error: 'Failed to delete floor plan' });
  }
});

export default router;
