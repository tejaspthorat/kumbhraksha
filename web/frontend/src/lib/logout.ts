'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function logout(): Promise<void> {
  const { sessionId } = await auth();
  
  if (sessionId) {
    const client = await clerkClient();
    try {
      await client.sessions.revokeSession(sessionId);
    } catch (error) {
      console.error('Failed to revoke session:', error);
    }
  }

  redirect('/login');
}
