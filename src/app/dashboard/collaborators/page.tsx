import { workspace } from '@/lib/data';
import { Collaborators } from '@/components/producer-tools';
export default async function Page() {
  return <Collaborators data={await workspace()} />;
}
