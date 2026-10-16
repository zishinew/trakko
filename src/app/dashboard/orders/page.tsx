import { Suspense } from 'react';
import { workspace } from '@/lib/data';
import { Orders } from '@/components/orders';
export default async function Page() {
  return (
    <Suspense>
      <Orders data={await workspace()} />
    </Suspense>
  );
}
