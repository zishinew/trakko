import { workspace } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { Overview } from '@/components/overview';
export default async function Page() {
  return <Overview data={await workspace()} demo={demoMode} asOf={new Date().toISOString()} />;
}
