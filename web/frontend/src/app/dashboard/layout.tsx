import DashboardLayout from '@/components/layout/DashboardLayout';
import OrchestratorClient from './OrchestratorClient';

// Role-based access removed for now — the dashboard renders without a profile/role
// lookup (which previously crashed when the Profile table was absent).
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <OrchestratorClient />
      {children}
    </DashboardLayout>
  );
}
