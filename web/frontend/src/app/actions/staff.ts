"use server";

import { sendStaffWelcomeEmail } from "@/lib/sendStaffEmail";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const STAFF_PASSWORD_SALT_ROUNDS = 12;

// Auth removed — actions run as the shared Control Room identity.
const CONTROL_ROOM_ID = "control-room";

function generatePassword(length = 8) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charsetLength = charset.length;
  
  // Create an array to hold our secure random numbers. 
  // Uint32Array is used to practically eliminate "modulo bias".
  const randomValues = new Uint32Array(length);
  
  // Populate the array with cryptographically secure values
  crypto.getRandomValues(randomValues);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    // Map the random number to an index in our charset
    password += charset[randomValues[i] % charsetLength];
  }
  
  return password;
}

export async function createStaff(data: {
  email: string;
  name: string;
  role: string;
  staffRole?: string;
  zoneId: number;
  avatar: string;
}) {
  const adminId = CONTROL_ROOM_ID;
  const password = generatePassword(8);

  // 1. Check if user already exists in the Profile table
  const existingProfile = await prisma.profile.findUnique({
    where: { email: data.email },
  });

  if (existingProfile) {
    throw new Error(`Email ${data.email} is already registered in the system.`);
  }

  // 2. Local user id (no external auth provider)
  const userId = crypto.randomUUID();

  // 3. Create Profile and Staff in a transaction
  try {
    await prisma.$transaction([
      prisma.profile.upsert({
        where: { email: data.email },
        update: {
          name: data.name,
          role: "STAFF",
        },
        create: {
          id: userId,
          email: data.email,
          name: data.name,
          role: "STAFF",
        },
      }),
      prisma.staff.create({
        data: {
          userId,
          email: data.email,
          name: data.name,
          role: data.role,
          staffRole: (data.staffRole as any) || "COORDINATOR",
          zoneId: data.zoneId,
          profileId: adminId,
          avatar: data.avatar,
          password: await bcrypt.hash(password, STAFF_PASSWORD_SALT_ROUNDS),
          lastSeen: "Just now",
          status: "active",
          tasks: 0,
        },
      }),
    ]);
    
    // 3. Send welcome email via Resend
    try {
      const zone = await prisma.zone.findUnique({ where: { id: data.zoneId } });
      await sendStaffWelcomeEmail({
        email: data.email,
        password: password,
        role: data.role,
        zone: zone?.name || 'Unassigned',
      });
    } catch (emailError) {
      console.error("Staff created but email failed to send:", emailError);
    }

    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (err: any) {
    console.error("DB error:", err);
    throw new Error("Failed to create staff record in database.");
  }
}

export async function updateStaff(id: number, data: any) {
  try {
    const updated = await prisma.staff.update({
      where: { id },
      data,
    });
    
    if (updated.userId && (data.name || data.email)) {
      await prisma.profile.update({
        where: { id: updated.userId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        }
      });
    }

    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (err: any) {
    throw new Error("Failed to update staff.");
  }
}

export async function deleteStaff(id: number) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      select: { userId: true, email: true, name: true },
    });

    if (staff) {
      // 1. Delete Profile
      if (staff.email) {
        await prisma.profile.deleteMany({
          where: { email: staff.email }
        });
      }

      // 3. Delete associated Tasks (Cascade manually)
      if (staff.name) {
        await prisma.staffTask.deleteMany({
          where: { assignee: staff.name }
        });
      }
    }

    await prisma.staff.delete({
      where: { id },
    });

    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (err: any) {
    console.error("Delete error:", err);
    throw new Error("Failed to delete staff.");
  }
}
