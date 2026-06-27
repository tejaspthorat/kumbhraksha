import DashboardLayout from '@/components/layout/DashboardLayout';
import OrchestratorClient from './OrchestratorClient';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0].emailAddress;

    const profile = await prisma.profile.findUnique({
      where: { email },
      select: { role: true }
    });

    if (profile?.role === 'STAFF') {
      redirect('/not-allowed');
    }
  }

  return (
    <DashboardLayout>
      <OrchestratorClient />
      {children}
    </DashboardLayout>
  );
}
