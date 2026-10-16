import { notFound } from 'next/navigation';
import { authorizedOrder, publicReceipt } from '@/lib/purchase';
import { PurchaseReceipt } from '@/components/purchase-receipt';
import { demoMode } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Your purchase',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params,
    { token = '' } = await searchParams;
  const order = await authorizedOrder(id, token);
  if (!order) notFound();
  const receipt = publicReceipt(order);
  return <PurchaseReceipt initial={receipt} token={token} demo={demoMode} />;
}
