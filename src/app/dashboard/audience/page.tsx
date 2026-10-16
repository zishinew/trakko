import { workspace } from '@/lib/data';
import { Audience } from '@/components/producer-tools';
export default async function Page() {
  return <Audience data={await workspace()} />;
}
