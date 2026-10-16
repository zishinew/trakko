import { workspace } from '@/lib/data';
import { demoMode, feeBasisPoints } from '@/lib/config';
import { Settings } from '@/components/settings';
export default async function Page() {
  return (
    <Settings
      data={await workspace()}
      demo={demoMode}
      feePercent={String(feeBasisPoints() / 100)}
    />
  );
}
