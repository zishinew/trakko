import { Landing } from '@/components/landing';
import { demoMode, feeBasisPoints } from '@/lib/config';
export default function Home() {
  return <Landing demo={demoMode} feePercent={String(feeBasisPoints() / 100)} />;
}
