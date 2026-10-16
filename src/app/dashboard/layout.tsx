import { workspace } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { DashboardShell } from '@/components/dashboard-shell';
export const dynamic = 'force-dynamic';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const data = await workspace();
  return (
    <DashboardShell store={data.store} demo={demoMode}>
      {children}
    </DashboardShell>
  );
}
