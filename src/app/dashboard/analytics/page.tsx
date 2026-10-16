import { workspace } from '@/lib/data';
import { Analytics } from '@/components/producer-tools';
export default async function Page() {
  return <Analytics data={await workspace()} />;
}
