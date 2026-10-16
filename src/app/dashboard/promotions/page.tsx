import { workspace } from '@/lib/data';
import { Promotions } from '@/components/producer-tools';
export default async function Page() {
  return <Promotions data={await workspace()} />;
}
