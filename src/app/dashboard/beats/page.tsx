import { Suspense } from 'react';
import { workspace } from '@/lib/data';
import { demoMode } from '@/lib/config';
import { BeatManager } from '@/components/beat-manager';
export default async function Page() {
  return (
    <Suspense>
      <BeatManager data={await workspace()} demo={demoMode} />
    </Suspense>
  );
}
