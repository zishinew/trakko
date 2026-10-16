import { workspace } from '@/lib/data';
import { demoMode, appUrl } from '@/lib/config';
import { StoreEditor } from '@/components/store-editor';
export default async function Page() {
  return <StoreEditor data={await workspace()} demo={demoMode} origin={appUrl()} />;
}
