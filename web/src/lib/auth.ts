"use server";

import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

/**
 * Handle user registration via Clerk and maintain local Profile in Prisma.
 * The user input Role is stored in the Prisma Profile table.
 */
import { redirect } from "next/navigation";

export async function handleLogin(email: string, password: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { email },
  });

  if (!profile || profile.role !== 'ADMIN') {
    throw new Error("Access denied: Admins only.");
  }

  redirect('/dashboard');
}
